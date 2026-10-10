import "virtual:uno.css";
import "./lib/markdown.css";
import { mount } from "svelte";
import SystemFrame from "./components/SystemFrame.svelte";
import Preview from "./components/Preview.svelte";
import SingleFileCoder from "./components/SingleFileCoder";
import { changeWorld } from "./lib/world-icon-changer";

import IconTest from "./components/IconTest.svelte";

let Comp;
let props = {};

switch (location.pathname) {
  case "/": {
    Comp = SystemFrame;
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
  case "/icon-test": {
    Comp = IconTest;
    break;
  }
  default: {
    Comp = SystemFrame;
  }
}

if (Comp) {
  mount(Comp as any, { target: document.getElementById("app")!, props });
}

changeWorld(); // ;)
