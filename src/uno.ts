import { createGenerator, type UnoGenerator } from "@unocss/core";
import unoConfig from "./uno-browser-config.ts";
let uno: UnoGenerator = null!;

export async function init() {
  uno = await createGenerator(unoConfig);
}

export default {
  get uno() {
    return uno;
  },
};
