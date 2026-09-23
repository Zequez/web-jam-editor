import { fs } from "@zenfs/core";
import pug from "./pug-browser.ts";

export const INPUT_FILE = "index.pug";
const OUTPUT_DIR = "www";

export async function build() {
  const index = fs.readFileSync(INPUT_FILE, "utf-8");
  const renderTemplate = pug.compile(index, {
    compileDebug: false,
    inlineRuntimeFunctions: true,
    name: "template",
  });
  const output = renderTemplate({});
  console.log(output);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(`${OUTPUT_DIR}/index.html`, output);
}
