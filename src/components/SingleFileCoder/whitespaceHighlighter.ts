import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
} from "@codemirror/view";

const whitespaceChar = "░";
const whitespaceColor = "#4d5666";
const whitespaceOpacity = 0.4;

const indentWhitespaceDecorator = new MatchDecorator({
  regexp: /^(?:[ \t]+)/gm,
  decorate: (add, from, _to, match) => {
    const marker = Decoration.mark({ class: "cm-indentWhitespace" });
    for (let pos = from; pos < from + match[0].length; pos++) {
      add(pos, pos + 1, marker);
    }
  },
});

export const indentWhitespacePlugin = ViewPlugin.fromClass(
  class {
    decorations;

    constructor(view: EditorView) {
      this.decorations = indentWhitespaceDecorator.createDeco(view);
    }

    update(update: any) {
      this.decorations = indentWhitespaceDecorator.updateDeco(
        update,
        this.decorations,
      );
    }
  },
  {
    decorations: (value) => value.decorations,
  },
);

export const whitespaceTheme = EditorView.theme({
  "&": {
    "--whitespace-char": `'${whitespaceChar}'`,
    "--whitespace-color": whitespaceColor,
    "--whitespace-opacity": String(whitespaceOpacity),
  },
  ".cm-indentWhitespace": {
    position: "relative",
    color: "transparent",
    overflow: "visible",
    background: "transparent !important",
    backgroundImage: "none !important",
    backgroundSize: "auto !important",
    backgroundPosition: "initial !important",
  },
  ".cm-indentWhitespace::before": {
    content: "var(--whitespace-char)",
    position: "absolute",
    inset: "0 0 0 0",
    display: "inline-block",
    color: "var(--whitespace-color)",
    opacity: "var(--whitespace-opacity)",
    fontFamily: "monospace",
    fontSize: "inherit",
    lineHeight: "1",
    pointerEvents: "none",
    userSelect: "none",
    textAlign: "center",
  },
});
