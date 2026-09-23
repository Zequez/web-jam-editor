<script lang="ts">
  import { onMount } from "svelte";
  import pug from "./lib/pug-browser.ts";
  import { get, set } from "idb-keyval";

  import { configureSingle, fs } from "@zenfs/core";
  import { IndexedDB } from "@zenfs/dom";

  type Project = {
    dir: FileSystemDirectoryHandle | null;
  };

  onMount(async () => {
    await configureSingle({ backend: IndexedDB });
    projects = (await get("projects")) || {};
    currentProjectName = (await get("currentProject")) || null;
    await mountProject();
  });

  let isCreatingProject = $state(false);
  let newProjectName = $state("");
  let projects = $state<{ [key: string]: Project } | null>(null);
  let currentProjectName = $state<null | string>(null);
  let currentProject = $derived(
    projects && currentProjectName ? projects[currentProjectName] : null,
  );
  $effect(() => {
    projects && set("projects", $state.snapshot(projects));
    currentProjectName &&
      set("currentProject", $state.snapshot(currentProjectName));
  });

  function beginCreateProject() {
    isCreatingProject = true;
  }

  function confirmCreateProject() {
    projects![newProjectName] = { dir: null };
    currentProjectName = newProjectName;
    isCreatingProject = false;
  }

  function switchProject() {
    // currentProjectName = projectName;
    mountProject();
  }

  async function mountProject() {
    if (currentProject?.dir) {
      const selectedIndexFile = await currentProject.dir.getFileHandle(
        "index.pug",
        {
          create: true,
        },
      );
      const file = await selectedIndexFile.getFile();

      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }

      directoryVersion += 1;
      dir = currentProject.dir;
      indexFile = selectedIndexFile;
      content = await file.text();
      status = "Saved";
    } else {
      dir = null;
      indexFile = null;
      content = "";
      status = "Pick a directory to begin";
    }
  }

  let dir: FileSystemDirectoryHandle | null = $state(null);
  let indexFile: FileSystemFileHandle | null = $state(null);
  let content = $state("");
  let output = $state("");
  let status = $state("Pick a directory to begin");
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveQueue: Promise<void> = Promise.resolve();
  let directoryVersion = 0;

  async function pick() {
    if (!currentProject) return;
    if (!currentProject.dir) {
      currentProject.dir = await window.showDirectoryPicker();
      mountProject();
    }
  }

  function updateContent(event: Event) {
    content = (event.currentTarget as HTMLTextAreaElement).value;
    console.log("content", content);
    const renderTemplate = pug.compile(content, {
      compileDebug: false,
      inlineRuntimeFunctions: true,
      name: "template",
    });
    output = renderTemplate({});
    scheduleSave();
  }

  function saveOutput() {}

  function scheduleSave() {
    if (!indexFile) return;

    if (saveTimer) clearTimeout(saveTimer);

    const contentToSave = content;
    const fileToSave = indexFile;
    const versionToSave = directoryVersion;
    status = "Saving...";

    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveQueue = saveQueue
        .catch(() => undefined)
        .then(async () => {
          const writable = await fileToSave.createWritable();
          await writable.write(contentToSave);
          await writable.close();

          if (directoryVersion === versionToSave) status = "Saved";
        })
        .catch((error) => {
          if (directoryVersion === versionToSave) status = "Could not save";
          console.error("Unable to save index.pug", error);
        });
    }, 400);
  }
</script>

<div class="h-screen flex flex-col">
  <div class="h-12 p2 bg-gray-200 flex items-center gap-3">
    {#if Object.keys(projects || {}).length > 0}
      <select
        bind:value={currentProjectName}
        onchange={() => switchProject()}
        class="h-full px2 bg-white rounded-2 w-40"
      >
        {#each Object.keys(projects || {}) as project}
          <option value={project}>{project}</option>
        {/each}
      </select>
    {/if}
    {#if currentProjectName}
      {#if dir}
        <span class="text-sm text-gray-600"
          >{dir.name}/index.pug · {status}</span
        >
      {:else}
        <button
          class="h-full px2 rounded-2 cursor-pointer uppercase text-white font-semibold bg-gray-500 hover:bg-gray-400"
          onclick={pick}>Pick directory</button
        >
      {/if}
    {/if}
    <div class="grow"></div>
    <div class="h-full flex gap-3">
      {#if !isCreatingProject}
        <button
          onclick={beginCreateProject}
          class="h-full px2 rounded-2 cursor-pointer uppercase text-white font-semibold bg-gray-500 hover:bg-gray-400"
          >New project</button
        >
      {:else}
        <input
          class="bg-white font-mono px2 block"
          type="text"
          placeholder="Project name"
          bind:value={newProjectName}
        />
        <button
          onclick={confirmCreateProject}
          disabled={!!(!newProjectName || projects![newProjectName])}
          class="h-full px2 rounded-2 cursor-pointer uppercase text-white font-semibold bg-gray-500 hover:bg-gray-400 disabled:opacity-50"
          >Create</button
        >
        <button
          onclick={() => (isCreatingProject = false)}
          class="h-full px2 rounded-2 cursor-pointer uppercase text-white font-semibold bg-gray-500 hover:bg-gray-400"
          >Cancel</button
        >
      {/if}
    </div>
  </div>
  <div class="grow flex">
    {#if dir}
      <textarea
        class="w-1/2 shrink-0 h-full bg-white font-mono p4 block"
        value={content}
        oninput={updateContent}
        aria-label="index.pug editor"
      ></textarea>
    {/if}
    <div class="grow">
      <iframe class="w-full h-full" srcdoc={output}></iframe>
    </div>
  </div>
</div>
