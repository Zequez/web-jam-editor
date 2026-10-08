import { StateEffect, StateField, RangeSetBuilder } from "@codemirror/state";
import { EditorView, Decoration, type DecorationSet } from "@codemirror/view";

type StyledRange = {
  from: number;
  to: number;
  className: string;
};

function styledRanges(ranges: StyledRange[]) {
  const marks = new Map<string, Decoration>();
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to, className } of ranges) {
    let mark = marks.get(className);

    if (!mark) {
      mark = Decoration.mark({ class: className });
      marks.set(className, mark);
    }

    builder.add(from, to, mark);
  }

  return builder.finish();
}

// The thing external code can dispatch.
export const setStyledRanges = StateEffect.define<StyledRange[]>();

const decorations = StateField.define<DecorationSet>({
  create() {
    return styledRanges([]);
  },

  update(value, tr) {
    // First, keep the ranges aligned with document changes.
    value = value.map(tr.changes);

    // Then replace them if somebody explicitly sets new ranges.
    for (const effect of tr.effects) {
      if (effect.is(setStyledRanges)) {
        value = styledRanges(effect.value);
      }
    }

    return value;
  },

  provide: (field) => EditorView.decorations.from(field),
});

export const arbitraryStyleExtension = [
  decorations,

  EditorView.baseTheme({
    ".atomic-class > span, .atomic-class ": {
      // backgroundColor: "rgba(255, 0, 0, 1)",
      // borderRadius: "3px",
      // purple
      color: "#e092ea !important",
      fontWeight: "normal !important",
    },
  }),
];
