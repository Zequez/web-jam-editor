<script lang="ts">
  import { WebAccess, type WebAccessFS } from "@zenfs/dom";
  import { get, set } from "idb-keyval";
  import { createSystemFs } from "./systemFs.svelte";

  import Preview from "./Preview.svelte";
  import SingleFileCoder from "./SingleFileCoder";
  import { onMount } from "svelte";

  const systemFs = createSystemFs();

  let content = $state("");
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
  </div>
  <div class="flex flex-grow w-full h-100">
    {#if systemFs.status === "loading"}
      <div class="size-full bg-gray-200 flex-cc">Loading...</div>
    {:else if systemFs.status === "empty"}
      <div class="size-full bg-gray-200 flex-cc">
        <span class="text-3/6">Open a folder to start</span>
      </div>
    {:else if systemFs.status === "ready" && systemFs.fs}
      <div class="w-1/2 h-full bg-gray-200">
        <SingleFileCoder
          initialValue={content}
          onChange={(v) => (content = v)}
        />
      </div>
      <div class="w-1/2 h-full bg-gray-300">
        <Preview initialValue="about:blank" />
      </div>
    {/if}
  </div>
</div>
