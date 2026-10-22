import { foldable } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { describe, expect, test } from "bun:test";
import { foldingOnIndent } from "./foldingService";

function foldAt(doc: string, lineNumber: number, depth = 0) {
  const state = EditorState.create({
    doc,
    extensions: [foldingOnIndent({ depth })],
  });
  const line = state.doc.line(lineNumber);

  return { fold: foldable(state, line.from, line.to), state };
}

describe("indentation folding", () => {
  test("only makes root lines foldable at depth 0", () => {
    const doc = "html\n  head\n    title Page\n  body\n    p Hello";
    const root = foldAt(doc, 1);

    expect(root.fold).toEqual({
      from: root.state.doc.line(1).to,
      to: root.state.doc.line(5).to,
    });
    expect(foldAt(doc, 2).fold).toBeNull();
  });

  test("can target a nested indentation depth", () => {
    const doc = "html\n  head\n    title Page\n  body\n    p Hello";
    const nested = foldAt(doc, 2, 1);

    expect(nested.fold).toEqual({
      from: nested.state.doc.line(2).to,
      to: nested.state.doc.line(3).to,
    });
    expect(foldAt(doc, 1, 1).fold).toBeNull();
  });

  test("does not treat blank lines as fold starts", () => {
    expect(foldAt("\n  p Hello", 1).fold).toBeNull();
  });
});
