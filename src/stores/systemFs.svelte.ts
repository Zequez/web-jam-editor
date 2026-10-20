import { configureSingle, fs, InMemory } from "@zenfs/core";
import { WebAccess, IndexedDB } from "@zenfs/dom";
import { get, set } from "idb-keyval";
import { onMount } from "svelte";
import { defaultFiles } from "../lib/default-import";
import type { Fs } from "@/lib/zen-fs-type";

type FsState =
  | { status: "loading" }
  | { status: "empty" }
  | {
      status: "ready";
      handler: FileSystemDirectoryHandle | null;
      name: string;
      fsType: "web-access" | "indexed-db";
      fs: typeof fs;
    };

export function createSystemFs() {
  let DIR: FsState = $state({ status: "loading" });
  let sessionID = crypto.randomUUID();

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
          name: dir.name,
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
      name: dir.name,
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
      name: "empty",
      fs: await createEmptyFilesystem("empty"),
    };
  }

  async function loadTemplateFilesystem(name = "default") {
    const templateFs = await createEmptyFilesystem(name);

    if (name === "default") {
      await fillWithDefaultFiles(templateFs);
    } else if (name === "foo") {
      await templateFs.promises.writeFile("index.pug", "div Foo", "utf8");
    }

    DIR = {
      status: "ready",
      handler: null,
      name: name,
      fsType: "indexed-db",
      fs: templateFs,
    };
  }

  async function createEmptyFilesystem(name: string) {
    const indexedFs = await IndexedDB.create({ storeName: name });
    await configureSingle(indexedFs);

    return fs;
  }

  async function fillWithDefaultFiles(fs: Fs) {
    if (!fs.existsSync("/assets")) {
      await fs.promises.mkdir("/assets");
    }

    for (const [path, data] of Object.entries(defaultFiles)) {
      const awaitedData = await data;
      // console.log(path, data, awaitedData);
      await fs.promises.writeFile(
        path,
        awaitedData,
        typeof awaitedData === "string" ? "utf8" : undefined,
      );
    }

    return fs;
  }

  async function saveToFolder() {}

  function _debug_readAllFiles(dirPath: string) {
    const entries = fs.readdirSync(dirPath, {
      withFileTypes: true,
      recursive: true,
    });

    for (const entry of entries) {
      console.log(entry);
    }
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
    loadTemplateFilesystem,
    get sessionID() {
      return sessionID;
    },
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
    get name() {
      return DIR.status === "ready" ? DIR.name : null;
    },
  };
}
