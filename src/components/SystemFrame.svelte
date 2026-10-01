<script lang="ts">
  import { createSystemFs } from "@/stores/systemFs.svelte";

  import CoderFrame from "./CoderFrame.svelte";
  import Loader from "./Loader.svelte";
  import { OUTPUT_DIR } from "@/lib/pure-pug-compiler";
  import PreviewHostFrame from "./PreviewHostFrame.svelte";
  import AssetsFrame from "./AssetsFrame/AssetsFrame.svelte";
  import EdgeButtons from "./EdgeButtons.svelte";
  import WebJamName from "./WebJamName.svelte";

  let previewHostFrameEl: PreviewHostFrame | null = $state(null);

  const systemFs = createSystemFs();

  $effect(() => {
    console.log("Status", systemFs.status);
  });

  function afterBuild() {
    previewHostFrameEl?.refresh();
  }

  let codePanelSize = $state(0.6);
  let resizing = $state(false);

  function handleStartDragResize(ev: MouseEvent) {
    resizing = true;
    const splitter = ev.currentTarget as HTMLElement;
    const container = splitter.parentElement;
    if (!container) return;

    const { left, width } = container.getBoundingClientRect();
    const splitterWidth = splitter.getBoundingClientRect().width;

    function handleMouseUp() {
      resizing = false;
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);

      if (codePanelSize === 1) {
        // const previewUrl = previewHostFrameEl?.generateUrl();
        // open new tab
      }
    }

    function handleMouseMove(ev: MouseEvent) {
      const position = (ev.clientX - left + splitterWidth / 2) / width;

      if (position > 0.9) {
        codePanelSize = 1;
      } else if (position < 0.2) {
        codePanelSize = 0.2;
      } else {
        codePanelSize = position;
      }
    }

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
  }
</script>

<div class="fixed top-0 left-1/2 w-40 h-5.2 -translate-x-20 z-1000">
  <EdgeButtons />
</div>

{#if resizing}
  <div class="fixed size-full bg-black/0 z-1000 cursor-ew-resize"></div>
{/if}
<div class="h-screen w-full flex flex-col">
  <div class="bg-gray-800 text-white flex shrink-0 h-6 text-3/6">
    {#if systemFs.status === "empty"}
      <button
        class="h-full px-2 uppercase font-semibold text-3/6 hover:bg-white/20 cursor-pointer"
        onclick={systemFs.pickSessionFolder}
      >
        <span class="i-fa-folder-open inline-block relative -bottom-2px"></span>
        Open Folder...
      </button>
    {:else if systemFs.status === "ready"}
      <button
        onclick={systemFs.clearSession}
        class="h-full px-2 uppercase font-semibold text-3/6 hover:bg-white/20 cursor-pointer"
      >
        <span class="i-fa-close inline-block relative -bottom-2px"></span>
        Close
      </button>
      <span class="px-2 font-mono">
        {systemFs.dirName}
      </span>
    {/if}

    <div class="flex-grow"></div>
    <a
      href="http://github.com/zequez/web-jam-editor"
      target="_blank"
      class="h-full flex-cc whitespace-nowrap hover:bg-white/20 cursor-pointer px2"
    >
      <span class="i-fa-brands-github h-full w-5 mr1"></span>
      <span>Web Jam Editor</span>
      <span class="i-fa-up-right-from-square h-full w-3 ml1"></span>
    </a>
  </div>
  <div class="flex flex-grow w-full h-100">
    {#if systemFs.status === "loading"}
      <div class="flex flex-col">
        <WebJamName />
        <Loader />
      </div>
    {:else if systemFs.status === "empty"}
      <div class="size-full bg-gray-200 flex-cc flex-col space-y-3">
        <WebJamName />
        <button
          class="uppercase bg-blue-400 hover:bg-blue-300 text-white font-semibold px-3 py1.5 rounded-1 b b-black/10 cursor-pointer"
          onclick={systemFs.pickSessionFolder}>Open a folder</button
        >
        <button
          class="uppercase bg-blue-400 hover:bg-blue-300 text-white font-semibold px-3 py1.5 rounded-1 b b-black/10 cursor-pointer"
          onclick={() => systemFs.loadEmptyFilesystem()}>Empty project</button
        >
        <button
          class="uppercase bg-blue-400 hover:bg-blue-300 text-white font-semibold px-3 py1.5 rounded-1 b b-black/10 cursor-pointer"
          onclick={() => systemFs.loadEmptyFilesystem()}>Example project</button
        >
      </div>
    {:else if systemFs.status === "ready" && systemFs.fs}
      <div class="flex w-full relative">
        <div
          style={`width: calc(${codePanelSize * 100}% - 12px);`}
          class="shrink-0 h-full bg-gray-200 flex flex-col pr0"
        >
          <div class="h-20% flex-shrink-0 w-full">
            <AssetsFrame />
          </div>
          <div class="h-80% grow w-full p1.5 pr-0 bg-gray-300">
            <div
              class="h-full w-full relative rounded-1 overflow-hidden shadow-[0_1px_0_#0007] bg-red"
            >
              <CoderFrame fs={systemFs.fs} onBuildEnds={afterBuild} />
            </div>
          </div>
        </div>
        <button
          aria-label="Drag"
          class={[
            "group bg-gray-300 relative h-full cursor-ew-resize w-12px shrink-0",
            {},
          ]}
          onmousedown={handleStartDragResize}
        >
          <div
            class={[
              "absolute group-hover:block top-2 bottom-2 left-1/2 -translate-x-1/2 rounded-full  w-1",
              {
                "block bg-purple-500": resizing,
                "hidden bg-black/30": !resizing,
              },
            ]}
          ></div>
        </button>
        <div
          class="h-full bg-gray-300"
          style={`width: ${(1 - codePanelSize) * 100}%;`}
        >
          <PreviewHostFrame
            fs={systemFs.fs}
            hiddenMode={codePanelSize === 1}
            servePath={OUTPUT_DIR}
            bind:this={previewHostFrameEl}
          />
        </div>
      </div>
    {/if}
  </div>
</div>
