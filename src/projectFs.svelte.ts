import { fs } from "@zenfs/core";
import { WebAccess, type WebAccessFS, IndexedDB } from "@zenfs/dom";
import { onMount } from "svelte";
import { get, set } from "idb-keyval";

// Browser FS
// Local FS

type Project = {
  name: string;
  dir: FileSystemDirectoryHandle | null;
};

export function createProjectFsState(projectName: string) {
  // let browserFs = IndexedDB.create({
  //   storeName: projectName,
  // });
  let browserFs = $state<Awaited<typeof IndexedDB.create> | null>(null);
  let localFs = $state<WebAccessFS | null>(null);
  let dir = $state<FileSystemDirectoryHandle | null>(null);

  let stagingLocalDir:
    | { type: "inactive" }
    | { type: "checking"; dir: FileSystemDirectoryHandle; localFs: WebAccessFS }
    | { type: "mounted"; localFs: WebAccessFS } = $state({ type: "inactive" });

  function confirmLocalMount(action: "keepBrowser" | "keepLocal" | "cancel") {}

  function suggestedLocalMountAction() {
    // If directory empty, keep browser
    // If directory non-empty and browser empty, keep local
    // If directory non-empty and browser non-empty, ask
  }

  let loading = $state(true);
  onMount(async () => {
    dir = (await get(`project-${projectName}-dir`)) || null;
    console.log("DIR!", dir);
    await mountLocalDir();
    loading = false;
  });

  function saveDirHandle() {
    set(`project-${projectName}-dir`, dir);
  }

  async function mountLocalDir() {
    if (dir) {
      localFs = await WebAccess.create({ handle: dir });
    }
  }

  if (!fs.existsSync(projectName)) {
    fs.mkdirSync(projectName);
  }

  function readCreateFile(name: string) {
    try {
      return fs.readFileSync(`${projectName}/${name}`, "utf-8");
    } catch (e) {
      writeFile(name, "");
      return "";
    }
  }

  function writeFile(name: string, content: string) {
    fs.writeFileSync(`${projectName}/${name}`, content);
  }

  function mkdir(dirName: string) {
    fs.mkdirSync(`${projectName}/${dirName}`, { recursive: true });
  }

  async function requestDir() {
    dir = await window.showDirectoryPicker({
      mode: "readwrite",
    });

    if (dir) {
      saveDirHandle();
      mountLocalDir();
    }
  }

  function isLocallyMounted() {
    return localFs !== null;
  }

  function pushToLocal() {}

  function pullFromLocal() {}

  return {
    readCreateFile,
    writeFile,
    mkdir,
    requestDir,
    get isLocallyMounted() {
      return isLocallyMounted();
    },
    get localDirName() {
      return dir?.name;
    },
  };
}
