import "virtual:uno.css";
import { mount } from "svelte";
import LexerExplorer from "./components/lexer-explorer";

mount(LexerExplorer, { target: document.getElementById("app")! });
