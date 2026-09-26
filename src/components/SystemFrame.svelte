<script lang="ts">
  import { createSystemFs } from "@/stores/systemFs.svelte";

  import CoderFrame from "./CoderFrame.svelte";
  import Loader from "./Loader.svelte";
  import { OUTPUT_DIR } from "@/lib/pure-pug-compiler";
  import PreviewHostFrame from "./PreviewHostFrame.svelte";
  import AssetsFrame from "./AssetsFrame/AssetsFrame.svelte";
  import Sustainers from "./EdgeButtons.svelte";

  let previewHostFrameEl: PreviewHostFrame | null = $state(null);

  const systemFs = createSystemFs();

  $effect(() => {
    console.log("Status", systemFs.status);
  });

  function afterBuild() {
    previewHostFrameEl?.refresh();
  }
</script>

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
    <div class="grow flex-cc">
      <Sustainers />
    </div>
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
      <Loader />
    {:else if systemFs.status === "empty"}
      <div class="size-full bg-gray-200 flex-cc">
        <span class="text-3/6">Open a folder to start</span>
      </div>
    {:else if systemFs.status === "ready" && systemFs.fs}
      <div class="w-1/2 h-full bg-gray-200 flex-ss flex-col">
        <div class="h-1000 w-full">
          <AssetsFrame />
        </div>
        <div class="h-3000 w-full p1.5 bg-gray-300">
          <div
            class="size-full rounded-1 overflow-hidden shadow-[0_1px_0_#0007]"
          >
            <CoderFrame fs={systemFs.fs} onBuildEnds={afterBuild} />
          </div>
        </div>
      </div>
      <div class="w-1/2 h-full bg-gray-300">
        <PreviewHostFrame
          fs={systemFs.fs}
          servePath={OUTPUT_DIR}
          bind:this={previewHostFrameEl}
        />
      </div>
    {/if}
  </div>
</div>
