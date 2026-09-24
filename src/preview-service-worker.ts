/// <reference lib="webworker" />

import mime from "mime";
import {
  PREVIEW_NAMESPACE,
  type FileReadResponse,
  type FileReadRequest,
  type ProviderRegistrationMessage,
  type ProviderUnregistrationMessage,
} from "./lib/preview-protocol";

declare const self: ServiceWorkerGlobalScope;

const PROVIDER_TIMEOUT_MS = 5_000;
const providers = new Map<string, string>();

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const message = event.data as unknown;
  if (isProviderRegistration(message)) {
    const clientId = getClientId(event.source);
    if (!clientId) return;

    providers.set(message.sessionId, clientId);
    event.ports[0]?.postMessage({
      type: "preview-provider-registered",
      sessionId: message.sessionId,
    });
    return;
  }

  if (isProviderUnregistration(message)) {
    const clientId = getClientId(event.source);
    if (clientId && providers.get(message.sessionId) === clientId) {
      providers.delete(message.sessionId);
    }
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    !url.pathname.startsWith(PREVIEW_NAMESPACE) ||
    url.pathname === `${PREVIEW_NAMESPACE}service-worker.js`
  ) {
    return;
  }

  event.respondWith(handlePreviewRequest(event.request));
});

async function handlePreviewRequest(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const url = new URL(request.url);
  const isHeadRequest = request.method === "HEAD";
  const previewRequest = parsePreviewRequest(url);
  if (!previewRequest) return plainResponse(404, "Not Found", isHeadRequest);

  const candidates = resolveCandidates(
    previewRequest.path,
    previewRequest.hasTrailingSlash,
  );
  for (const candidate of candidates) {
    const file = await requestProviderFile(previewRequest.sessionId, candidate);
    if (file.status === "ok") return fileResponse(file.body, candidate, 200, isHeadRequest);
    if (file.status === "unavailable") return plainResponse(503, "Preview provider unavailable", isHeadRequest);
    // A filesystem error is not a missing path, so do not hide it as a 404.
    if (file.status === "error") return plainResponse(500, "Unable to read preview file", isHeadRequest);
  }

  const notFoundPage = await requestProviderFile(
    previewRequest.sessionId,
    "404.html",
  );
  if (notFoundPage.status === "ok") {
    return fileResponse(notFoundPage.body, "404.html", 404, isHeadRequest);
  }
  if (notFoundPage.status === "unavailable") {
    return plainResponse(503, "Preview provider unavailable", isHeadRequest);
  }
  if (notFoundPage.status === "error") {
    return plainResponse(500, "Unable to read preview file", isHeadRequest);
  }
  return plainResponse(404, "Not Found", isHeadRequest);
}

function parsePreviewRequest(
  url: URL,
): { sessionId: string; path: string[]; hasTrailingSlash: boolean } | null {
  const suffix = url.pathname.slice(PREVIEW_NAMESPACE.length);
  const rawParts = suffix.split("/");
  const rawSessionId = rawParts.shift();
  if (!rawSessionId) return null;

  const sessionId = decodeSegment(rawSessionId);
  if (!sessionId || !isSafeSegment(sessionId)) return null;

  const path: string[] = [];
  for (const rawPart of rawParts) {
    if (!rawPart) continue; // Normalise duplicate separators.
    const part = decodeSegment(rawPart);
    if (!part || !isSafeSegment(part)) return null;
    path.push(part);
  }

  return {
    sessionId,
    path,
    hasTrailingSlash: url.pathname.endsWith("/"),
  };
}

/** Candidate order: exact extensionless path, directory index, then .html. */
function resolveCandidates(path: string[], hasTrailingSlash: boolean): string[] {
  if (path.length === 0 || hasTrailingSlash) {
    return [[...path, "index.html"].join("/")];
  }

  const requested = path.join("/");
  if (hasExtension(path[path.length - 1]!)) return [requested];

  return [requested, `${requested}/index.html`, `${requested}.html`];
}

async function requestProviderFile(
  sessionId: string,
  path: string,
): Promise<
  | { status: "ok"; body: ArrayBuffer }
  | { status: "missing" | "error" | "unavailable" }
> {
  let clientId: string | null | undefined = providers.get(sessionId);
  if (!clientId) {
    await requestProviderRegistration(sessionId);
    clientId = await waitForProvider(sessionId);
    if (!clientId) return { status: "unavailable" };
  }

  const client = await self.clients.get(clientId);
  if (!client) {
    providers.delete(sessionId);
    await requestProviderRegistration(sessionId);
    return { status: "unavailable" };
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const requestId = crypto.randomUUID();
    const timeout = self.setTimeout(() => {
      channel.port1.close();
      resolve({ status: "unavailable" });
    }, PROVIDER_TIMEOUT_MS);

    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      const response = event.data as FileReadResponse;
      if (
        !isFileReadResponse(response) ||
        response.requestId !== requestId
      ) {
        return;
      }
      self.clearTimeout(timeout);
      channel.port1.close();
      if (response.status === "ok") {
        resolve({ status: "ok", body: response.body });
      } else {
        resolve({ status: response.status });
      }
    };

    const message: FileReadRequest = {
      type: "preview-file-read",
      sessionId,
      requestId,
      path,
    };
    client.postMessage(message, [channel.port2]);
  });
}

async function requestProviderRegistration(sessionId: string): Promise<void> {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) {
    client.postMessage({ type: "preview-provider-needed", sessionId });
  }
}

function fileResponse(
  body: ArrayBuffer,
  path: string,
  status: number,
  isHeadRequest: boolean,
): Response {
  return new Response(isHeadRequest ? null : body, {
    status,
    headers: {
      "Content-Type": mime.getType(path) ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}

function plainResponse(
  status: number,
  body: string,
  isHeadRequest: boolean,
): Response {
  return new Response(isHeadRequest ? null : body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function decodeSegment(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function isSafeSegment(value: string): boolean {
  return (
    value !== "." &&
    value !== ".." &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !value.includes("\0")
  );
}

function hasExtension(filename: string): boolean {
  const dot = filename.lastIndexOf(".");
  return dot > 0 && dot < filename.length - 1;
}

function isProviderRegistration(
  value: unknown,
): value is ProviderRegistrationMessage {
  return (
    isObject(value) &&
    value.type === "preview-provider-register" &&
    typeof value.sessionId === "string"
  );
}

function isProviderUnregistration(
  value: unknown,
): value is ProviderUnregistrationMessage {
  return (
    isObject(value) &&
    value.type === "preview-provider-unregister" &&
    typeof value.sessionId === "string"
  );
}

function isFileReadResponse(value: unknown): value is FileReadResponse {
  if (!isObject(value) || value.type !== "preview-file-result") return false;
  if (typeof value.requestId !== "string" || typeof value.status !== "string") {
    return false;
  }
  if (value.status === "ok") return value.body instanceof ArrayBuffer;
  return value.status === "missing" || value.status === "error";
}

async function waitForProvider(sessionId: string): Promise<string | null> {
  const deadline = Date.now() + PROVIDER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const clientId = providers.get(sessionId);
    if (clientId) return clientId;
    await new Promise<void>((resolve) => self.setTimeout(resolve, 25));
  }
  return null;
}

function getClientId(
  source: Client | MessagePort | ServiceWorker | null,
): string | null {
  return source && "id" in source && typeof source.id === "string"
    ? source.id
    : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
