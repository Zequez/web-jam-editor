import { SvelteMap } from "svelte/reactivity";
import { get, set, keys, del } from "idb-keyval";
import { getContext, onMount, setContext } from "svelte";
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
  isMounted: boolean; // Is not actually used
  error: string | null; // Is not actually used yet
};

export type StorageType =
  | { type: "dir"; handle: FileSystemDirectoryHandle }
  | { type: "mem"; storeName: string };

const MAP_KEY = "PROJECTS_MOUNTING_MAP";

export function createProjectsStorageService() {
  let state = $state<SystemState>({ type: "loading" });

  onMount(async () => {
    const storedEntries = await get<[string, LocalProject][]>(MAP_KEY);
    state = {
      type: "ready",
      config: new SvelteMap(storedEntries ?? []),
    };
  });

  $effect(() => {
    console.log("STATE CHANGED!");
    if (state.type !== "ready") return;
    const entries = Array.from(state.config.entries()).map(([key, value]) => [
      key,
      $state.snapshot(value),
    ]);
    // Read a reactive property of the map to establish a dependency.
    // config.size;

    console.log("Setting state config map");
    set(MAP_KEY, entries);
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
  }

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

  function deleteProject(pathName: string) {
    if (state.type !== "ready") {
      throw new Error("Not ready");
    }

    const project = state.config.get(pathName);
    if (!project) {
      throw new Error("Project not found");
    }

    // Ok this is placeholder stuff
    if (project.isMounted) {
      throw new Error("Project is mounted");
    }

    if (project.storage.type === "mem") {
      // Clean up indexed DB
      state.config.delete(pathName);
      indexedDB.deleteDatabase(project.storage.storeName);
    } else if (project.storage.type === "dir") {
      // Delete the filesystem link, it does not delete the folder
      state.config.delete(pathName);
    }
  }

  function renameProject(fromPathName: string, toPathName: string) {
    if (state.type !== "ready") {
      throw new Error("Not ready");
    }

    const source = state.config.get(fromPathName);
    if (!source) {
      throw new Error("Project not found");
    }

    const target = state.config.get(toPathName);
    if (target) {
      throw new Error("Project already exists");
    }

    state.config.set(toPathName, source);
    state.config.delete(fromPathName);
  }

  return {
    get state() {
      return state;
    },
    addProject,
    focusFs,
    deleteProject,
    renameProject,
    get fs() {
      return fs;
    },
  };
}

export type ProjectsStorageService = ReturnType<
  typeof createProjectsStorageService
>;

export function projectsStorageService_ANCHOR() {
  const store = createProjectsStorageService();
  setContext("projects-storage", store);
  return store;
}

export function projectsStorageService() {
  return getContext("projects-storage") as ProjectsStorageService;
}
