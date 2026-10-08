type AtomicUnit = string;

const GROUP_ORDER = [
  "position-layout",
  "dimensions-spacing",
  "interaction",
  "typography",
  "text-appearance",
  "box-appearance",
  "transition",
  "variant",
] as const;

type Group = (typeof GROUP_ORDER)[number];

const GROUP_RANK: Record<Group, number> = Object.fromEntries(
  GROUP_ORDER.map((group, i) => [group, i]),
) as Record<Group, number>;

/**
 * Iteration 1:
 * - Every unit belongs to one semantic group.
 * - Groups are emitted in a deterministic order.
 * - Variants always come last.
 * - Units within a group are sorted deterministically.
 *
 * This intentionally does not remove duplicates or resolve conflicts yet.
 */
export function sortAtomicUnits(units: AtomicUnit[]): AtomicUnit[][] {
  const grouped = new Map<Group, AtomicUnit[]>();

  for (const unit of units) {
    const group = classifyUnit(unit);

    let bucket = grouped.get(group);
    if (!bucket) {
      bucket = [];
      grouped.set(group, bucket);
    }

    bucket.push(unit);
  }

  return GROUP_ORDER.filter((group) => grouped.has(group)).map((group) => {
    const bucket = grouped.get(group)!;

    return [...bucket].sort(compareUnits);
  });
}

function classifyUnit(unit: AtomicUnit): Group {
  // Any variant is kept at the bottom for now.
  if (hasVariant(unit)) {
    return "variant";
  }

  // Position / layout
  if (
    /^(static|fixed|absolute|relative|sticky|inset|top|right|bottom|left|z-|isolate|flex|grid|block|inline|hidden|visible|justify-|items-|content-|self-|place-|basis-|grow|shrink|order-)/.test(
      unit,
    )
  ) {
    return "position-layout";
  }

  // Dimensions + spacing
  if (
    /^(w-|h-|min-w-|max-w-|min-h-|max-h-|size-|m-|mx|my|mt|mr|mb|ml|p|px|py|pt|pr|pb|pl|gap|space-)/.test(
      unit,
    )
  ) {
    return "dimensions-spacing";
  }

  // Interactive affordances / behavior
  if (
    /^(cursor-|select-|pointer-events-|touch-|resize|scroll-|snap-)/.test(unit)
  ) {
    return "interaction";
  }

  // Typography
  if (
    /^(font-|text-(?!white$|black$|transparent$|current$|inherit$)|leading-|tracking-|uppercase$|lowercase$|capitalize$|normal-case$|italic$|not-italic$|underline$|no-underline$|line-through$|truncate$|whitespace-|break-)/.test(
      unit,
    )
  ) {
    return "typography";
  }

  // Text appearance
  if (
    /^(text-(white|black|gray-|slate-|zinc-|neutral-|stone-|red-|orange-|amber-|yellow-|lime-|green-|emerald-|teal-|cyan-|sky-|blue-|indigo-|violet-|purple-|fuchsia-|pink-|rose-)|text-shadow-)/.test(
      unit,
    )
  ) {
    return "text-appearance";
  }

  // Box appearance
  if (/^(bg-|from-|via-|to-|rounded|b(?:-|$)|border|shadow-)/.test(unit)) {
    return "box-appearance";
  }

  // Motion / transitions
  if (
    /^(transition|duration-|delay-|ease-|animate-|transform|scale-|rotate-|translate-|skew-)/.test(
      unit,
    )
  ) {
    return "transition";
  }

  // Unknowns get a stable final home until we learn where they belong.
  return "box-appearance";
}

function hasVariant(unit: AtomicUnit): boolean {
  /*
   * For iteration one we only need to detect variant syntax.
   * This also catches grouped syntax such as:
   *
   *   hover:bg-red
   *   sm:(bg-red text-white)
   *   group-hover:(scale-100 opacity-100)
   */
  return unit.includes(":");
}

function compareUnits(a: AtomicUnit, b: AtomicUnit): number {
  return a.localeCompare(b);
}

function splitAtomicClasses(input: string): string[] {
  const result: string[] = [];
  let start = 0;
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    } else if (/\s/.test(char!) && depth === 0) {
      if (i > start) {
        result.push(input.slice(start, i));
      }
      start = i + 1;
    }
  }

  if (start < input.length) {
    result.push(input.slice(start));
  }

  return result;
}

export function processAtomicClasses(input: string): AtomicUnit[][] {
  const units = splitAtomicClasses(input);
  return compress(sortAtomicUnits(units), 80);
}

function compress(
  units: AtomicUnit[][],
  maxLineLength: number,
): AtomicUnit[][] {
  if (units.length < 2) return units.map((group) => [...group]);

  const result: AtomicUnit[][] = [[...units[0]!]];

  for (let i = 1; i < units.length; i++) {
    const current = units[i];
    const previous = result[result.length - 1];

    const merged = [...previous!, ...current!];
    const length = merged.join(" ").length;

    if (length <= maxLineLength) {
      result[result.length - 1] = merged;
    } else {
      result.push([...current!]);
    }
  }

  return result;
}

export function renderPretty(atomicUnits: AtomicUnit[][], padding: number) {
  if (atomicUnits.length === 1) {
    return atomicUnits[0]!.join(" ");
  }

  const indent = " ".repeat(padding);
  const groupIndent = " ".repeat(padding + 2);

  return (
    "\n" +
    atomicUnits.map((group) => groupIndent + group.join(" ")).join("\n") +
    "\n" +
    indent
  );
}
