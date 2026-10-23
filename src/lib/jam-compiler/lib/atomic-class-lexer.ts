export type IrrelevantDeclaration = {
  type: "irrelevant";
  raw: string;
};

export type RelevantDeclaration = {
  type: "relevant";

  /**
   * Everything before the element itself.
   * Usually spaces/tabs.
   */
  indentation: string;

  /**
   * The Pug element + shorthand classes/ids.
   *
   *   div
   *   div.foo
   *   div#foo.wololo
   */
  elementPart: string;

  /**
   * The complete [...] segment, including brackets.
   * May contain newlines.
   */
  atomicClassSegment: string;

  /**
   * Everything after the closing ].
   *
   * This is always from the same physical position as the closing ]
   * to the end of that line.
   */
  rest: string;

  /**
   * The original declaration exactly as it appeared.
   */
  raw: string;
};

export type Declaration = IrrelevantDeclaration | RelevantDeclaration;

/**
 * A Pug element followed immediately by our [...] syntax.
 *
 * Examples:
 *
 *   div[
 *   div.foo[
 *   div#foo[
 *   div.foo#bar[
 *   .foo[
 *   #foo[
 *
 * The element part itself is intentionally treated as opaque once
 * we've established that it ends immediately before `[`.
 */
const RELEVANT_DECLARATION_START =
  /^([ \t]*)([A-Za-z_][A-Za-z0-9:_-]*(?:[.#][A-Za-z_][A-Za-z0-9_-]*)*|[.#][A-Za-z_][A-Za-z0-9_-]*)\[/;

/**
 * Scan the `${...}` part of an atomic class segment.
 *
 * The goal here is NOT to parse JavaScript.
 *
 * We only need enough understanding to find the matching `}`:
 *
 * - nested `{}` are supported
 * - strings are supported
 * - escaped characters inside strings are supported
 * - line comments are supported
 * - block comments are supported
 *
 * The caller has already consumed `${`.
 *
 * Returns the index of the matching `}`.
 */
function findInterpolationEnd(source: string, startIndex: number): number {
  let braceDepth = 1;

  type State =
    | "code"
    | "singleQuote"
    | "doubleQuote"
    | "lineComment"
    | "blockComment";

  let state: State = "code";

  for (let i = startIndex; i < source.length; i++) {
    const char = source[i]!;
    const next = source[i + 1];

    switch (state) {
      case "code": {
        if (char === "'") {
          state = "singleQuote";
          continue;
        }

        if (char === '"') {
          state = "doubleQuote";
          continue;
        }

        if (char === "/" && next === "/") {
          state = "lineComment";
          i++;
          continue;
        }

        if (char === "/" && next === "*") {
          state = "blockComment";
          i++;
          continue;
        }

        if (char === "{") {
          braceDepth++;
          continue;
        }

        if (char === "}") {
          braceDepth--;

          if (braceDepth === 0) {
            return i;
          }
        }

        continue;
      }

      case "singleQuote":
      case "doubleQuote": {
        if (char === "\\") {
          // Skip the escaped character.
          i++;
          continue;
        }

        if (
          (state === "singleQuote" && char === "'") ||
          (state === "doubleQuote" && char === '"')
        ) {
          state = "code";
        }

        continue;
      }

      case "lineComment": {
        if (char === "\n" || char === "\r") {
          state = "code";
        }

        continue;
      }

      case "blockComment": {
        if (char === "*" && next === "/") {
          state = "code";
          i++;
        }

        continue;
      }
    }
  }

  throw new SyntaxError(
    "Unclosed ${...} interpolation in atomic class segment.",
  );
}

/**
 * Finds the ] matching the [ at `openIndex`.
 *
 * Outside interpolation:
 *   [ and ] affect square-bracket depth.
 *
 * Inside ${...}:
 *   the entire interpolation is opaque to this scanner.
 *
 * This means:
 *
 *   [hello-${foo["]"]}-world]
 *
 * correctly terminates at the final ].
 */
function findMatchingSquareBracket(source: string, openIndex: number): number {
  let squareDepth = 0;

  for (let i = openIndex; i < source.length; i++) {
    const char = source[i]!;
    const next = source[i + 1];

    if (char === "\\" && next === "$" && source[i + 2] === "{") {
      // \${ is literal; it must not start an interpolation.
      i += 2;
      continue;
    }

    if (char === "$" && next === "{") {
      const interpolationEnd = findInterpolationEnd(source, i + 2);

      // Skip everything belonging to ${...}.
      i = interpolationEnd;
      continue;
    }

    if (char === "[") {
      squareDepth++;
      continue;
    }

    if (char === "]") {
      squareDepth--;

      if (squareDepth === 0) {
        return i;
      }
    }
  }

  throw new SyntaxError("Unclosed [...] atomic class segment.");
}

/**
 * Reads one relevant declaration.
 *
 * Importantly, this can consume multiple physical lines.
 */
function readRelevantDeclaration(
  source: string,
  startIndex: number,
): {
  declaration: RelevantDeclaration;
  nextIndex: number;
} {
  const prefix = RELEVANT_DECLARATION_START.exec(source.slice(startIndex));

  if (!prefix) {
    throw new Error(
      "Internal error: readRelevantDeclaration() called at a non-relevant declaration.",
    );
  }

  const indentation = prefix[1]!;
  const elementPart = prefix[2]!;

  const prefixLength = prefix[0].length;
  const openBracketIndex = startIndex + prefixLength - 1;

  const closeBracketIndex = findMatchingSquareBracket(source, openBracketIndex);

  const atomicClassSegment = source.slice(
    openBracketIndex,
    closeBracketIndex + 1,
  );

  /**
   * `rest` begins immediately after `]`.
   *
   * We deliberately stop it at the end of the physical line.
   * Therefore multiline [...] content belongs entirely to
   * atomicClassSegment.
   */
  let restEnd = closeBracketIndex + 1;

  while (
    restEnd < source.length &&
    source[restEnd] !== "\n" &&
    source[restEnd] !== "\r"
  ) {
    restEnd++;
  }

  const rest = source.slice(closeBracketIndex + 1, restEnd);

  return {
    declaration: {
      type: "relevant",
      indentation,
      elementPart,
      atomicClassSegment,
      rest,
      raw: source.slice(startIndex, restEnd),
    },
    nextIndex: restEnd,
  };
}

/**
 * Reads one irrelevant declaration.
 *
 * An irrelevant declaration is simply a physical line that doesn't
 * begin with our [...] syntax.
 */
function readIrrelevantDeclaration(
  source: string,
  startIndex: number,
): {
  declaration: IrrelevantDeclaration;
  nextIndex: number;
} {
  let end = startIndex;

  while (end < source.length && source[end] !== "\n" && source[end] !== "\r") {
    end++;
  }

  return {
    declaration: {
      type: "irrelevant",
      raw: source.slice(startIndex, end),
    },
    nextIndex: end,
  };
}

/**
 * Lex the complete Pug source into declarations.
 *
 * Newline characters are not themselves declarations, so we attach
 * them to the following irrelevant/relevant source while reconstructing
 * the document later.
 */
export function lex(source: string): Declaration[] {
  const declarations: Declaration[] = [];

  let index = 0;

  while (index < source.length) {
    const relevantPrefix = RELEVANT_DECLARATION_START.exec(source.slice(index));

    if (relevantPrefix) {
      const result = readRelevantDeclaration(source, index);

      declarations.push(result.declaration);
      index = result.nextIndex;
    } else {
      const result = readIrrelevantDeclaration(source, index);

      declarations.push(result.declaration);
      index = result.nextIndex;
    }

    /**
     * Preserve the physical line ending as part of the next item.
     */
    if (source.startsWith("\r\n", index)) {
      declarations.push({
        type: "irrelevant",
        raw: "\r\n",
      });

      index += 2;
    } else if (source[index] === "\n" || source[index] === "\r") {
      declarations.push({
        type: "irrelevant",
        raw: source[index]!,
      });

      index++;
    }
  }

  return declarations;
}
