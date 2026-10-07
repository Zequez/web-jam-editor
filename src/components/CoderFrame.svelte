<script lang="ts">
  import { onMount } from "svelte";
  import SingleFileCoder from "./SingleFileCoder";
  import Loader from "./Loader.svelte";
  import {
    INPUT_FILE,
    build,
    type CompileResult,
  } from "@/lib/pure-pug-compiler";
  import type { Fs } from "@/lib/zen-fs-type";
  import BuildProgressBar from "./BuildProgressBar.svelte";
  import PublishingNote from "./PublishingNote.svelte";
  import AutoBuildBtn from "./AutoBuildBtn.svelte";

  const AUTO_SAVE_DEBOUNCE = 300;

  let loading = $state(true);
  let {
    fs,
    project,
    onBuildEnds,
    onBuildError,
  }: {
    fs: Fs;
    project: string;
    onBuildEnds: () => void;
    onBuildError: (
      error: Extract<CompileResult, { type: "pug-error" }>,
    ) => void;
  } = $props();
  let showPublishingNote = $state(false);

  let content = $state("");
  let autobuild = $state(
    JSON.parse(localStorage.getItem("autobuild") || "true"),
  );

  let recoveryKey = $derived(`pendingWrite:${project}`);

  $effect(() => {
    localStorage.setItem("autobuild", JSON.stringify(autobuild));
  });

  onMount(async () => {
    try {
      const fileContent = fs.readFileSync(INPUT_FILE, "utf-8");
      const recoveryContent = localStorage.getItem(recoveryKey);
      if (!fileContent && recoveryContent) {
        console.warn("Content recovered from file! PHEW!");
        content = recoveryContent;
      } else {
        content = fileContent;
      }
    } catch (e) {
      console.error("ERROR", e);
      if (!fs.existsSync(INPUT_FILE)) {
        fs.writeFileSync(INPUT_FILE, "");
      }
    }

    await doBuild();
    loading = false;
  });

  function handleChange(newContent: string) {
    console.log("Handling change");
    content = newContent;
    scheduleSave();
  }

  function handleChanging() {
    buildScheduleProgress = 0;
  }

  let buildScheduleProgressTicker: ReturnType<typeof setInterval> | null = null;
  let buildScheduleProgress = $state(1);
  let savingAt = $state(-1);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  function scheduleSave() {
    console.log("Scheduling save");
    if (!autobuild) {
      safeSaveToFile(content);
      return;
    }

    if (saveTimer) clearTimeout(saveTimer);
    savingAt = Date.now() + AUTO_SAVE_DEBOUNCE;
    if (!buildScheduleProgressTicker) {
      beginBuildScheduleProgressTicker();
    }
    saveTimer = setTimeout(async () => {
      safeSaveToFile(content);
      savingAt = -1;
      saveTimer = null;
      if (buildScheduleProgressTicker) {
        clearInterval(buildScheduleProgressTicker);
        buildScheduleProgressTicker = null;
      }
      doBuild();
      buildScheduleProgress = calculateBuildScheduleProgress();
    }, AUTO_SAVE_DEBOUNCE);
  }

  function safeSaveToFile(content: string) {
    localStorage.setItem(recoveryKey, content);
    fs.writeFileSync(INPUT_FILE, content);

    console.log("Saved");
    setTimeout(() => {
      localStorage.removeItem(recoveryKey);
    }, 500);
  }

  function handleAutobuildChange() {
    if (autobuild) {
      scheduleSave();
    }
  }

  async function doBuild() {
    console.log("Doing build");
    const result = await build();
    if (!autobuild) buildScheduleProgress = 1;
    if (result.type === "pug-error") {
      onBuildError(result);
    } else if (result.type === "success") {
      onBuildEnds();
    }
  }

  function beginBuildScheduleProgressTicker() {
    buildScheduleProgress = calculateBuildScheduleProgress();
    buildScheduleProgressTicker = setInterval(() => {
      buildScheduleProgress = calculateBuildScheduleProgress();
    }, 20);
  }

  function calculateBuildScheduleProgress() {
    if (savingAt === -1) {
      return 1;
    } else {
      return Math.min(1, 1 - (savingAt - Date.now()) / AUTO_SAVE_DEBOUNCE);
    }
  }
</script>

{#if loading}
  <Loader />
{:else}
  <div class="size-full flex flex-col">
    <div
      class="h-6 bg-gray-700 font-mono text-3/6 flex-cs pl-2 text-white relative"
    >
      <span class="mr2">{INPUT_FILE}</span>
      <BuildProgressBar progress={buildScheduleProgress} />
      <AutoBuildBtn
        onManualBuild={doBuild}
        bind:checked={autobuild}
        onchange={handleAutobuildChange}
      />
      <span class="grow"></span>
      <button
        class="cursor-pointer hover:bg-white/20 px-2"
        onclick={() => (showPublishingNote = true)}>Publish</button
      >

      {#if showPublishingNote}
        <PublishingNote onClose={() => (showPublishingNote = false)} />
      {/if}
    </div>
    <SingleFileCoder
      initialValue={content}
      onChange={handleChange}
      onTyping={handleChanging}
      onBuildAction={doBuild}
    />
  </div>
{/if}
