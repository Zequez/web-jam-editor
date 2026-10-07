<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import {
    Decoration,
    EditorView,
    MatchDecorator,
    ViewPlugin,
    keymap,
  } from "@codemirror/view";
  import { StreamLanguage } from "@codemirror/language";
  import { pug as langPug } from "@codemirror/legacy-modes/mode/pug";
  import { Prec } from "@codemirror/state";
  import { solarizedLight } from "thememirror";
  import { foldingOnIndent } from "./foldingService";
  import { specialCommentExtension } from "./specialCommentExtension";
  import { mixinHighlightExtension } from "./mixinHighlightExtension";
  import { duplicateLine } from "./duplicateLineExtension";

  const codeMirrorPug = StreamLanguage.define(langPug);
  const whitespaceChar = "░";
  const whitespaceColor = "#4d5666";
  const whitespaceOpacity = 0.4;

  let { onChange, initialValue, onTyping, onBuildAction } = $props<{
    onChange: (value: string) => void;
    onTyping: () => void;
    onBuildAction: () => void;
    initialValue: string;
  }>();

  let content: string = $state(initialValue || "");

  function handleOnChange() {
    if (onChange) onChange(content);
  }

  const immediateChange = EditorView.updateListener.of((update) => {
    console.log("Immediate change");
    if (update.docChanged) {
      onTyping();
    }
  });

  const debugKey = EditorView.domEventHandlers({
    keydown(event) {
      if (event.key === "Enter" && event.shiftKey) {
        console.log("DOM Shift-Enter", event);
      }
      return false;
    },
  });

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

  const indentWhitespaceDecorator = new MatchDecorator({
    regexp: /^(?:[ \t]+)/gm,
    decorate: (add, from, _to, match) => {
      const marker = Decoration.mark({ class: "cm-indentWhitespace" });
      for (let pos = from; pos < from + match[0].length; pos++) {
        add(pos, pos + 1, marker);
      }
    },
  });

  const indentWhitespacePlugin = ViewPlugin.fromClass(
    class {
      decorations;

      constructor(view: EditorView) {
        this.decorations = indentWhitespaceDecorator.createDeco(view);
      }

      update(update: any) {
        this.decorations = indentWhitespaceDecorator.updateDeco(
          update,
          this.decorations,
        );
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  );

  const whitespaceTheme = EditorView.theme({
    "&": {
      "--whitespace-char": `'${whitespaceChar}'`,
      "--whitespace-color": whitespaceColor,
      "--whitespace-opacity": String(whitespaceOpacity),
    },
    ".cm-indentWhitespace": {
      position: "relative",
      color: "transparent",
      overflow: "visible",
      background: "transparent !important",
      backgroundImage: "none !important",
      backgroundSize: "auto !important",
      backgroundPosition: "initial !important",
    },
    ".cm-indentWhitespace::before": {
      content: "var(--whitespace-char)",
      position: "absolute",
      inset: "0 0 0 0",
      display: "inline-block",
      color: "var(--whitespace-color)",
      opacity: "var(--whitespace-opacity)",
      fontFamily: "monospace",
      fontSize: "inherit",
      lineHeight: "1",
      pointerEvents: "none",
      userSelect: "none",
      textAlign: "center",
    },
  });
</script>

<CodeMirror
  class="h-full w-full block"
  bind:value={content}
  onchange={handleOnChange}
  nodebounce={false}
  theme={solarizedLight}
  extensions={[
    debugKey,
    buildOnShiftEnter,
    codeMirrorPug,
    foldingOnIndent,
    immediateChange,
    whitespaceTheme,
    indentWhitespacePlugin,
    specialCommentExtension,
    mixinHighlightExtension,
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
