import { EditorView, Decoration, ViewPlugin } from "@codemirror/view";

const specialLine = Decoration.line({
  attributes: {
    class: "cm-special-comment",
  },
});

const specialLinePlugin = ViewPlugin.fromClass(
  class {
    decorations;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: any) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView) {
      const decorations = [];

      for (const { from, to } of view.visibleRanges) {
        let pos = from;

        while (pos <= to) {
          const line = view.state.doc.lineAt(pos);

          if (/^\s*\/\/ #/.test(line.text)) {
            decorations.push(specialLine.range(line.from));
          }

          pos = line.to + 1;
        }
      }

      return Decoration.set(decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

export const specialCommentExtension = [
  specialLinePlugin,

  EditorView.baseTheme({
    ".cm-special-comment": {
      background: "#303030",
      color: "white",
      fontWeight: "bold",
    },
  }),
];
