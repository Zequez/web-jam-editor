import type * as Pug from "pug";
import YAML from "yaml";
import { extract } from "../atomic-css-extractor/extractAtomicCss.ts";
import MarkdownIt from "markdown-it";
import { preprocessPug } from "./atomic-class-transformer.ts";

const $ = htmlparser2.DomUtils;

import * as htmlparser2 from "htmlparser2";
import {
  Element,
  type ChildNode,
  type ParentNode,
  type Document,
} from "domhandler";
import { render } from "dom-serializer";
import { generateIconsFontCss, scanForIcons } from "../icons-engine.ts";

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

    pugCode = forceDoctype(pugCode);
    pugCode += `\nmeta(name="cname" value=CNAME)`;

    try {
      pugCode = preprocessPug(pugCode);
    } catch (e) {
      return {
        type: "pug-error",
        error: e,
      };
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
      return {
        type: "pug-error",
        error: e,
      };
    }

    console.log(output);

    let iconsFileName: string = "";
    const foundIcons = scanForIcons(output);
    if (Object.values(foundIcons).some((icons) => icons.length)) {
      const startTime = Date.now();
      let iconsCss: string;
      try {
        iconsCss = await generateIconsFontCss(foundIcons);
      } catch (e) {
        return {
          type: "pug-error",
          error: e,
        };
      }
      const endTime = Date.now();
      console.log("Generated icons font in ", endTime - startTime, "ms");

      iconsFileName = "icons.css";
      files[iconsFileName] = iconsCss;
    }

    const dom = htmlparser2.parseDocument(output);
    const cname = $.findOne(
      (elem) =>
        elem.type === "tag" &&
        elem.name === "meta" &&
        elem.attribs.name === "cname",
      dom,
    );

    if (cname && cname.attribs.value) {
      files["CNAME"] = cname.attribs.value;
      $.removeElement(cname);
    }

    output = stripDoctypes(output);
    const roots = ensureHTMLRoot(dom);

    for (const root of roots) {
      let outputRoot = ensureHeadAndBody(root as Element);
      outputRoot = injectStylesheetTagBeforeHead(outputRoot, "style.css");
      if (iconsFileName) {
        outputRoot = injectStylesheetTagBeforeHead(outputRoot, iconsFileName);
      }
      const pageName =
        htmlparser2.DomUtils.getAttributeValue(outputRoot, "name") || "index";
      const outputHtml = render(outputRoot);

      files[pageName === "index" ? "index.html" : `${pageName}/index.html`] =
        `<!DOCTYPE html>${outputHtml}`;
    }

    const [tokens, css] = await extract(output);

    files["style.css"] = css;

    return { type: "success", files };
  };
}

function injectStylesheetTagBeforeHead(root: Element, href: string) {
  const head = root.children.find(
    (child) => child instanceof Element && child.name === "head",
  )!;

  if (!head) {
    throw new Error("Expected <head> to exist");
  }

  const link = new Element("link", {
    rel: "stylesheet",
    href,
  });

  htmlparser2.DomUtils.prependChild(head as ParentNode, link);

  return root;
}

function ensureHeadAndBody(root: Element) {
  let head = htmlparser2.DomUtils.getElementsByTagName(
    "head",
    root.children,
    true,
  )[0];

  let body = htmlparser2.DomUtils.getElementsByTagName(
    "body",
    root.children,
    true,
  )[0];

  if (!head) {
    head = new Element("head", {});
    htmlparser2.DomUtils.prependChild(root, head);
  }

  if (!body) {
    body = new Element("body", {});
    htmlparser2.DomUtils.appendChild(root, body);
  }

  // Move every direct child that isn't <head> or <body> into <body>.
  for (const child of [...root.children]) {
    if (child !== head && child !== body) {
      htmlparser2.DomUtils.removeElement(child);
      htmlparser2.DomUtils.appendChild(body, child);
    }
  }

  return root;
}

function forceDoctype(code: string) {
  if (!code.startsWith("doctype\n")) {
    return "doctype\n" + code;
  }
  return code;
}

function stripDoctypes(code: string) {
  return code.replace(/<!DOCTYPE html>/g, "");
}

function ensureHTMLRoot(dom: Document): ChildNode[] {
  const existingHTMLs = dom.children.filter(
    (node) => node instanceof Element && node.name === "html",
  );

  if (existingHTMLs.length > 0) {
    return existingHTMLs;
  }

  const html = new Element("html", {});

  for (const child of [...dom.children]) {
    htmlparser2.DomUtils.removeElement(child);
    htmlparser2.DomUtils.appendChild(html, child);
  }

  htmlparser2.DomUtils.appendChild(dom, html);

  return [html];
}
