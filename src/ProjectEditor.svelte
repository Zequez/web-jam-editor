<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import { StreamLanguage } from "@codemirror/language";
  import { pug as langPug } from "@codemirror/legacy-modes/mode/pug";
  import UNO from "./lib/uno.ts";
  const uno = UNO.uno;

  const STILLNESS = 500;

  import pug from "./lib/pug-browser.ts";
  const projectName = document.location.hash.slice(1);

  const codeMirrorPug = StreamLanguage.define(langPug);

  import { onMount } from "svelte";
  import { createProjectFsState } from "./projectFs.svelte";

  let loaded = $state(false);

  const FS = createProjectFsState(projectName);

  let indexFile: string = $state(FS.readCreateFile("index.pug"));
  FS.mkdir("dist");
  let outputFile = $state(FS.readCreateFile("dist/index.html"));

  onMount(async () => {
    loaded = true;
  });

  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  function updateIndexPug(content: string) {
    console.log("updating", content);
    if (saveTimer) clearTimeout(saveTimer);
    indexFile = content;
    FS.writeFile("index.pug", content);
    saveTimer = setTimeout(() => build(), STILLNESS);
  }

  async function build() {
    console.log("Building");
    const renderTemplate = pug.compile(indexFile);
    const html = renderTemplate({});
    const css = await extractCss(html);
    const htmlWithStyle = html.replace(
      "</head>",
      `<style>${css}</style></head>`,
    );

    outputFile = htmlWithStyle;

    FS.writeFile("dist/index.html", outputFile);
  }

  async function extractCss(html: string) {
    const tokens = new Set<string>();

    const result = await uno.applyExtractors(html);
    for (const token of result) {
      tokens.add(token);
    }

    const { css } = await uno.generate([...tokens], {
      preflights: true,
      minify: false,
    });

    return css;
  }
</script>

<div class="h-screen w-full flex flex-col">
  <div class="flex flex-grow w-full h-100">
    <div class="w-1/2 h-full bg-gray-200">
      {#if loaded}
        <!-- <textarea
        class="w-full h-full font-mono p2 block"
        value={indexFile}
        oninput={(e) => updateIndexPug(e.currentTarget.value)}
      ></textarea> -->
        <CodeMirror
          class="h-full w-full block"
          bind:value={indexFile}
          onchange={updateIndexPug}
          extensions={[codeMirrorPug]}
        />
      {/if}
    </div>
    <div class="w-1/2 h-full bg-gray-300">
      <iframe title="Preview" class="w-full h-full" srcdoc={outputFile}
      ></iframe>
    </div>
  </div>
  <div class="h-10 p2 bg-gray-800 text-white flex shrink-0 gap-2">
    <div class="font-mono bg-white/10 rounded-1 px1">{projectName}</div>
    <div class="font-mono bg-emerald-400 px-2 text-white text-3/6 rounded-1">
      Browser FS (OK)
    </div>
    <button
      onclick={() => FS.requestDir()}
      class="font-mono bg-gray-400 px-2 text-white text-3/6 rounded-1 cursor-pointer"
    >
      {#if FS.isLocallyMounted}
        Local FS ({FS.localDirName})
      {:else}
        Pick Local FS
      {/if}
    </button>
  </div>
</div>

<style>
  :global(.cm-editor) {
    height: 100% !important;
  }
</style>
