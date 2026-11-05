// Thanks ChatGPT-Gaia for this

import {
  codeFolding,
  foldEffect,
  foldService,
  foldedRanges,
  unfoldEffect,
} from "@codemirror/language";
import {
  StateField,
  type EditorState,
  type Extension,
  type Text,
} from "@codemirror/state";
import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";

interface FoldRange {
  from: number;
  to: number;
}

interface IndentMarkSection extends FoldRange {
  name: string;
  markerFrom: number;
}

interface SectionState {
  name: string;
  folded: boolean;
}

interface StoredState {
  version: 1;
  sections: SectionState[];
}

type FoldEffect =
  | ReturnType<typeof foldEffect.of>
  | ReturnType<typeof unfoldEffect.of>;

const STORAGE_PREFIX = "codemirror:indent-mark-folding:";
const STORAGE_VERSION = 1 as const;

/**
 * Recognizes markers of the form `//# SECTION NAME`.
 * Leading indentation is allowed, so markers can be nested in Pug blocks.
 */
function getMarkerName(text: string): string | null {
  const match = /^[\t ]*\/\/#\s+(.+?)[\t ]*$/.exec(text);
  const name = match?.[1]?.trim();
  return name || null;
}

function isBlankLine(text: string): boolean {
  return /^[\t ]*$/.test(text);
}

function indentationOf(text: string): number {
  return /^[\t ]*/.exec(text)?.[0].length ?? 0;
}

/**
 * A marker folds the block beginning on its next nonblank line.
 * That first line is always included. Following nonblank lines belong to the
 * block while they are more indented than the first line. Blank lines are
 * ignored when finding the boundary, but remain inside the folded range.
 */
function scanSections(doc: Text): IndentMarkSection[] {
  const sections: IndentMarkSection[] = [];

  for (let number = 1; number <= doc.lines; number++) {
    const markerLine = doc.line(number);
    const name = getMarkerName(markerLine.text);
    if (!name) continue;

    // Pug ignores empty lines for indentation purposes. Skip them to find
    // the line whose indentation establishes this section's baseline.
    let contentLineNumber = number + 1;
    while (
      contentLineNumber <= doc.lines &&
      isBlankLine(doc.line(contentLineNumber).text)
    ) {
      contentLineNumber++;
    }

    // A marker at the end of the document (or before only blank lines)
    // has no content to fold.
    if (contentLineNumber > doc.lines) continue;

    const contentLine = doc.line(contentLineNumber);

    // Consecutive markers do not give the earlier marker any content.
    if (getMarkerName(contentLine.text)) continue;

    const baseIndent = indentationOf(contentLine.text);

    // Include trailing blank lines. A same-or-less-indented nonblank line
    // marks the start of the next sibling/outside block and is not included.
    let foldTo = doc.length;
    let firstBlankLineFrom: number | null = null;

    for (
      let nextNumber = contentLineNumber + 1;
      nextNumber <= doc.lines;
      nextNumber++
    ) {
      const line = doc.line(nextNumber);

      if (isBlankLine(line.text)) {
        firstBlankLineFrom ??= line.from;
        continue;
      }

      if (indentationOf(line.text) <= baseIndent) {
        foldTo = firstBlankLineFrom ?? line.from;
        break;
      }

      // The blank lines were internal to the section after all.
      firstBlankLineFrom = null;
    }

    // Start at the end of the marker line so the marker itself stays visible.
    // The range includes the newline after the marker and the section content.
    if (foldTo > markerLine.to) {
      sections.push({
        name,
        markerFrom: markerLine.from,
        from: markerLine.to,
        to: foldTo,
      });
    }
  }

  return sections;
}

const sectionsField = StateField.define<IndentMarkSection[]>({
  create(state) {
    return scanSections(state.doc);
  },
  update(sections, transaction) {
    return transaction.docChanged ? scanSections(transaction.newDoc) : sections;
  },
});

function getStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    // Access can throw in restricted browser contexts.
    return null;
  }
}

function readStoredStates(storageKey: string): SectionState[] {
  try {
    const raw = getStorage()?.getItem(storageKey);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return [];

    const payload = parsed as Record<string, unknown>;
    if (
      payload.version !== STORAGE_VERSION ||
      !Array.isArray(payload.sections)
    ) {
      return [];
    }

    return payload.sections.filter((item): item is SectionState => {
      if (!item || typeof item !== "object") return false;
      const section = item as Record<string, unknown>;
      return (
        typeof section.name === "string" && typeof section.folded === "boolean"
      );
    });
  } catch {
    // Corrupt or unavailable storage should never prevent the editor opening.
    return [];
  }
}

function writeStoredStates(storageKey: string, sections: SectionState[]): void {
  try {
    const payload: StoredState = {
      version: STORAGE_VERSION,
      sections,
    };
    getStorage()?.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Folding still works when localStorage is unavailable or full.
  }
}

/**
 * Match by name and occurrence order. Different names can move freely;
 * duplicate names are matched in their order of appearance.
 */
function reconcileStates(
  sections: readonly IndentMarkSection[],
  previous: readonly SectionState[],
): SectionState[] {
  const statesByName = new Map<string, boolean[]>();

  for (const section of previous) {
    const queue = statesByName.get(section.name) ?? [];
    queue.push(section.folded);
    statesByName.set(section.name, queue);
  }

  return sections.map(({ name }) => ({
    name,
    folded: statesByName.get(name)?.shift() ?? false,
  }));
}

function sameStates(
  a: readonly SectionState[],
  b: readonly SectionState[],
): boolean {
  return (
    a.length === b.length &&
    a.every((section, index) => {
      const other = b[index];
      return (
        other !== undefined &&
        section.name === other.name &&
        section.folded === other.folded
      );
    })
  );
}

function getFoldRanges(state: EditorState): FoldRange[] {
  const ranges: FoldRange[] = [];
  foldedRanges(state).between(0, state.doc.length, (from, to) => {
    ranges.push({ from, to });
  });
  return ranges;
}

function hasRange(ranges: readonly FoldRange[], target: FoldRange): boolean {
  return ranges.some(
    (range) => range.from === target.from && range.to === target.to,
  );
}

class IndentMarkFoldingPlugin {
  private sections: IndentMarkSection[];
  private sectionStates: SectionState[];
  private ownedRanges: FoldRange[] = [];
  private syncPending = false;
  private syncing = false;
  private destroyed = false;

  constructor(
    private readonly view: EditorView,
    private readonly storageKey: string,
  ) {
    this.sections = view.state.field(sectionsField);

    const stored = readStoredStates(storageKey);
    this.sectionStates = reconcileStates(this.sections, stored);

    // Remove deleted sections from storage and add new sections as unfolded.
    if (!sameStates(this.sectionStates, stored)) {
      this.persist();
    }

    // Dispatching from a ViewPlugin constructor is re-entrant. Defer the
    // initial restoration until the current editor update has completed.
    this.scheduleSync();
  }

  update(update: ViewUpdate): void {
    const nextSections = update.state.field(sectionsField);

    if (update.docChanged) {
      // foldState maps its ranges through document changes. Keep our own list
      // mapped in the same way so we can remove obsolete ranges safely.
      this.ownedRanges = this.ownedRanges.flatMap((range) => {
        const from = update.changes.mapPos(range.from, 1);
        const to = update.changes.mapPos(range.to, -1);
        return to > from ? [{ from, to }] : [];
      });

      this.sections = nextSections;
      this.sectionStates = reconcileStates(nextSections, this.sectionStates);
      this.persist();
      this.scheduleSync();
      return;
    }

    // Ignore the update caused by our own fold effects. We refresh explicitly
    // just after dispatching them.
    if (!this.syncing && !this.syncPending) {
      this.refreshFromState(update.state);
    }
  }

  destroy(): void {
    this.destroyed = true;
  }

  private persist(): void {
    writeStoredStates(this.storageKey, this.sectionStates);
  }

  private refreshFromState(state: EditorState): void {
    this.sections = state.field(sectionsField);
    const ranges = getFoldRanges(state);

    this.ownedRanges = [];
    const nextStates = this.sections.map((section) => {
      const range = { from: section.from, to: section.to };
      const folded = hasRange(ranges, range);

      if (folded) this.ownedRanges.push(range);
      return { name: section.name, folded };
    });

    if (!sameStates(nextStates, this.sectionStates)) {
      this.sectionStates = nextStates;
      this.persist();
    }
  }

  private scheduleSync(): void {
    if (this.syncPending) return;
    this.syncPending = true;

    queueMicrotask(() => {
      this.syncPending = false;
      if (this.destroyed) return;

      const state = this.view.state;
      this.sections = state.field(sectionsField);

      const actualRanges = getFoldRanges(state);
      const desiredSections = this.sections.filter(
        (_, index) => this.sectionStates[index]?.folded,
      );
      const desiredRanges = desiredSections.map(({ from, to }) => ({
        from,
        to,
      }));
      const effects: FoldEffect[] = [];

      // Remove only folds previously managed by this service. Other
      // CodeMirror folding services remain untouched.
      for (const oldRange of this.ownedRanges) {
        if (
          !hasRange(desiredRanges, oldRange) &&
          hasRange(actualRanges, oldRange)
        ) {
          effects.push(unfoldEffect.of(oldRange));
        }
      }

      // Restore desired folds at their current document positions.
      for (const range of desiredRanges) {
        if (!hasRange(actualRanges, range)) {
          effects.push(foldEffect.of(range));
        }
      }

      if (effects.length) {
        this.syncing = true;
        try {
          this.view.dispatch({ effects });
        } finally {
          this.syncing = false;
        }
      }

      this.refreshFromState(this.view.state);
    });
  }
}

/**
 * Creates an indentation-based CodeMirror 6 folding service for Pug sections.
 *
 * Markers use the strict `//# SECTION NAME` syntax. The marker remains
 * visible; the following Pug block is folded. Folded states are stored per
 * project in localStorage and restored by section name + occurrence order.
 */
export function buildIndentMarkFoldingService(projectId: string): Extension {
  if (!projectId.trim()) {
    throw new Error(
      "buildIndentMarkFoldingService requires a non-empty projectId",
    );
  }

  const storageKey = `${STORAGE_PREFIX}${encodeURIComponent(projectId)}`;

  return [
    codeFolding(),
    sectionsField,
    foldService.of((state, lineStart, lineEnd) => {
      const section = state
        .field(sectionsField)
        .find((candidate) => candidate.markerFrom === lineStart);

      if (!section || section.to <= lineEnd) return null;
      return { from: section.from, to: section.to };
    }),
    ViewPlugin.define((view) => new IndentMarkFoldingPlugin(view, storageKey)),
  ];
}
