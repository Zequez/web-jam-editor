<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import { EditorView, keymap } from "@codemirror/view";
  import { StreamLanguage } from "@codemirror/language";
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
  import { lex } from "@/lib/pure-pug-compiler/atomic-class-lexer";

  const codeMirrorPug = StreamLanguage.define(langPug);

  let { onChange, initialValue, onTyping, onBuildAction } = $props<{
    onChange: (value: string) => void;
    onTyping: () => void;
    onBuildAction: () => void;
    initialValue: string;
  }>();

  let content: string = $state(initialValue || "");
  let view: EditorView = $state(null!);

  function handleReady(gotView: EditorView) {
    view = gotView;

    lexPug();
  }

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

  const immediateChange = EditorView.updateListener.of((update) => {
    console.log("Immediate change");
    if (update.docChanged) {
      onTyping();
    }
  });

  const debugKey = Prec.highest(
    EditorView.domEventHandlers({
      keydown(event) {
        console.log({
          key: event.key,
          code: event.code,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          defaultPrevented: event.defaultPrevented,
        });
        if (event.key === "Enter" && event.shiftKey) {
          console.log("DOM Shift-Enter", event);
        }
        return false;
      },
    }),
  );

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

  function onSave() {
    const result = lex(content);
    let prettified = "";
    for (let i = 0; i < result.length; i++) {
      const declaration = result[i]!;
      if (declaration.type === "relevant") {
        prettified += declaration.indentation;
        prettified += declaration.elementPart;
        prettified += declaration.atomicClassSegment;
        prettified += declaration.rest;
      } else {
        prettified += declaration.raw;
      }
    }

    console.log(prettified);
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
    foldingOnIndent,
    immediateChange,
    whitespaceTheme,
    indentWhitespacePlugin,
    specialCommentExtension,
    mixinHighlightExtension,
    duplicateLine,
    arbitraryStyleExtension,
    interceptSave,
  ]}
/>

<style>
  :global(.cm-editor) {
    height: 100% !important;
  }

  /* :global(.cm-editor .cm-selectionBackground) {
    background-color: #222 !important;
  } */

  :global(.cm-activeLine) {
    background-color: #1111 !important;
  }

  :global(.cm-foldGutter) {
    width: 20px;
    padding: 0 1px;
  }

  :global(.cm-foldGutter .cm-gutterElement span) {
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    color: #fff0;
    border-radius: 4px;
    position: relative;
  }

  :global(.cm-foldGutter .cm-gutterElement span[title="Fold line"]) {
    background: #0003;
  }

  :global(.cm-foldGutter .cm-gutterElement span[title="Unfold line"]) {
    background: hsla(24, 100%, 40%, 0.8);
  }

  :global(.cm-foldGutter .cm-gutterElement span[title="Unfold line"]::before) {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 2px;
    /* background: red; */
    border: 2px solid #fffa;
  }
</style>
