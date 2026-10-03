import { describe, expect, test } from "bun:test";
import pug from "pug";
import { buildCompiler } from "../compiler";
import { parseHTML } from "linkedom";
// import { fs } from "@zenfs/core";

const compile = buildCompiler(pug);

describe("Pug compiler", () => {
  test("compiles a basic element", async () => {
    const result = await compile("p Hello");

    const { document } = parseHTML(result["index.html"]);
    const body = document.querySelector("body")!.innerHTML;

    expect(body).toBe("<p>Hello</p>");
  });

  test("handles attributes", async () => {
    const result = await compile('a(href="/foo") Foo');

    expect(result["index.html"]).toContain('href="/foo"');
  });
});
