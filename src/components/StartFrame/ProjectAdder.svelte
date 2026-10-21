<script lang="ts">
  import type { StorageType } from "@/stores/projects-storage.svelte";

  const directoryPickerAvailable = "showDirectoryPicker" in window;

  const {
    onAddProject,
  }: { onAddProject: (name: string, storage: StorageType) => void } = $props();

  let addingProject: {
    type: "dir" | "mem";
    path: string;
    storage: StorageType;
  } | null = $state(null);

  async function beginAddProject(type: "dir" | "mem") {
    // addingProject = { type, path: "" };

    if (type === "dir") {
      try {
        const handle = await openDirectoryPicker();
        addingProject = {
          type: "dir",
          path: handle.name,
          storage: {
            type: "dir",
            handle: handle,
          },
        };
      } catch (e) {
        console.log("Canceled");
        addingProject = null;
        return;
      }
    } else if (type == "mem") {
      addingProject = {
        type: "mem",
        path: "jam-" + Math.random().toString(36).slice(2),
        storage: {
          type: "mem",
          storeName: "",
        },
      };
    }
  }

  async function openDirectoryPicker() {
    return await window.showDirectoryPicker({
      mode: "readwrite",
    });
  }

  let addingInput: HTMLInputElement | null = $state(null);

  $effect(() => {
    if (addingInput) {
      addingInput.focus();
      addingInput.select();
    }
  });
</script>

<div class="flex gap-2 whitespace-nowrap">
  {#if addingProject}
    <input
      onkeydown={(e) => {
        if (e.key === "Enter") {
          onAddProject(addingProject!.path, addingProject!.storage);
          addingProject = null;
        } else if (e.key === "Escape") {
          addingProject = null;
        }
      }}
      onblur={() => {
        addingProject = null;
      }}
      bind:this={addingInput}
      type="text"
      bind:value={addingProject.path}
      class="block grow bg-white rounded-1 px-2 b b-black/40"
    />
  {:else}
    <button
      onclick={() => beginAddProject("dir")}
      disabled={!directoryPickerAvailable}
      class="bg-gray-400 text-white rounded-1 px-2 py1 b b-black/20 enabled:hover:bg-sky-500 disabled:opacity-50"
      >New on directory</button
    >
    <button
      onclick={() => beginAddProject("mem")}
      class="bg-gray-400 text-white rounded-1 px-2 py1 b b-black/20 hover:bg-sky-500"
      >New on memory</button
    >
  {/if}
</div>
{#if !directoryPickerAvailable}
  <div class="text-3 italic mt1 opacity-60">
    Your browser does not support directory picker.
  </div>
{/if}
