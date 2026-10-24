<script lang="ts">
  import type { StorageType } from "@/stores/projects-storage-service.svelte";
  import { SvelteMap } from "svelte/reactivity";

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
    console.log("PRE-ADDING project");
    if (!addingProject) return;
    if (addingProject.type === "clone") {
      console.log("Fetching zip!");
      addingProject.fetchStarted = true;
      try {
        const zipBlob = await fetchZip(sourceToZip(addingProject.sourceURL));
        await onAddProject(
          addingProject!.pathName,
          addingProject!.storage,
          zipBlob,
        );
        addingProject = null;
      } catch (e) {
        console.log("Error fetching", e);
        addingProject!.fetchStarted = false;
      }
    } else {
      await onAddProject(addingProject!.pathName, addingProject!.storage);
      addingProject = null;
    }
  }

  async function fetchZip(sourceURL: string) {
    console.log(`Fetching ${sourceURL}`);
    const response = await fetch(sourceURL);
    const contentType = response.headers.get("content-type")!;
    console.log("Content type", contentType);
    const isZip = isZipHeader(contentType);
    if (!isZip) {
      throw new Error("Project could not be loaded; not a zip file");
    }

    if (!response.ok) throw new Error(await response.text());
    return await response.blob();
  }

  async function checkZip(sourceURL: string) {
    console.log("Checking zip", sourceURL);
    const response = await fetch(sourceURL);
    console.log(response.ok, response.headers.get("content-type"));
    const ct = response.headers.get("content-type") || "";

    const isZip = isZipHeader(ct);

    if (response.ok && isZip) {
      return true;
    } else {
      return false;
    }
  }

  // let checkedSourceAvailability = $state(new SvelteMap<string, boolean>())

  let urlIsValid = $state(false);
  let sourceCheckStatus = $state<
    "not-ready" | "impossible" | "unknown" | "yes" | "no"
  >("not-ready");
  function mountJam(src: string) {
    sourceURL = src;
    checkURLValidity();
  }

  function checkURLValidity() {
    iframeUrl = "";

    if (!sourceURL) {
      urlIsValid = false;
      sourceCheckStatus = "not-ready";
      return;
    }

    try {
      new URL(sourceURL);
      urlIsValid = true;
      sourceCheckStatus = "unknown";
      debouncedCheckSourceAvailable();
    } catch (e) {
      urlIsValid = false;
      sourceCheckStatus = "impossible";
    }
  }

  let iframeUrl = $state("");
  let debounceTimer: ReturnType<typeof setTimeout>;
  function debouncedCheckSourceAvailable() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      checkSourceAvailable();
    }, 1000);
  }
  async function checkSourceAvailable() {
    console.log("Checking if  source is available");
    const zipAvailable = await checkZip(sourceToZip(sourceURL));
    console.log("MMMM,", zipAvailable);
    if (zipAvailable) {
      sourceCheckStatus = "yes";
      iframeUrl = sourceURL;
    } else {
      sourceCheckStatus = "no";
    }
  }

  function sourceToZip(sourceUrl: string) {
    return sourceUrl + "/source.zip";
  }

  function isZipHeader(contentType: string) {
    return [
      "application/zip",
      "application/x-zip-compressed",
      "application/x-zip",
      "multipart/x-zip",
    ].includes(contentType);
  }
</script>

<div class="flex gap-2 whitespace-nowrap w-full">
  {#if addingProject}
    <div class="flex grow gap-2">
      <input
        onkeydown={(e) => {
          if (e.key === "Enter") {
            handlePreAddProject();
          } else if (e.key === "Escape") {
            addingProject = null;
          }
        }}
        bind:this={addingInput}
        type="text"
        bind:value={addingProject.pathName}
        class="block grow bg-white rounded-1 px-2 b b-black/40"
      />
      <button
        class="px1 disabled:opacity-50 uppercase bg-gray-400 h8 b b-black/10 text-white rounded-1 enabled:hover:(bg-sky-500 text-white cursor-pointer)"
        onclick={() => {
          addingProject = null;
        }}>Cancel</button
      >
      <button
        class="px1 disabled:opacity-50 uppercase bg-gray-400 h8 b b-black/10 text-white rounded-1 enabled:hover:(bg-sky-500 text-white cursor-pointer)"
        onclick={handlePreAddProject}
        disabled={!addingProject.pathName}>Add</button
      >
    </div>
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
          onkeyup={checkURLValidity}
          placeholder="...or start from URL"
        />
        <button
          disabled={sourceCheckStatus !== "yes"}
          class="px1 disabled:opacity-50 uppercase bg-gray-400 h8 b b-black/10 text-white rounded-1 enabled:hover:(bg-sky-500 text-white cursor-pointer)"
          onclick={() => beginAddProject("clone")}>Clone</button
        >
      </div>

      {#if sourceCheckStatus === "impossible"}
        <div class="text-red-500">Invalid URL</div>
      {:else if sourceCheckStatus === "yes"}
        <div class="text-green-500">/source.zip found!</div>
      {:else if sourceCheckStatus === "no"}
        <div class="text-red-500">/source.zip not available</div>
      {:else if sourceCheckStatus === "unknown"}
        <div>Checking...</div>
      {/if}
    </div>
  {/if}
</div>
{#if !directoryPickerAvailable}
  <div class="text-3 italic mt1 opacity-60">
    Your browser does not support directory picker.
  </div>
{/if}

<div>
  Every Web Jam generated website includes it's own source code. Try cloning one
  of these websites and editting them locally:
</div>
<div class="grid cols-2 gap-2">
  {#snippet ShowcaseWebjamProject(address: string, title: string)}
    {@const href = `https://${address}`}
    <div class="flex flex-col bg-black/5 b b-black/10 rounded-2 text-3">
      <div class="grow">
        <a
          target="_blank"
          class="flex-cs underline underline-offset-2 px-3 py1.5 rounded-t-2 text-sky-500 hover:(text-white bg-sky-500)"
          {href}
        >
          <span>{address}</span>
          <span class="grow"></span>
          <div class="size-4 ml2 i i-fa-up-right-from-square"></div>
        </a>
        <div class="text-3 px3">{title}</div>
      </div>

      <button
        onclick={() => mountJam(href)}
        class="uppercase bg-gray-400 text-white b b-black/10 hover:(bg-sky-500 text-white) rounded-b-2 bg-black/0 px-1 py0.5 cursor-pointer"
        >Mount</button
      >
    </div>
  {/snippet}
  {@render ShowcaseWebjamProject(
    "ezequielschwartzman.org",
    "Ezequiel's personal website",
  )}
  {@render ShowcaseWebjamProject(
    "pantour.webjam.space",
    "Fantasy website for a sports club center",
  )}
  <!-- {@render ShowcaseWebjamProject(
    "gaia.webjam.space",
    "Gaia's personal site as interpreted by an AI",
  )} -->
</div>
{#if sourceCheckStatus !== "not-ready"}
  <div class="b-3 b-white rounded-2 overflow-hidden shadow-sm">
    <div class="bg-white text-center">IFRAME-EMBEDDED PREVIEW</div>
    {#if iframeUrl}
      <iframe
        title="Project to clone preview"
        src={iframeUrl}
        class="w-full aspect-square"
      ></iframe>
    {:else}
      <div class="w-full aspect-square flex-cc text-gray-400">
        No preview available
      </div>
    {/if}
  </div>
{/if}
