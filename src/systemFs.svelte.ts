import { WebAccess, type WebAccessFS } from "@zenfs/dom";
import { get, set } from "idb-keyval";
import { onMount } from "svelte";

type FsState =
  | { status: "loading" }
  | { status: "empty" }
  | {
      status: "ready";
      handler: FileSystemDirectoryHandle;
      fs: WebAccessFS;
    };

export function createSystemFs() {
  let DIR: FsState = $state({ status: "loading" });

  onMount(async () => {
    await restoreFilesystemFromSession();
  });

  async function restoreFilesystemFromSession() {
    const dir = await extractSessionHandler();
    if (dir) {
      try {
        DIR = {
          status: "ready",
          handler: dir,
          fs: await createFilesystem(dir),
        };
      } catch (e) {
        await clearSessionHandler();
      }
    } else {
      DIR = { status: "empty" };
    }
  }

  function createFilesystem(dir: FileSystemDirectoryHandle) {
    return WebAccess.create({ handle: dir });
  }

  async function clearSessionHandler() {
    const handlerKey = sessionStorage.getItem("session-dir-handler");
    if (handlerKey) {
      await set(handlerKey, null);
      sessionStorage.removeItem("session-dir-handler");
    }
    DIR = { status: "empty" };
    console.log("Session cleared", DIR);
  }

  async function pickSessionFolder() {
    const dir = await window.showDirectoryPicker({
      mode: "readwrite",
    });
    await storeSessionHandler(dir);
    DIR = { status: "ready", handler: dir, fs: await createFilesystem(dir) };
  }

  async function storeSessionHandler(dir: FileSystemDirectoryHandle) {
    const handlerKey = dir.name + "-" + Date.now();

    sessionStorage.setItem("session-dir-handler", handlerKey);
    await set(handlerKey, dir);
  }

  async function extractSessionHandler() {
    const handlerKey = sessionStorage.getItem("session-dir-handler");
    if (handlerKey) {
      return (
        ((await get(handlerKey)) as FileSystemDirectoryHandle | undefined) ||
        null
      );
    } else {
      return null;
    }
  }

  return {
    pickSessionFolder,
    clearSession: clearSessionHandler,
    get status() {
      return DIR.status;
    },
    get isLoading() {
      return DIR.status === "loading";
    },
    get fs() {
      return DIR.status === "ready" ? DIR.fs : null;
    },
    get dirName() {
      return DIR.status === "ready" ? DIR.handler.name : null;
    },
  };
}
