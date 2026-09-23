<script lang="ts">
  import { WebAccess, type WebAccessFS } from "@zenfs/dom";
  import { get, set } from "idb-keyval";

  let localFs = $state<WebAccessFS | null>(null);

  import Preview from "./Preview.svelte";
  import SingleFileCoder from "./SingleFileCoder";
  import { onMount } from "svelte";

  let loading = $state(true);
  let content = $state("");

  onMount(async () => {
    await restoreFilesystemFromSession();

    loading = false;
  });

  async function restoreFilesystemFromSession() {
    const dir = await extractSessionHandler();
    if (dir) {
      try {
        localFs = await createFilesystem(dir);
      } catch (e) {
        await clearSessionHandler();
      }
    }
  }

  function createFilesystem(dir: FileSystemDirectoryHandle) {
    return WebAccess.create({ handle: dir });
  }

  async function clearSessionHandler() {
    const handlerKey = sessionStorage.getItem("session-dir-handler");
    if (handlerKey) {
      await set(handlerKey, null);
      sessionStorage.removeItem("session-dir-handler");
    }
  }

  async function pickSessionFolder() {
    const dir = await window.showDirectoryPicker({
      mode: "readwrite",
    });
    await storeSessionHandler(dir);
    localFs = await createFilesystem(dir);
  }

  async function storeSessionHandler(dir: FileSystemDirectoryHandle) {
    const handlerKey = dir.name + "-" + Date.now();

    sessionStorage.setItem("session-dir-handler", handlerKey);
    await set(handlerKey, dir);
  }

  async function extractSessionHandler() {
    const handlerKey = sessionStorage.getItem("session-dir-handler");
    if (handlerKey) {
      return (
        ((await get(handlerKey)) as FileSystemDirectoryHandle | undefined) ||
        null
      );
    } else {
      return null;
    }
  }
</script>

<div class="h-screen w-full flex flex-col">
  <div class="bg-gray-800 text-white flex shrink-0">
    <button
      class="h-full px-2 uppercase font-semibold text-3/6 hover:bg-white/20 cursor-pointer"
      onclick={pickSessionFolder}
    >
      <span class="i-fa-folder-open inline-block relative -bottom-2px"></span>
      Open Folder...
    </button>
  </div>
  <div class="flex flex-grow w-full h-100">
    {#if loading}
      <div class="size-full bg-gray-200 flex-cc">Loading...</div>
    {:else if !loading && !localFs}
      <div class="size-full bg-gray-200 flex-cc">
        <span class="text-3/6">Open a folder to start</span>
      </div>
    {:else}
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
