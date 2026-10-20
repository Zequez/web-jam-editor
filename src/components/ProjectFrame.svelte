<script lang="ts">
  import { type Fs } from "@/lib/zen-fs-type";
  import {
    OUTPUT_DIR,
    type CompileResult,
    type CompileError,
  } from "@/lib/pure-pug-compiler";

  import AssetsFrame from "./AssetsFrame";
  import CoderFrame from "./CoderFrame.svelte";
  import PreviewHostFrame from "./PreviewHostFrame.svelte";
  import BuildErrorDisplay from "./BuildErrorDisplay.svelte";

  const { fs, sessionID, name }: { fs: Fs; sessionID: string; name: string } =
    $props();

  let previewHostFrameEl: PreviewHostFrame | null = $state(null);

  let currentBuildError = $state<CompileError | null>(null);
  function afterBuild() {
    currentBuildError = null;
    previewHostFrameEl?.refresh();
  }

  function handleBuildError(buildError: CompileError) {
    console.log("Handling build errror", buildError);
    currentBuildError = buildError;
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

  const previewIsHidden = $derived(codePanelSize === 1);
</script>

{#if resizing}
  <div class="fixed size-full bg-black/0 z-1000 cursor-ew-resize"></div>
{/if}

<div class="flex w-full h-full relative">
  <div
    style={`width: calc(${codePanelSize * 100}% - 12px); max-width: ${currentBuildError ? "75%" : "100%"}`}
    class="shrink-0 h-full flex flex-col space-y-1.5"
  >
    <div class="max-h-50% w-full">
      <AssetsFrame />
    </div>
    <div class="h-40% grow w-full">
      <div
        class="h-full w-full relative rounded-1 overflow-hidden shadow-[0_1px_0_#0007] bg-red"
      >
        <CoderFrame
          {fs}
          onBuildEnds={afterBuild}
          onBuildError={handleBuildError}
          project={name}
        />
      </div>
    </div>
  </div>
  <button
    aria-label="Drag"
    class={["group relative h-full cursor-ew-resize w-12px shrink-0", {}]}
    onmousedown={handleStartDragResize}
  >
    <div
      class={[
        "absolute group-hover:block top-2 bottom-2 left-1/2 -translate-x-1/2 rounded-full  w-1",
        {
          "block bg-violet-500": resizing,
          "hidden bg-black/30": !resizing,
        },
      ]}
    ></div>
  </button>
  <div
    class="h-full relative"
    style={`min-width: ${currentBuildError ? "25%" : "0%"}; width: ${previewIsHidden && currentBuildError ? 25 : (1 - codePanelSize) * 100}%;`}
  >
    <PreviewHostFrame
      {fs}
      sessionId={sessionID}
      hiddenMode={codePanelSize === 1}
      servePath={OUTPUT_DIR}
      bind:this={previewHostFrameEl}
    />
    {#if currentBuildError}
      <BuildErrorDisplay buildError={currentBuildError} />
    {/if}
  </div>
</div>
