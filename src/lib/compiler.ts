import { fs } from "@zenfs/core";
import pug from "./pug-browser.ts";
import { extractAtomicCss } from "./extractAtomicCss.ts";

export const INPUT_FILE = "index.pug";
const OUTPUT_DIR = "www";

export async function build() {
  let index = fs.readFileSync(INPUT_FILE, "utf-8");

  if (!index.startsWith("doctype\n")) {
    index = "doctype\n" + index;
  }

  let output = "";
  try {
    const renderTemplate = pug.compile(index, {
      compileDebug: false,
      inlineRuntimeFunctions: true,
      name: "template",
    });
    output = renderTemplate({});
  } catch (e) {
    console.error("Pug error!", e);
    return;
  }

  output = output.replace("<!DOCTYPE html>", "");

  // console.log(output);

  const css = await extractAtomicCss(output);
  // console.log(css);

  const styleImport = `<link rel="stylesheet" href="style.css">`;

  const hasHtml = output.match("<html>");
  const hasBody = output.match("<body");
  const hasHead = output.match("<head>");

  if (!hasHead && !hasBody) {
    output = `<head>${styleImport}</head><body>${output}</body>`;
  } else if (!hasHead && hasBody) {
    output = `<head>${styleImport}</head>${output}`;
  } else if (hasHead && !hasBody) {
    output = output.replace(/<\/head>/, `${styleImport}</head>`);
    const i = output.indexOf("</head>");
    output = output.slice(0, i) + `<body>${output.slice(i + 7)}</body>`;
  } else {
    output = output.replace(/<\/head>/, `${styleImport}</head>`);
  }

  if (!hasHtml) {
    output = `<html>${output}</html>`;
  }

  // if (!output.match("<body>"))
  //   if (!output.match("<head>")) {
  //     output = output.replace("<html>", `<html><head>${styleImport}</head>`);
  //   } else {
  //     output = output.replace("</head>", `${styleImport}</head>`);
  //   }

  if (!output.startsWith("<!DOCTYPE")) {
    output = `<!DOCTYPE html>${output}`;
  }

  console.log(output);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(`${OUTPUT_DIR}/index.html`, output);
  fs.writeFileSync(`${OUTPUT_DIR}/style.css`, css);
}
