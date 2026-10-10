import { fs } from "@zenfs/core";
import {
  buildCompiler,
  INPUT_FILE,
  OUTPUT_DIR,
  type CompileResult,
} from "./compiler";
import pug from "./pug-browser.ts";

export { INPUT_FILE, OUTPUT_DIR };

export const compile = buildCompiler(pug);

export async function build(): Promise<CompileResult> {
  let index = fs.readFileSync(INPUT_FILE, "utf-8");
  const result = await compile(index);

  if (result.type === "pug-error") {
    console.error("Build error", result.error);
    return result;
  } else if (result.type === "success") {
    const files = result.files;
    // console.log("Saving files", files);
    for (let file in files) {
      let pathName = file.split("/");
      pathName.pop();
      fs.mkdirSync(`${OUTPUT_DIR}/${pathName.join("/")}`, { recursive: true });
      fs.writeFileSync(`${OUTPUT_DIR}/${file}`, files[file]!);
    }
    return result;
  } else {
    throw "Unhandled error type";
  }
}
