<script lang="ts">
  import { onMount } from "svelte";
  import type { Fs } from "./lib/zen-fs-type";
  import {
    PREVIEW_NAMESPACE,
    isFileReadRequest,
    isProviderNeededMessage,
    isProviderRegistrationReply,
    normalizeFilesystemPath,
    type FileReadResponse,
  } from "./lib/preview-protocol";
  import Preview from "./Preview.svelte";

  const { fs, servePath }: { fs: Fs; servePath: string } = $props();

  let previewEl: Preview;

  const URL = "about:blank";
  const PROVIDER_TIMEOUT_MS = 5_000;

  let initializationError = $state<string | null>(null);

  export function refresh() {
    console.log("Refreshing preview");
    previewEl.refresh();
  }

  onMount(() => {
    if (!("serviceWorker" in navigator)) {
      initializationError = "Service Workers are unavailable in this browser.";
      console.error(initializationError);
      return;
    }

    let destroyed = false;
    const sessionId = createSessionId();
    const rootPath = normalizeFilesystemPath(servePath);
    let registration: ServiceWorkerRegistration | null = null;

    const registerProvider = async () => {
      if (destroyed || !registration || rootPath === null) return;
      const worker = await waitForActiveWorker(registration);
      await sendProviderRegistration(worker, sessionId);
    };

    const onServiceWorkerMessage = (event: MessageEvent<unknown>) => {
      if (!isProviderNeededMessage(event.data) || event.data.sessionId !== sessionId) {
        return;
      }
      void registerProvider().catch(reportInitializationError);
    };

    const onProviderRequest = (event: MessageEvent<unknown>) => {
      if (!isFileReadRequest(event.data)) return;
      const port = event.ports[0];
      if (!port || event.data.sessionId !== sessionId) return;
      respondToFileRequest(port, event.data, fs, rootPath);
    };

    navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);
    navigator.serviceWorker.addEventListener("message", onProviderRequest);

    const initialize = async () => {
      if (rootPath === null) {
        throw new Error(`Invalid preview serve path: ${servePath}`);
      }

      registration = await navigator.serviceWorker.register(
        `${PREVIEW_NAMESPACE}service-worker.js`,
        { scope: PREVIEW_NAMESPACE, type: "module" },
      );
      await registerProvider();

      if (!destroyed) {
        previewEl.go(
          `${location.origin}${PREVIEW_NAMESPACE}${encodeURIComponent(sessionId)}/`,
        );
      }
    };

    void initialize().catch(reportInitializationError);

    return () => {
      destroyed = true;
      navigator.serviceWorker.removeEventListener("message", onServiceWorkerMessage);
      navigator.serviceWorker.removeEventListener("message", onProviderRequest);
      registration?.active?.postMessage({
        type: "preview-provider-unregister",
        sessionId,
      });
    };
  });

  function reportInitializationError(error: unknown) {
    initializationError =
      error instanceof Error ? error.message : "Unable to start preview server.";
    console.error("Unable to start preview server", error);
  }

  async function waitForActiveWorker(
    registration: ServiceWorkerRegistration,
  ): Promise<ServiceWorker> {
    if (registration.active) return registration.active;

    return new Promise((resolve, reject) => {
      const worker = registration.installing ?? registration.waiting;
      if (!worker) {
        reject(new Error("Preview Service Worker did not start."));
        return;
      }

      const timeout = window.setTimeout(() => {
        worker.removeEventListener("statechange", checkState);
        reject(new Error("Preview Service Worker activation timed out."));
      }, PROVIDER_TIMEOUT_MS);

      const checkState = () => {
        if (registration.active) {
          window.clearTimeout(timeout);
          worker.removeEventListener("statechange", checkState);
          resolve(registration.active);
        }
      };
      worker.addEventListener("statechange", checkState);
      checkState();
    });
  }

  function sendProviderRegistration(worker: ServiceWorker, sessionId: string) {
    return new Promise<void>((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => {
        channel.port1.close();
        reject(new Error("Preview Service Worker did not acknowledge its provider."));
      }, PROVIDER_TIMEOUT_MS);

      channel.port1.onmessage = (event: MessageEvent<unknown>) => {
        if (
          isProviderRegistrationReply(event.data) &&
          event.data.sessionId === sessionId
        ) {
          window.clearTimeout(timeout);
          channel.port1.close();
          resolve();
        }
      };

      worker.postMessage(
        { type: "preview-provider-register", sessionId },
        [channel.port2],
      );
    });
  }

  function respondToFileRequest(
    port: MessagePort,
    request: { requestId: string; path: string },
    filesystem: Fs,
    rootPath: string | null,
  ) {
    const relativePath = normalizeFilesystemPath(request.path);
    let response: FileReadResponse;

    if (rootPath === null || !relativePath || relativePath !== request.path) {
      response = {
        type: "preview-file-result",
        requestId: request.requestId,
        status: "missing",
      };
    } else {
      const path = [rootPath, relativePath].filter(Boolean).join("/");
      try {
        if (!filesystem.existsSync(path) || !filesystem.statSync(path).isFile()) {
          response = {
            type: "preview-file-result",
            requestId: request.requestId,
            status: "missing",
          };
        } else {
          const body = new Uint8Array(filesystem.readFileSync(path)).slice().buffer;
          response = {
            type: "preview-file-result",
            requestId: request.requestId,
            status: "ok",
            body,
          };
        }
      } catch (error) {
        console.error(`Unable to read preview file ${path}`, error);
        response = {
          type: "preview-file-result",
          requestId: request.requestId,
          status: "error",
          error: error instanceof Error ? error.message : "Filesystem read failed",
        };
      }
    }

    if (response.status === "ok") {
      port.postMessage(response, [response.body]);
    } else {
      port.postMessage(response);
    }
    port.close();
  }

  function createSessionId() {
    return crypto.randomUUID();
  }
</script>

<div class="size-full">
  <Preview initialValue={URL} bind:this={previewEl} />
  {#if initializationError}
    <div class="text-red-700 text-3/6 p-1">{initializationError}</div>
  {/if}
</div>
