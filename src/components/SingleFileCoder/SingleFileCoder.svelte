<script lang="ts">
  import "./codemirror.css";
  import CodeMirror from "svelte-codemirror-editor";
  import { EditorView, keymap } from "@codemirror/view";
  import {
    foldable,
    foldEffect,
    foldState,
    StreamLanguage,
    unfoldEffect,
  } from "@codemirror/language";
  import { pug as langPug } from "@codemirror/legacy-modes/mode/pug";
  import { Prec } from "@codemirror/state";
  import { solarizedLight } from "thememirror";
  import { foldingOnIndent } from "./foldingService";
  import { specialCommentExtension } from "./specialCommentExtension";
  import { mixinHighlightExtension } from "./mixinHighlightExtension";
  import { duplicateLine } from "./duplicateLineExtension";
  import {
    indentWhitespacePlugin,
    whitespaceTheme,
  } from "./whitespaceHighlighter";
  import { arbitraryStyleExtension, setStyledRanges } from "./arbitraryStyle";
  import { onMount } from "svelte";
  import { lex } from "@/lib/jam-compiler/lib/atomic-class-lexer";
  import { processAtomicClasses, renderPretty } from "./atomic-prettifier";
  import { prettyfication } from "./doc-prettifycation";

  const codeMirrorPug = StreamLanguage.define(langPug);

  let {
    onChange,
    initialValue,
    onTyping,
    onBuildAction,
    project,
    file,
  }: {
    onChange: (value: string) => void;
    onTyping: () => void;
    onBuildAction: () => void;
    initialValue: string;
    project: string;
    file: string;
  } = $props();

  let content: string = $state(initialValue || "");
  let view: EditorView = $state(null!);

  let storageKey = $derived(`folds:${project}:${file}`);

  function handleReady(gotView: EditorView) {
    view = gotView;

    view.focus();

    lexPug();
    restoreFoldingState();
  }

  function restoreFoldingState() {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      console.log("Restored folding state");
      const ranges: unknown = JSON.parse(saved);
      if (
        !Array.isArray(ranges) ||
        ranges.length % 2 !== 0 ||
        !ranges.every((n) => Number.isInteger(n))
      )
        return;

      const effects = [];

      for (let i = 0; i < ranges.length; i += 2) {
        const from = ranges[i];
        const to = ranges[i + 1];

        if (from < 0 || to > view.state.doc.length || from >= to) continue;

        const line = view.state.doc.lineAt(from);
        const range = foldable(view.state, line.from, line.to);

        if (range && range.from === from && range.to === to) {
          effects.push(foldEffect.of(range));
        }
      }

      if (effects.length) view.dispatch({ effects });
    } catch {
      // Ignore corrupted saved state.
    }
  }

  // function syncFoldingState() {
  //   // Restore saved folding state.
  //   const saved = localStorage.getItem(storageKey);

  //   console.log("Folds restored", saved);
  //   if (saved) {
  //     try {
  //       const { fold: ranges } = JSON.parse(saved);

  //       if (Array.isArray(ranges)) {
  //         const effects = [];

  //         for (let i = 0; i < ranges.length; i += 2) {
  //           effects.push(
  //             foldEffect.of({
  //               from: ranges[i],
  //               to: ranges[i + 1],
  //             }),
  //           );
  //         }

  //         // Requires an EditorView to dispatch effects.
  //       }
  //     } catch {
  //       localStorage.removeItem(storageKey);
  //     }
  //   }
  // }

  function monitorAndSaveFolds() {
    return EditorView.updateListener.of((update) => {
      const foldingChanged = update.transactions.some((tr) =>
        tr.effects.some(
          (effect) => effect.is(foldEffect) || effect.is(unfoldEffect),
        ),
      );

      if (!foldingChanged) return;

      saveFoldingState();
    });
  }

  import { foldedRanges } from "@codemirror/language";

  function saveFoldingState() {
    const ranges: number[] = [];

    foldedRanges(view.state).between(0, view.state.doc.length, (from, to) => {
      ranges.push(from, to);
    });

    console.log("Saved folding state", ranges);
    localStorage.setItem(storageKey, JSON.stringify(ranges));
  }

  // ██╗     ███████╗██╗  ██╗    ██████╗ ██╗   ██╗ ██████╗
  // ██║     ██╔════╝╚██╗██╔╝    ██╔══██╗██║   ██║██╔════╝
  // ██║     █████╗   ╚███╔╝     ██████╔╝██║   ██║██║  ███╗
  // ██║     ██╔══╝   ██╔██╗     ██╔═══╝ ██║   ██║██║   ██║
  // ███████╗███████╗██╔╝ ██╗    ██║     ╚██████╔╝╚██████╔╝
  // ╚══════╝╚══════╝╚═╝  ╚═╝    ╚═╝      ╚═════╝  ╚═════╝
  // MARK: LEX

  function lexPug() {
    if (!view) return;

    let ranges: { from: number; to: number; className: string }[] = [];
    function addRange(from: number, to: number) {
      ranges.push({ from, to, className: "atomic-class" });
    }
    const result = lex(content);
    let pos = 0;
    for (let i = 0; i < result.length; i++) {
      const declaration = result[i]!;
      if (declaration.type === "relevant") {
        pos += declaration.indentation.length + declaration.elementPart.length;
        addRange(pos + 1, pos + declaration.atomicClassSegment.length - 1);
        pos += declaration.atomicClassSegment.length + declaration.rest.length;
      } else {
        pos += declaration.raw.length;
      }
    }

    view.dispatch({
      effects: setStyledRanges.of(ranges),
    });
  }

  function handleOnChange() {
    if (onChange) onChange(content);
    debouncedLexPug();
  }

  let debouncedLexPugTimeout: ReturnType<typeof setTimeout> = null!;
  function debouncedLexPug() {
    if (debouncedLexPugTimeout) {
      clearTimeout(debouncedLexPugTimeout);
    }
    debouncedLexPugTimeout = setTimeout(() => {
      lexPug();
    }, 400);
  }

  // ██╗███╗   ███╗███╗   ███╗███████╗██████╗ ██╗ █████╗ ████████╗███████╗
  // ██║████╗ ████║████╗ ████║██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝██╔════╝
  // ██║██╔████╔██║██╔████╔██║█████╗  ██║  ██║██║███████║   ██║   █████╗
  // ██║██║╚██╔╝██║██║╚██╔╝██║██╔══╝  ██║  ██║██║██╔══██║   ██║   ██╔══╝
  // ██║██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗██████╔╝██║██║  ██║   ██║   ███████╗
  // ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚═════╝ ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
  // MARK: IMME

  const immediateChange = EditorView.updateListener.of((update) => {
    // console.log("Immediate change");
    if (update.docChanged) {
      onTyping();
    }
  });

  // const debugKey = Prec.highest(
  //   EditorView.domEventHandlers({
  //     keydown(event) {
  //       console.log({
  //         key: event.key,
  //         code: event.code,
  //         altKey: event.altKey,
  //         ctrlKey: event.ctrlKey,
  //         shiftKey: event.shiftKey,
  //         metaKey: event.metaKey,
  //         defaultPrevented: event.defaultPrevented,
  //       });
  //       if (event.key === "Enter" && event.shiftKey) {
  //         console.log("DOM Shift-Enter", event);
  //       }
  //       return false;
  //     },
  //   }),
  // );

  // ███████╗██╗  ██╗██╗███████╗████████╗███████╗███╗   ██╗████████╗███████╗██████╗
  // ██╔════╝██║  ██║██║██╔════╝╚══██╔══╝██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔══██╗
  // ███████╗███████║██║█████╗     ██║   █████╗  ██╔██╗ ██║   ██║   █████╗  ██████╔╝
  // ╚════██║██╔══██║██║██╔══╝     ██║   ██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗
  // ███████║██║  ██║██║██║        ██║   ███████╗██║ ╚████║   ██║   ███████╗██║  ██║
  // ╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝

  // MARK: SHIFT

  const buildOnShiftEnter = Prec.highest(
    keymap.of([
      {
        key: "Shift-Enter",
        run: () => {
          console.log("Command");
          onBuildAction();
          return true;
        },
      },
    ]),
  );

  // ███████╗ █████╗ ██╗   ██╗███████╗
  // ██╔════╝██╔══██╗██║   ██║██╔════╝
  // ███████╗███████║██║   ██║█████╗
  // ╚════██║██╔══██║╚██╗ ██╔╝██╔══╝
  // ███████║██║  ██║ ╚████╔╝ ███████╗
  // ╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝

  // MARK: SAVE

  function onSave() {
    const latestDoc = view.state.doc.toString();
    const changes = prettyfication(latestDoc);
    view.dispatch({
      changes,
    });

    // handleOnChange();
  }

  const interceptSave = keymap.of([
    {
      key: "Mod-s",
      run: () => {
        onSave();
        return true; // prevent the browser's default Save dialog
      },
    },
  ]);

  // ██████╗  ██████╗  ██████╗
  // ██╔══██╗██╔═══██╗██╔════╝
  // ██║  ██║██║   ██║██║
  // ██║  ██║██║   ██║██║
  // ██████╔╝╚██████╔╝╚██████╗
  // ╚═════╝  ╚═════╝  ╚═════╝
  // MARK: DOC
</script>

<CodeMirror
  class="h-full w-full block"
  bind:value={content}
  onready={handleReady}
  onchange={handleOnChange}
  nodebounce={false}
  theme={solarizedLight}
  autocompletion={false}
  extensions={[
    // debugKey,
    buildOnShiftEnter,
    codeMirrorPug,
    foldingOnIndent(),
    immediateChange,
    whitespaceTheme,
    indentWhitespacePlugin,
    specialCommentExtension,
    mixinHighlightExtension,
    duplicateLine,
    arbitraryStyleExtension,
    interceptSave,
    monitorAndSaveFolds(),
  ]}
/>
