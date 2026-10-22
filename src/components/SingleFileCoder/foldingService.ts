import { getIndentUnit, foldService } from "@codemirror/language";
import { countColumn } from "@codemirror/state";

export type IndentFoldingConfig = {
  /** Only lines at this indentation depth can start a fold. */
  depth?: number;
};

/**
 * Adds indentation-based folding for one exact nesting depth. Depth 0 is the
 * document root; higher depths use the editor's configured indentation unit.
 */
export function foldingOnIndent({ depth = 0 }: IndentFoldingConfig = {}) {
  if (!Number.isSafeInteger(depth) || depth < 0) {
    throw new RangeError("The folding depth must be a non-negative integer.");
  }

  return foldService.of((state, from, to) => {
    const line = state.doc.lineAt(from);
    const firstContent = line.text.search(/\S/);

    // A blank line has no node to fold, even when the following line is indented.
    if (firstContent === -1) return null;

    const indent = countColumn(line.text, state.tabSize, firstContent);
    if (indent !== depth * getIndentUnit(state)) return null;

    const lines = state.doc.lines;
    let foldEnd = to;

    let nextLine = line;
    while (nextLine.number < lines) {
      nextLine = state.doc.line(nextLine.number + 1);
      const nextContent = nextLine.text.search(/\S/);

      if (nextContent === -1) continue;

      const nextIndent = countColumn(nextLine.text, state.tabSize, nextContent);
      if (nextIndent > indent) {
        foldEnd = nextLine.to;
      } else {
        break;
      }
    }

    if (line.number === state.doc.lineAt(foldEnd).number) return null;

    return { from: line.to, to: foldEnd };
  });
}
