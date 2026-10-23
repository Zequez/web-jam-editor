import { lex } from "@/lib/jam-compiler/lib/atomic-class-lexer";
import { processAtomicClasses, renderPretty } from "./atomic-prettifier";

export function prettyfication(doc: string) {
  const result = lex(doc);
  let prettified = "";

  for (let i = 0; i < result.length; i++) {
    const declaration = result[i]!;

    if (declaration.type === "relevant") {
      prettified += declaration.indentation;
      prettified += declaration.elementPart;

      const atomicClasses = declaration.atomicClassSegment.slice(1, -1);
      const atomicUnits = processAtomicClasses(atomicClasses);

      const atomicClassesPretty = renderPretty(
        atomicUnits,
        declaration.indentation.length,
      );

      prettified += `[${atomicClassesPretty}]`;
      prettified += declaration.rest;
    } else {
      prettified += declaration.raw;
    }
  }

  const current = doc;

  // Find the common prefix.
  let from = 0;
  while (
    from < current.length &&
    from < prettified.length &&
    current[from] === prettified[from]
  ) {
    from++;
  }

  // Find the common suffix.
  let currentEnd = current.length;
  let prettyEnd = prettified.length;

  while (
    currentEnd > from &&
    prettyEnd > from &&
    current[currentEnd - 1] === prettified[prettyEnd - 1]
  ) {
    currentEnd--;
    prettyEnd--;
  }

  return {
    from,
    to: currentEnd,
    insert: prettified.slice(from, prettyEnd),
  };
}
