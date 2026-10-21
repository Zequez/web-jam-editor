import { SvelteMap } from "svelte/reactivity";
import { get, set, keys, del } from "idb-keyval";
import { onMount } from "svelte";
import { IndexedDB, WebAccess } from "@zenfs/dom";
import { configureSingle, fs } from "@zenfs/core";

type SystemState =
  | {
      type: "loading";
    }
  | {
      type: "ready";
      config: MountingMap;
    };

export type MountingMap = SvelteMap<string, LocalProject>;

type LocalProject = {
  storage: StorageType;
  isMounted: boolean;
  error: string | null;
};

export type StorageType =
  | { type: "dir"; handle: FileSystemDirectoryHandle }
  | { type: "mem"; storeName: string };

const MAP_KEY = "PROJECTS_MOUNTING_MAP";

export function createProjectsStorage() {
  let state = $state<SystemState>({ type: "loading" });

  onMount(async () => {
    const storedMap = await get(MAP_KEY);
    let gottenMap: SvelteMap<string, LocalProject>;
    if (storedMap) {
      gottenMap = storedMap as SvelteMap<string, LocalProject>;
    } else {
      gottenMap = new SvelteMap();
    }

    // Check old storages and migrate them to the new store
    // const databases = await indexedDB.databases();

    // console.log(databases.map((db) => db.name));

    // Remove after 1.0
    async function migrateOldSystem() {
      const migrate = ["default", "default2", "empty", "foo", "scratchpad"];

      const databases = await indexedDB.databases();
      databases
        .map((db) => db.name)
        .forEach((name) => {
          if (migrate.includes(name!)) {
            if (gottenMap.get(name!)) {
              return;
            }
            gottenMap.set(name!, {
              storage: {
                type: "mem",
                storeName: name!,
              },
              isMounted: false,
              error: null,
            });
          }
        });

      const dirHandlesStored = (await keys()).filter((key) =>
        key.toString().match(/[0-9]+$/),
      );

      for (let dirHandleKey of dirHandlesStored) {
        const dirHandle = (await get(
          dirHandleKey,
        )) as FileSystemDirectoryHandle | null;

        if (dirHandle) {
          const isValid = await isValidDirectory(dirHandle);
          if (isValid) {
            const name = dirHandle.name;
            gottenMap.set(name, {
              storage: {
                type: "dir",
                handle: dirHandle,
              },
              isMounted: false,
              error: null,
            });
            del(dirHandleKey);
          } else {
            console.log("Removing invalid directory handle");
            del(dirHandleKey);
          }
        } else {
          console.log("Removing empty entry");
          del(dirHandleKey);
        }
      }
      console.log(dirHandlesStored);

      async function isValidDirectory(handle: FileSystemDirectoryHandle) {
        try {
          await handle.values().next();
          return true;
        } catch {
          return false;
        }
      }
    }

    await migrateOldSystem();

    state = { type: "ready", config: gottenMap };
  });

  $effect(() => {
    console.log("STATE CHANGED!");
    if (state.type === "ready") {
      // JSON.stringify(state.config);
      console.log("Setting state config map", state.config);
      // set(MAP_KEY, state.config);
    }
  });
  // });

  async function addProject(name: string, storage: StorageType) {
    console.log("Gotten added project!", name, storage);
    if (state.type !== "ready") {
      throw new Error("Not ready");
    }

    const currentProject = state.config.get(name);
    if (currentProject) {
      throw new Error("Project already exists");
    }

    if (storage.type === "mem") {
      storage.storeName = `${name}-${Math.random().toString(36).slice(2)}`;
    }

    state.config.set(name, {
      storage: storage,
      isMounted: false,
      error: null,
    });

    // set(MAP_KEY, state.config);

    // let storageType: StorageType;

    // if (storage.type === "dir") {
    //   storageType = {
    //     type: "dir",
    //     handle: await openDirectoryPicker(),
    //   };
    // } else if (storage.type === "mem") {
    //   storageType = {
    //     type: "mem",
    //     storeName: `${name}-${Math.random().toString(36).slice(2)}`,
    //   };
    // } else {
    //   throw new Error("Unknown storage type");
    // }
  }

  // function addMemProject() {

  // }

  // function addDirProject() {

  // }

  async function focusFs(projectName: string) {
    if (state.type !== "ready") {
      throw new Error("Not ready");
    }
    const project = state.config.get(projectName);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.storage.type === "dir") {
      return await focusDir(project.storage.handle);
    } else if (project.storage.type === "mem") {
      return await focusMem(project.storage.storeName);
    }
  }

  async function focusDir(dir: FileSystemDirectoryHandle) {
    const webAccessFs = await WebAccess.create({ handle: dir });
    await configureSingle(webAccessFs); // This actually sets the global filesystem
    return fs; // Let's pretend
  }

  async function focusMem(storeName: string) {
    const inMemoryFs = await IndexedDB.create({ storeName: storeName });
    await configureSingle(inMemoryFs); // This actually sets the global filesystem
    return fs; // Let's pretend
  }

  return {
    get state() {
      return state;
    },
    addProject,
    focusFs,
    get fs() {
      return fs;
    },
  };
}
