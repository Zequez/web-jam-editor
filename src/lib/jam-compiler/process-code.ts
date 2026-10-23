import YAML from "yaml";
import { extract } from "./lib/atomic-css-extractor/extractAtomicCss.ts";
import MarkdownIt from "markdown-it";
import { preprocessPug } from "./lib/atomic-class-transformer.ts";
import pug from "./lib/pug-browser.ts";

const $D = htmlparser2.DomUtils;

import * as htmlparser2 from "htmlparser2";
import {
  Element,
  type ChildNode,
  type ParentNode,
  type Document,
  Text,
} from "domhandler";
import { render } from "dom-serializer";
import { generateIconsFontCss, scanForIcons } from "./lib/icons-engine.ts";

const md = new MarkdownIt();

type CodeError = { type: "code-error"; error: any };
type CompileSuccess = { type: "success"; files: Record<string, string> };

export type CompileResult = CodeError | CompileSuccess;

function CODE_ERR<T>(e: T): CodeError {
  return {
    type: "code-error",
    error: e,
  };
}

function COMPILE_RESULT(files: Record<string, string>): CompileSuccess {
  return { type: "success", files };
}

// MARK: ERR

export default async function processCode(
  code: string,
): Promise<CompileResult> {
  // Code Analysis
  const linesAmount = code.split("\n").length;
  const bytes = code.length;
  const kbytes = bytes / 1024;
  const sizeLabel =
    kbytes < 1
      ? `${bytes} bytes`
      : `${Math.round(kbytes * 100) / 100} KiloBytes`;
  console.log(`Processing ${linesAmount} lines of code (${sizeLabel})`);
  const processingStart = +new Date();

  try {
    const compileResult = await attemptCompilation(code);
    return compileResult;
  } catch (e: any) {
    return { type: "code-error", error: e };
  } finally {
    const processingEnd = +new Date();
    const processTime = processingEnd - processingStart;
    console.log("Compilation took ", processTime, "ms");
  }
}

// MARK: COMP

async function attemptCompilation(code: string) {
  let timeMarks: [label: string, timestamp: number][] = [];
  const CLOCK = (label: string) => timeMarks.push([label, +new Date()]);
  const files: { [key: string]: string } = {};
  CLOCK("START");

  // ╔╦╗╔═╗╔═╗╔╦╗╦ ╦╔═╗╔═╗
  //  ║║║ ║║   ║ ╚╦╝╠═╝║╣
  // ═╩╝╚═╝╚═╝ ╩  ╩ ╩  ╚═╝

  code = forceDoctype(code);

  // ╔═╗╔╗╔╔═╗╔╦╗╔═╗
  // ║  ║║║╠═╣║║║║╣
  // ╚═╝╝╚╝╩ ╩╩ ╩╚═╝

  code += `\nmeta(name="cname" value=CNAME)`;

  // ██╗   ██╗ █████╗ ███╗   ███╗██╗
  // ╚██╗ ██╔╝██╔══██╗████╗ ████║██║
  //  ╚████╔╝ ███████║██╔████╔██║██║
  //   ╚██╔╝  ██╔══██║██║╚██╔╝██║██║
  //    ██║   ██║  ██║██║ ╚═╝ ██║███████╗
  //    ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
  // MARK: YAML

  CLOCK("YAML");
  try {
    code = processYaml(code);
  } catch (e) {
    return CODE_ERR(e);
  }

  //  ██████╗ ██████╗ ███████╗    ██████╗ ██╗   ██╗ ██████╗
  //  ██╔══██╗██╔══██╗██╔════╝    ██╔══██╗██║   ██║██╔════╝
  //  ██████╔╝██████╔╝█████╗█████╗██████╔╝██║   ██║██║  ███╗
  //  ██╔═══╝ ██╔══██╗██╔══╝╚════╝██╔═══╝ ██║   ██║██║   ██║
  //  ██║     ██║  ██║███████╗    ██║     ╚██████╔╝╚██████╔╝
  //  ╚═╝     ╚═╝  ╚═╝╚══════╝    ╚═╝      ╚═════╝  ╚═════╝
  // MARK: 0PUG

  CLOCK("PRE-PUG");
  try {
    code = preprocessPug(code);
  } catch (e) {
    return CODE_ERR(e);
  }

  // ██████╗ ██╗   ██╗ ██████╗
  // ██╔══██╗██║   ██║██╔════╝
  // ██████╔╝██║   ██║██║  ███╗
  // ██╔═══╝ ██║   ██║██║   ██║
  // ██║     ╚██████╔╝╚██████╔╝
  // ╚═╝      ╚═════╝  ╚═════╝
  // MARK: PUG

  CLOCK("PUG");
  let output = "";
  try {
    const renderTemplate = pug.compile(code, {
      compileDebug: false,
      inlineRuntimeFunctions: true,
      name: "template",
      filters,
    });
    output = renderTemplate({});
  } catch (e) {
    return CODE_ERR(e);
  }

  // ██╗ ██████╗ ██████╗ ███╗   ██╗███████╗
  // ██║██╔════╝██╔═══██╗████╗  ██║██╔════╝
  // ██║██║     ██║   ██║██╔██╗ ██║███████╗
  // ██║██║     ██║   ██║██║╚██╗██║╚════██║
  // ██║╚██████╗╚██████╔╝██║ ╚████║███████║
  // ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
  // MARK: ICONS

  CLOCK("ICONS");
  let iconsFileName: string = "";
  const foundIcons = scanForIcons(output);
  if (Object.values(foundIcons).some((icons) => icons.length)) {
    const startTime = Date.now();
    let iconsCss: string;
    try {
      iconsCss = await generateIconsFontCss(foundIcons);
    } catch (e) {
      return CODE_ERR(e);
    }
    const endTime = Date.now();
    console.log("Generated icons font in ", endTime - startTime, "ms");

    iconsFileName = "icons.css";
    files[iconsFileName] = iconsCss;
  }

  const dom = htmlparser2.parseDocument(output);

  //  ██████╗███╗   ██╗ █████╗ ███╗   ███╗███████╗
  // ██╔════╝████╗  ██║██╔══██╗████╗ ████║██╔════╝
  // ██║     ██╔██╗ ██║███████║██╔████╔██║█████╗
  // ██║     ██║╚██╗██║██╔══██║██║╚██╔╝██║██╔══╝
  // ╚██████╗██║ ╚████║██║  ██║██║ ╚═╝ ██║███████╗
  //  ╚═════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
  // MARK: CNAM

  CLOCK("CNAME");
  const cname = $D.findOne(
    (elem) =>
      elem.type === "tag" &&
      elem.name === "meta" &&
      elem.attribs.name === "cname",
    dom,
  );

  if (cname && cname.attribs.value) {
    files["CNAME"] = cname.attribs.value;
    $D.removeElement(cname);
  }

  // CLEAN-UP
  output = stripDoctypes(output);

  // ███╗   ███╗██╗   ██╗██╗  ████████╗██╗    ██████╗  █████╗  ██████╗ ███████╗███████╗
  // ████╗ ████║██║   ██║██║  ╚══██╔══╝██║    ██╔══██╗██╔══██╗██╔════╝ ██╔════╝██╔════╝
  // ██╔████╔██║██║   ██║██║     ██║   ██║    ██████╔╝███████║██║  ███╗█████╗  ███████╗
  // ██║╚██╔╝██║██║   ██║██║     ██║   ██║    ██╔═══╝ ██╔══██║██║   ██║██╔══╝  ╚════██║
  // ██║ ╚═╝ ██║╚██████╔╝███████╗██║   ██║    ██║     ██║  ██║╚██████╔╝███████╗███████║
  // ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚═╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝
  // MARK: PAGES

  const roots = ensureHTMLRoot(dom);

  CLOCK("MULTI-PAGES");
  for (const root of roots) {
    let outputRoot = ensureHeadAndBody(root as Element);
    outputRoot = injectBaseAtBeginingOfHead(outputRoot);
    outputRoot = injectStylesheetTagBeforeHeadEnd(outputRoot, "style.css");
    if (iconsFileName) {
      outputRoot = injectStylesheetTagBeforeHeadEnd(outputRoot, iconsFileName);
    }
    outputRoot = injectScriptShortcutsBeforeHead(outputRoot);
    const pageName = $D.getAttributeValue(outputRoot, "name") || "index";
    const outputHtml = render(outputRoot, { encodeEntities: false });

    files[pageName === "index" ? "index.html" : `${pageName}/index.html`] =
      `<!DOCTYPE html>${outputHtml}`;
  }

  CLOCK("ATOMIC-CSS");

  const [tokens, css] = await extract(output);

  files["style.css"] = css;

  CLOCK("END");
  let report = "Compilation Performance:\n";
  let total = 0;
  for (let i = 0; i < timeMarks.length - 1; ++i) {
    const [label, timestamp] = timeMarks[i]!;
    const [_, prevTimestamp] = i > 0 ? timeMarks[i - 1]! : ["", timestamp];

    const timelapse = timestamp - prevTimestamp;
    report += `   ${label} ${timelapse}ms\n`;
    total += timelapse;
  }
  report += `TOTAL ${total}ms`;
  console.log(report);

  return COMPILE_RESULT(files);
}

// ██╗   ██╗████████╗██╗██╗     ███████╗
// ██║   ██║╚══██╔══╝██║██║     ██╔════╝
// ██║   ██║   ██║   ██║██║     ███████╗
// ██║   ██║   ██║   ██║██║     ╚════██║
// ╚██████╔╝   ██║   ██║███████╗███████║
//  ╚═════╝    ╚═╝   ╚═╝╚══════╝╚══════╝
// MARK: UTILS

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

// ██╗███╗   ██╗     ██╗███████╗ ██████╗████████╗
// ██║████╗  ██║     ██║██╔════╝██╔════╝╚══██╔══╝
// ██║██╔██╗ ██║     ██║█████╗  ██║        ██║
// ██║██║╚██╗██║██   ██║██╔══╝  ██║        ██║
// ██║██║ ╚████║╚█████╔╝███████╗╚██████╗   ██║
// ╚═╝╚═╝  ╚═══╝ ╚════╝ ╚══════╝ ╚═════╝   ╚═╝
// MARK: INJEC

function injectScriptShortcutsBeforeHead(root: Element) {
  // Add a <script> tag that defines document.querySelector("...") shortcuts as $("...")
  // And document.querySelectorAll("...") shortcuts as $$("...")

  const head = root.children.find(
    (child) => child instanceof Element && child.name === "head",
  );

  if (!head) {
    throw new Error("Expected <head> to exist");
  }

  const script = new Element("script", {}, [
    new Text(`
      const $ = (selector, context = document) =>
        context.querySelector(selector);

      const $$ = (selector, context = document) =>
        context.querySelectorAll(selector);
    `),
  ]);

  $D.prependChild(head as ParentNode, script);

  return root;
}

function injectStylesheetTagBeforeHeadEnd(root: Element, href: string) {
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

  $D.appendChild(head as ParentNode, link);

  return root;
}

function injectBaseAtBeginingOfHead(root: Element) {
  const head = root.children.find(
    (child) => child instanceof Element && child.name === "head",
  )!;

  if (!head) {
    throw new Error("Expected <head> to exist");
  }

  // If there is a base tag, don't inject anything
  const headChildren = (head as Element).children || [];
  // console.log("HEAD", headChildren);
  if ($D.getElementsByTagName("base", headChildren).length > 0) {
    return root;
  }

  const el = new Element("base", {
    href: "/",
  });

  $D.prependChild(head as ParentNode, el);

  return root;
}

// ███╗   ██╗ ██████╗ ██████╗ ███╗   ███╗ █████╗ ██╗     ██╗███████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
// ████╗  ██║██╔═══██╗██╔══██╗████╗ ████║██╔══██╗██║     ██║╚══███╔╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
// ██╔██╗ ██║██║   ██║██████╔╝██╔████╔██║███████║██║     ██║  ███╔╝ ███████║   ██║   ██║██║   ██║██╔██╗ ██║
// ██║╚██╗██║██║   ██║██╔══██╗██║╚██╔╝██║██╔══██║██║     ██║ ███╔╝  ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
// ██║ ╚████║╚██████╔╝██║  ██║██║ ╚═╝ ██║██║  ██║███████╗██║███████╗██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
// ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

// MARK: NORM

function ensureHeadAndBody(root: Element) {
  let head = $D.getElementsByTagName("head", root.children, true)[0];

  let body = $D.getElementsByTagName("body", root.children, true)[0];

  if (!head) {
    head = new Element("head", {});
    $D.prependChild(root, head);
  }

  if (!body) {
    body = new Element("body", {});
    $D.appendChild(root, body);
  }

  // Move every direct child that isn't <head> or <body> into <body>.
  for (const child of [...root.children]) {
    if (child !== head && child !== body) {
      $D.removeElement(child);
      $D.appendChild(body, child);
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
    $D.removeElement(child);
    $D.appendChild(html, child);
  }

  $D.appendChild(dom, html);

  return [html];
}
