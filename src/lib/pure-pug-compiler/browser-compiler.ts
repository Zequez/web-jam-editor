import { fs } from "@zenfs/core";
import { buildCompiler, INPUT_FILE, OUTPUT_DIR } from "./compiler";
import pug from "./pug-browser.ts";

export { INPUT_FILE, OUTPUT_DIR };

export const compile = buildCompiler(pug);

export async function build() {
  let index = fs.readFileSync(INPUT_FILE, "utf-8");
  const files = await compile(index);

  for (let file in files) {
    let pathName = file.split("/");
    pathName.pop();
    fs.mkdirSync(`${OUTPUT_DIR}/${pathName.join("/")}`, { recursive: true });
    fs.writeFileSync(`${OUTPUT_DIR}/${file}`, files[file]!);
  }

  // console.log(output);
  console.log("Finished build!");
}
