import { configureSingle, fs, InMemory } from "@zenfs/core";
import { WebAccess, IndexedDB } from "@zenfs/dom";
import { get, set } from "idb-keyval";
import { onMount } from "svelte";
import { defaultFiles } from "../lib/default-import";

type FsState =
  | { status: "loading" }
  | { status: "empty" }
  | {
      status: "ready";
      handler: FileSystemDirectoryHandle | null;
      fsType: "web-access" | "indexed-db";
      fs: typeof fs;
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
          fsType: "web-access",
          fs: await createFilesystem(dir),
        };
      } catch (e) {
        await clearSessionHandler();
      }
    } else {
      DIR = { status: "empty" };
    }
  }

  async function createFilesystem(dir: FileSystemDirectoryHandle) {
    const webAccessFs = await WebAccess.create({ handle: dir });
    await configureSingle(webAccessFs); // This actually sets the global filesystem
    return fs; // Let's pretend
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
    DIR = {
      status: "ready",
      handler: dir,
      fs: await createFilesystem(dir),
      fsType: "web-access",
    };
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

  async function loadEmptyFilesystem() {
    DIR = {
      status: "ready",
      handler: null,
      fsType: "indexed-db",
      fs: await createEmptyFilesystem(),
    };
  }

  async function createEmptyFilesystem() {
    const indexedFs = await IndexedDB.create({ storeName: "default" });
    await configureSingle(indexedFs);

    return fs;
  }

  async function createDefaultFilesystem() {
    const indexedFs = await IndexedDB.create({ storeName: "default" });
    await configureSingle(indexedFs);

    for (const [path, data] of Object.entries(defaultFiles)) {
      await fs.writeFile(
        path,
        await data,
        typeof data === "string" ? "utf8" : undefined,
      );
    }

    console.log("Loaded!", defaultFiles);

    return fs;
  }

  // async function loadFromZip() {

  //   const res = await fetch("/default-webjam.zip");
  //   zip.loadFromUrl("/webjam.zip");
  //   zip.extractAll();
  // }

  function loadDefault() {}

  return {
    pickSessionFolder,
    clearSession: clearSessionHandler,
    loadEmptyFilesystem,
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
      return DIR.status === "ready" ? DIR.handler?.name : null;
    },
  };
}
