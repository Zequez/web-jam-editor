import "virtual:uno.css";
import "./lib/markdown.css";
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
  default: {
    Comp = SystemFrame;
  }
}

if (Comp) {
  mount(Comp as any, { target: document.getElementById("app")!, props });
}

// World turning icon

const phases = ["🌎", "🌏", "🌍"];

const metaTag = document.getElementById("world-icon")!;

let phase = Math.floor(Math.random() * phases.length);

setInterval(() => {
  phase = (phase + 1) % phases.length;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <text y=".9em" font-size="90">${phases[phase]}</text>
    </svg>
  `;

  metaTag.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(svg)}`);
}, 60000);
