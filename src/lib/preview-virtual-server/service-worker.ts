/// <reference lib="webworker" />

import mime from "mime";
import {
  PREVIEW_NAMESPACE,
  PREVIEW_REFRESH_CLIENT_PATH,
  type FileReadResponse,
  type FileReadRequest,
  type PreviewClientJoinMessage,
  type PreviewSessionRefreshMessage,
  type ProviderRegistrationMessage,
  type ProviderUnregistrationMessage,
} from "./protocol";

declare const self: ServiceWorkerGlobalScope;

const PROVIDER_TIMEOUT_MS = 5_000;
const providers = new Map<string, string>();
const previewClients = new Map<string, Set<string>>();
const clientSessions = new Map<string, string>();

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
    return;
  }

  if (isPreviewClientJoin(message)) {
    const clientId = getClientId(event.source);
    if (clientId) joinPreviewClient(message.sessionId, clientId);
    return;
  }

  if (isPreviewSessionRefresh(message)) {
    event.waitUntil(refreshPreviewClients(message.sessionId));
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    !url.pathname.startsWith(PREVIEW_NAMESPACE) ||
    url.pathname === `${PREVIEW_NAMESPACE}service-worker.js` ||
    url.pathname === PREVIEW_REFRESH_CLIENT_PATH
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
    if (file.status === "ok")
      return fileResponse(file.body, candidate, 200, isHeadRequest);
    if (file.status === "unavailable")
      return plainResponse(503, "Preview provider unavailable", isHeadRequest);
    // A filesystem error is not a missing path, so do not hide it as a 404.
    if (file.status === "error")
      return plainResponse(500, "Unable to read preview file", isHeadRequest);
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
function resolveCandidates(
  path: string[],
  hasTrailingSlash: boolean,
): string[] {
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
      if (!isFileReadResponse(response) || response.requestId !== requestId) {
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
  const contentType = mime.getType(path) ?? "application/octet-stream";
  const responseBody = isHeadRequest
    ? null
    : isHtml(contentType)
      ? injectRefreshClient(body)
      : body;

  return new Response(responseBody, {
    status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}

function injectRefreshClient(body: ArrayBuffer): ArrayBuffer {
  const script = `<script type="module" src="${PREVIEW_REFRESH_CLIENT_PATH}"></script>`;
  const html = new TextDecoder().decode(body);
  const closingHead = /<\/head\s*>/i;
  const closingBody = /<\/body\s*>/i;

  if (closingHead.test(html)) {
    return new TextEncoder().encode(
      html.replace(closingHead, `${script}</head>`),
    ).buffer;
  }
  if (closingBody.test(html)) {
    return new TextEncoder().encode(
      html.replace(closingBody, `${script}</body>`),
    ).buffer;
  }
  return new TextEncoder().encode(`${html}${script}`).buffer;
}

function isHtml(contentType: string): boolean {
  return contentType.split(";", 1)[0] === "text/html";
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

function isPreviewClientJoin(
  value: unknown,
): value is PreviewClientJoinMessage {
  return (
    isObject(value) &&
    value.type === "preview-client-join" &&
    typeof value.sessionId === "string"
  );
}

function isPreviewSessionRefresh(
  value: unknown,
): value is PreviewSessionRefreshMessage {
  return (
    isObject(value) &&
    value.type === "preview-session-refresh" &&
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

function joinPreviewClient(sessionId: string, clientId: string) {
  const previousSessionId = clientSessions.get(clientId);
  if (previousSessionId && previousSessionId !== sessionId) {
    removePreviewClient(previousSessionId, clientId);
  }

  clientSessions.set(clientId, sessionId);
  let clients = previewClients.get(sessionId);
  if (!clients) {
    clients = new Set();
    previewClients.set(sessionId, clients);
  }
  clients.add(clientId);
}

async function refreshPreviewClients(sessionId: string): Promise<void> {
  const clientIds = previewClients.get(sessionId);
  if (!clientIds) return;

  await Promise.all(
    [...clientIds].map(async (clientId) => {
      const client = await self.clients.get(clientId);
      if (!client) {
        removePreviewClient(sessionId, clientId);
        return;
      }
      client.postMessage({ type: "preview-client-refresh", sessionId });
    }),
  );
}

function removePreviewClient(sessionId: string, clientId: string) {
  const clients = previewClients.get(sessionId);
  clients?.delete(clientId);
  if (clients?.size === 0) previewClients.delete(sessionId);
  if (clientSessions.get(clientId) === sessionId)
    clientSessions.delete(clientId);
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
