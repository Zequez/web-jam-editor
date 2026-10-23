<script lang="ts">
  import type { StorageType } from "@/stores/projects-storage-service.svelte";

  const directoryPickerAvailable = "showDirectoryPicker" in window;

  const {
    onAddProject,
  }: {
    onAddProject: (name: string, storage: StorageType, zipBlob?: Blob) => void;
  } = $props();

  let sourceURL = $state("");
  type AddingState =
    | {
        type: "dir";
        pathName: string;
        storage: { type: "dir"; handle: FileSystemDirectoryHandle };
      }
    | {
        type: "mem";
        pathName: string;
        storage: { type: "mem"; storeName: string };
      }
    | {
        type: "clone";
        storage: { type: "mem"; storeName: string };
        sourceURL: string;
        fetchStarted: boolean;
        pathName: string;
      }
    | null;

  let addingProject: AddingState = $state(null);

  async function beginAddProject(
    type: "dir" | "mem" | "clone",
    trySourceZip: boolean = false,
  ) {
    if (type === "dir") {
      try {
        const handle = await openDirectoryPicker();
        addingProject = {
          type: "dir",
          pathName: handle.name,
          storage: {
            type: "dir",
            handle: handle,
          },
        };
      } catch (e) {
        console.log("Canceled");
        return;
      }
    } else if (type === "mem") {
      let pathName = "jam-" + Math.random().toString(36).slice(2);
      addingProject = {
        type: "mem",
        pathName,
        storage: {
          type: "mem",
          storeName: "",
        },
      };
    } else if (type === "clone") {
      let pathName = "jam-" + Math.random().toString(36).slice(2);
      addingProject = {
        type: "clone",
        pathName,
        sourceURL,
        fetchStarted: false,
        storage: {
          type: "mem",
          storeName: "",
        },
      };
    }
  }

  function fetchZipProject() {}

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

  async function handlePreAddProject() {
    if (!addingProject) return;
    if (addingProject.type === "clone") {
      addingProject.fetchStarted = true;
      try {
        const zipBlob = await fetchZip();
        onAddProject(addingProject!.pathName, addingProject!.storage, zipBlob);
      } catch (e) {
        console.log("Error fetching", e);
        addingProject.fetchStarted = false;
      }
    } else {
      onAddProject(addingProject!.pathName, addingProject!.storage);
    }
  }

  async function fetchZip(
    thisSourceURL: string = sourceURL,
    tryingSourceZip: boolean = false,
  ) {
    if (thisSourceURL) {
      console.log(`Fetching ${thisSourceURL}`);
      const response = await fetch(`${thisSourceURL}`);
      const contentType = response.headers.get("content-type")!;
      console.log("Content type", contentType);
      const isZip = contentType.startsWith("application/zip");
      if (!isZip) {
        if (tryingSourceZip) {
          throw new Error("Project could not be loaded");
        }
        const nextURL = thisSourceURL.replace(/\/$/, "") + "/source.zip";
        return fetchZip(nextURL, true);
      }

      if (!response.ok) throw new Error(await response.text());
      return await response.blob();
    } else {
      throw "Error no source URL";
    }
  }
</script>

<div class="flex gap-2 whitespace-nowrap w-full">
  {#if addingProject}
    <input
      onkeydown={(e) => {
        if (e.key === "Enter") {
          handlePreAddProject();
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
      bind:value={addingProject.pathName}
      class="block grow bg-white rounded-1 px-2 b b-black/40"
    />
  {:else}
    <div class="w-full flex flex-col gap-2">
      <div class="flex gap-2">
        <button
          onclick={() => beginAddProject("dir")}
          disabled={!directoryPickerAvailable}
          class="grow cursor-pointer bg-gray-400 text-white rounded-1 px-2 py1 b b-black/20 enabled:hover:bg-sky-500 disabled:opacity-50"
          >Pick folder</button
        >
        <button
          onclick={() => beginAddProject("mem")}
          class="grow cursor-pointer bg-gray-400 text-white rounded-1 px-2 py1 b b-black/20 hover:bg-sky-500"
          >New</button
        >
      </div>
      <div class="flex gap-2">
        <input
          type="text"
          class="block grow h8 px2 min-w-0 w-auto bg-white font-mono rounded-1
          focus:(outline-2.5 outline-solid outline-sky-400/77 outline-offset-0)
        outline-none shadow-[inset_0_0_2px_#0005] b-1 b-black/30 outline-offset-2"
          bind:value={sourceURL}
          placeholder="...or start from URL"
        />
        <button
          class="px1 bg-gray-400 h8 b b-black/10 text-white rounded-1 hover:(bg-sky-500 text-white cursor-pointer)"
          onclick={() => beginAddProject("clone")}>Clone</button
        >
      </div>
    </div>
  {/if}
</div>
{#if !directoryPickerAvailable}
  <div class="text-3 italic mt1 opacity-60">
    Your browser does not support directory picker.
  </div>
{/if}
