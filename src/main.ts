import "virtual:uno.css";
import { mount } from "svelte";
// import App from "./App.svelte";
import App from "./App.svelte";
import Preview from "./Preview.svelte";
import SingleFileCoder from "./SingleFileCoder";
import ProjectEditor from "./ProjectEditor.svelte";

import { init } from "./uno";

import { configureSingle } from "@zenfs/core";
import { IndexedDB } from "@zenfs/dom";

await configureSingle({ backend: IndexedDB });
await init();

let Comp;
let props = {};

switch (location.pathname) {
  case "/": {
    Comp = App;
    break;
  }
  case "/preview": {
    Comp = Preview;
    break;
  }
  case "/single-file-coder": {
    Comp = SingleFileCoder;
    props = { value: "" };
    break;
  }
  case "/project-editor": {
    Comp = ProjectEditor;
    break;
  }
}

if (Comp) {
  mount(Comp as any, { target: document.getElementById("app")!, props });
}
