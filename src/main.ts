import "virtual:uno.css";
import { mount } from "svelte";
// import App from "./App.svelte";
import App from "./ProjectEditor.svelte";
import { init } from "./uno";

import { configureSingle } from "@zenfs/core";
import { IndexedDB } from "@zenfs/dom";

await configureSingle({ backend: IndexedDB });
await init();

mount(App, { target: document.getElementById("app")! });
