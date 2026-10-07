<script lang="ts">
  import { createSystemFs } from "@/stores/systemFs.svelte";

  import CoderFrame from "./CoderFrame.svelte";
  import Loader from "./Loader.svelte";
  import { OUTPUT_DIR, type CompileResult } from "@/lib/pure-pug-compiler";
  import PreviewHostFrame from "./PreviewHostFrame.svelte";
  import AssetsFrame from "./AssetsFrame/AssetsFrame.svelte";
  import WebJamName from "./WebJamName.svelte";
  import WrapAroundBar from "./WrapAroundBar/WrapAroundBar.svelte";
  import { setPreviewUrlStore } from "@/stores/previewUrlStore.svelte";

  let previewHostFrameEl: PreviewHostFrame | null = $state(null);

  const systemFs = createSystemFs();

  setPreviewUrlStore();

  $effect(() => {
    console.log("Status", systemFs.status);
  });

  type CompileError = Extract<CompileResult, { type: "pug-error" }>;
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
</script>

{#if resizing}
  <div class="fixed size-full bg-black/0 z-1000 cursor-ew-resize"></div>
{/if}
<WrapAroundBar>
  <div slot="menu">
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
  </div>
  {#if systemFs.status === "loading"}
    <div class="bg-gray-200 rounded-1 size-full flex-cc flex-col">
      <WebJamName />
      <div class="w-70 h-30 flex-cc">
        <Loader />
      </div>
    </div>
  {:else if systemFs.status === "empty"}
    <div class="bg-gray-200 rounded-1 size-full overflow-auto">
      <div
        class="py-6 md:py-24 px6 flex-cs flex-col space-y-3 max-w-screen-sm mx-auto text-center"
      >
        <WebJamName />
        <div class="flex flex-col space-y-3 w-100 max-w-full">
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
            onclick={() => systemFs.loadDefaultFilesystem()}
            >Example project</button
          >
        </div>
      </div>
    </div>
  {:else if systemFs.status === "ready" && systemFs.fs}
    <div class="flex w-full h-full relative">
      <div
        style={`width: calc(${codePanelSize * 100}% - 12px);`}
        class="shrink-0 h-full flex flex-col space-y-1.5"
      >
        <div class="flex-shrink-0 w-full">
          <AssetsFrame />
        </div>
        <div class="h-40% grow w-full">
          <div
            class="h-full w-full relative rounded-1 overflow-hidden shadow-[0_1px_0_#0007] bg-red"
          >
            <CoderFrame
              fs={systemFs.fs}
              onBuildEnds={afterBuild}
              onBuildError={handleBuildError}
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
        style={`width: ${(1 - codePanelSize) * 100}%;`}
      >
        <PreviewHostFrame
          fs={systemFs.fs}
          hiddenMode={codePanelSize === 1}
          servePath={OUTPUT_DIR}
          bind:this={previewHostFrameEl}
        />
        {#if currentBuildError}
          <div
            class="absolute overflow-auto inset-4 bg-black/80 b b-4 b-red-500 rounded-2 text-white font-mono whitespace-pre p6"
          >
            <div class="text-7">
              Error
              {#if currentBuildError.type === "pug-error"}
                <span>on Pug code</span>
              {/if}
            </div>

            {#if currentBuildError.error.code}
              <div>{currentBuildError.error.code}</div>
            {/if}

            {#if currentBuildError.error.message}
              {#if currentBuildError.error.stack}
                <div class="text-0.7em text-red-400">
                  {currentBuildError.error.stack}
                </div>
              {:else}
                <div>{currentBuildError.error.message}</div>
              {/if}

              <!-- {#if currentBuildError.error.stack}
                <div class="text-0.7em">{currentBuildError.error.stack}</div>
              {/if} -->
            {:else if currentBuildError.error.msg}
              <div>{currentBuildError.error.msg}</div>
            {/if}

            <!-- {JSON.stringify(currentBuildError, null, 2)} -->
          </div>
        {/if}
      </div>
    </div>
  {/if}
</WrapAroundBar>
