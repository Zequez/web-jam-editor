<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import { EditorView } from "@codemirror/view";
  import { StreamLanguage } from "@codemirror/language";
  import { pug as langPug } from "@codemirror/legacy-modes/mode/pug";
  import { solarizedLight } from "thememirror";
  import { foldingOnIndent } from "./foldingService";

  const codeMirrorPug = StreamLanguage.define(langPug);

  let { onChange, initialValue, onTyping } = $props<{
    onChange: (value: string) => void;
    onTyping: () => void;
    initialValue: string;
  }>();

  let content: string = $state(initialValue || "");

  function handleOnChange() {
    if (onChange) onChange(content);
  }

  const immediateChange = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onTyping();
    }
  });
</script>

<CodeMirror
  class="h-full w-full block"
  bind:value={content}
  onchange={handleOnChange}
  nodebounce={false}
  theme={solarizedLight}
  extensions={[codeMirrorPug, foldingOnIndent, immediateChange]}
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
