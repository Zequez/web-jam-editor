<script lang="ts">
  import { createSystemFs } from "@/stores/systemFs.svelte";

  import Loader from "./Loader.svelte";
  import WebJamName from "./WebJamName.svelte";
  import WrapAroundBar from "./WrapAroundBar/WrapAroundBar.svelte";
  import ProjectFrame from "./ProjectFrame.svelte";

  const systemFs = createSystemFs();
</script>

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
        {systemFs.name!}
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
            onclick={() => systemFs.loadTemplateFilesystem("default")}
            >Example project</button
          >
          <button
            class="uppercase bg-blue-400 hover:bg-blue-300 text-white font-semibold px-3 py1.5 rounded-1 b b-black/10 cursor-pointer"
            onclick={() => systemFs.loadTemplateFilesystem("foo")}
            >Foo project</button
          >
        </div>
      </div>
    </div>
  {:else if systemFs.status === "ready" && systemFs.fs}
    <ProjectFrame
      fs={systemFs.fs}
      sessionID={systemFs.sessionID}
      name={systemFs.name!}
    />
  {/if}
</WrapAroundBar>
