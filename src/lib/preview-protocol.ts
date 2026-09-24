/** Shared, structured messages for the virtual preview Service Worker. */
export const PREVIEW_NAMESPACE = "/__preview/";

export type ProviderRegistrationMessage = {
  type: "preview-provider-register";
  sessionId: string;
};

export type ProviderUnregistrationMessage = {
  type: "preview-provider-unregister";
  sessionId: string;
};

export type ProviderNeededMessage = {
  type: "preview-provider-needed";
  sessionId: string;
};

export type ProviderRegistrationReply = {
  type: "preview-provider-registered";
  sessionId: string;
};

export type FileReadRequest = {
  type: "preview-file-read";
  sessionId: string;
  requestId: string;
  path: string;
};

export type FileReadResponse =
  | {
      type: "preview-file-result";
      requestId: string;
      status: "ok";
      body: ArrayBuffer;
    }
  | {
      type: "preview-file-result";
      requestId: string;
      status: "missing" | "error";
      error?: string;
    };

export function isFileReadRequest(value: unknown): value is FileReadRequest {
  if (!isRecord(value)) return false;
  return (
    value.type === "preview-file-read" &&
    typeof value.sessionId === "string" &&
    typeof value.requestId === "string" &&
    typeof value.path === "string"
  );
}

export function isProviderNeededMessage(
  value: unknown,
): value is ProviderNeededMessage {
  return (
    isRecord(value) &&
    value.type === "preview-provider-needed" &&
    typeof value.sessionId === "string"
  );
}

export function isProviderRegistrationReply(
  value: unknown,
): value is ProviderRegistrationReply {
  return (
    isRecord(value) &&
    value.type === "preview-provider-registered" &&
    typeof value.sessionId === "string"
  );
}

export function isFileReadResponse(value: unknown): value is FileReadResponse {
  if (!isRecord(value) || value.type !== "preview-file-result") return false;
  if (typeof value.requestId !== "string" || typeof value.status !== "string") {
    return false;
  }
  if (value.status === "ok") return value.body instanceof ArrayBuffer;
  return value.status === "missing" || value.status === "error";
}

/** Returns a relative, slash-separated filesystem path, or null when unsafe. */
export function normalizeFilesystemPath(path: string): string | null {
  const pieces = path.split(/[\\/]+/);
  const normalized: string[] = [];

  for (const piece of pieces) {
    if (!piece || piece === ".") continue;
    if (piece === ".." || piece.includes("\0")) return null;
    normalized.push(piece);
  }

  return normalized.join("/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
