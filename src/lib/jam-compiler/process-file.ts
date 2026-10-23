import { fs } from "@zenfs/core";
import { type CompileResult } from "./process-code.ts";

import processCode from "./process-code.ts";

export async function processFile(
  fileName: string,
  outputDir: string,
): Promise<CompileResult> {
  console.log(`Processing ${fileName}`);
  let fileContent = fs.readFileSync(fileName, "utf-8");
  const result = await processCode(fileContent);

  if (result.type === "code-error") {
    console.error("Build error", result.error);
    return result;
  } else if (result.type === "success") {
    const files = result.files;
    // console.log("Saving files", files);
    for (let file in files) {
      let pathName = file.split("/");
      pathName.pop();
      fs.mkdirSync(`${outputDir}/${pathName.join("/")}`, { recursive: true });
      fs.writeFileSync(`${outputDir}/${file}`, files[file]!);
    }
    return result;
  } else {
    throw "Unhandled error type";
  }
}
