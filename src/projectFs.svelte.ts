import { fs } from "@zenfs/core";
// import { onMount } from "svelte";

export function createProjectFsState(projectName: string) {
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

  return {
    readCreateFile,
    writeFile,
    mkdir,
  };
}
