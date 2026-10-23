import { type RelevantDeclaration, lex } from "./atomic-class-lexer";
import { expandVariantGroups } from "./expand-variant-groups";

export function transformRelevantDeclaration(
  declaration: RelevantDeclaration,
): string {
  const classValue = declaration.atomicClassSegment.slice(1, -1);
  const expandedClassValue = expandVariantGroups(classValue);

  const classAttribute = `class=\`${expandedClassValue}\``;

  // There is no Pug attribute group after [...]
  if (!declaration.rest.startsWith("(")) {
    return (
      declaration.indentation +
      declaration.elementPart +
      `(${classAttribute})` +
      declaration.rest
    );
  }

  // There is already a Pug attribute group.
  return (
    declaration.indentation +
    declaration.elementPart +
    "(" +
    classAttribute +
    " " +
    declaration.rest.slice(1)
  );
}

export function preprocessPug(source: string): string {
  const declarations = lex(source);

  return declarations
    .map((declaration) => {
      if (declaration.type === "irrelevant") {
        return declaration.raw;
      }

      return transformRelevantDeclaration(declaration);
    })
    .join("");
}
