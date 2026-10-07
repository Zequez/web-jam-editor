import type * as Pug from "pug";
import YAML from "yaml";
import { extract } from "../atomic-css-extractor/extractAtomicCss.ts";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

export const INPUT_FILE = "index.pug";
export const OUTPUT_DIR = "www";

function processYaml(pugCode: string) {
  // crude first experiment
  return pugCode.replace(/^:yaml\n((?: {2}.*\n?)*)/gm, (_, body) => {
    const value = YAML.parse(body);

    return (
      Object.entries(value)
        .map(([key, value]) => `- const ${key} = ${JSON.stringify(value)}`)
        .join("\n") + "\n"
    );
  });
}

const filters = {
  markdown(text: string) {
    return md.render(text);
  },
};

export type CompileResult =
  | { type: "pug-error"; error: any }
  | { type: "success"; files: Record<string, string> };

export function buildCompiler(pug: typeof Pug) {
  return async function compile(pugCode: string): Promise<CompileResult> {
    const files: { [key: string]: string } = {};

    try {
      pugCode = processYaml(pugCode);
    } catch (e) {
      return {
        type: "pug-error",
        error: e,
      };
    }

    if (!pugCode.startsWith("doctype\n")) {
      pugCode = "doctype\n" + pugCode;
    }

    let output = "";
    try {
      const renderTemplate = pug.compile(pugCode, {
        compileDebug: false,
        inlineRuntimeFunctions: true,
        name: "template",
        filters,
      });
      output = renderTemplate({});
    } catch (e) {
      // console.error("Pug error!", e);
      return {
        type: "pug-error",
        error: e,
      };
    }

    output = output.replace("<!DOCTYPE html>", "");

    // console.log(output);

    const css = await extract(output);
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

    files["index.html"] = output;
    files["style.css"] = css;

    return { type: "success", files };
  };
}
