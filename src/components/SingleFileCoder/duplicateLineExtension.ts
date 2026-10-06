import { EditorSelection, Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";

export const duplicateLine = Prec.high(
  keymap.of([
    {
      key: "Mod-d",
      run: (view) => {
        const changes = [];
        const selections = [];

        for (const range of view.state.selection.ranges) {
          const line = view.state.doc.lineAt(range.from);

          const insert = line.text + "\n";
          const pos = line.to + 1;

          changes.push({
            from: line.to,
            insert,
          });

          selections.push(
            EditorSelection.range(
              range.anchor + insert.length,
              range.head + insert.length,
            ),
          );
        }

        view.dispatch({
          changes,
          selection: EditorSelection.create(selections),
        });

        return true;
      },
    },
  ]),
);
