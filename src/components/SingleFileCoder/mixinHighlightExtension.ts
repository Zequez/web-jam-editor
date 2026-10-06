import {
  EditorView,
  Decoration,
  ViewPlugin,
  MatchDecorator,
} from "@codemirror/view";

const mixinYellow = "hsla(60, 100%, 50%, 0.9)";

const mixinLine = Decoration.line({
  attributes: {
    class: "cm-mixin-line",
  },
});

const mixinWord = Decoration.mark({
  class: "cm-mixin-word",
});

const mixinPlugin = ViewPlugin.fromClass(
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
      const decorations: any[] = [];

      for (const { from, to } of view.visibleRanges) {
        let pos = from;

        while (pos <= to) {
          const line = view.state.doc.lineAt(pos);
          const text = line.text;

          // Lines beginning with "mixin", ignoring indentation
          if (/^\s*mixin\b/.test(text)) {
            decorations.push(mixinLine.range(line.from));
          }

          // +Something(...) calls, e.g.
          // +RepeatPattern(
          // +Person(
          // +Space2(
          //
          // Only the +Something part gets the background.
          const regex = /\+[A-Za-z_$][\w$]*(?=\s*\()/g;

          let match;

          while ((match = regex.exec(text))) {
            decorations.push(
              mixinWord.range(
                line.from + match.index,
                line.from + match.index + match[0].length,
              ),
            );
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

export const mixinHighlightExtension = [
  mixinPlugin,

  EditorView.baseTheme({
    ".cm-mixin-line": {
      backgroundColor: mixinYellow,
    },

    ".cm-mixin-word": {
      backgroundColor: mixinYellow,
    },
  }),
];
