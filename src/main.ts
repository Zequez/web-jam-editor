import "virtual:uno.css";
import { mount } from "svelte";
import SystemFrame from "./components/SystemFrame.svelte";
import Preview from "./components/Preview.svelte";
import SingleFileCoder from "./components/SingleFileCoder";

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
}

if (Comp) {
  mount(Comp as any, { target: document.getElementById("app")!, props });
}
