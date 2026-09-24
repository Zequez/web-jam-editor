import { PREVIEW_NAMESPACE, isPreviewClientRefreshMessage } from "./protocol";

const sessionId = getSessionId(location.pathname);

if (sessionId && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener(
    "message",
    (event: MessageEvent<unknown>) => {
      if (
        isPreviewClientRefreshMessage(event.data) &&
        event.data.sessionId === sessionId
      ) {
        location.reload();
      }
    },
  );

  void joinPreviewSession(sessionId);
}

async function joinPreviewSession(sessionId: string): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller ?? registration.active;
  worker?.postMessage({ type: "preview-client-join", sessionId });
}

function getSessionId(pathname: string): string | null {
  if (!pathname.startsWith(PREVIEW_NAMESPACE)) return null;

  const encodedSessionId = pathname
    .slice(PREVIEW_NAMESPACE.length)
    .split("/", 1)[0];
  if (!encodedSessionId) return null;

  try {
    const decodedSessionId = decodeURIComponent(encodedSessionId);
    return decodedSessionId && !decodedSessionId.includes("/")
      ? decodedSessionId
      : null;
  } catch {
    return null;
  }
}
