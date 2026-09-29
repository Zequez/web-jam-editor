<script lang="ts">
  import { onMount } from "svelte";
  import SingleFileCoder from "./SingleFileCoder";
  import Loader from "./Loader.svelte";
  import { INPUT_FILE, build } from "@/lib/pure-pug-compiler";
  import type { Fs } from "@/lib/zen-fs-type";
  import BuildProgressBar from "./BuildProgressBar.svelte";
  import PublishingNote from "./PublishingNote.svelte";

  const AUTO_SAVE_DEBOUNCE = 300;

  let loading = $state(true);
  let { fs, onBuildEnds }: { fs: Fs; onBuildEnds: () => void } = $props();
  let showPublishingNote = $state(false);

  let content = $state("");

  onMount(async () => {
    try {
      content = fs.readFileSync(INPUT_FILE, "utf-8");
    } catch (e) {
      fs.writeFileSync(INPUT_FILE, "");
    }

    await initialBuild();
    loading = false;
  });

  function handleChange(newContent: string) {
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
    if (saveTimer) clearTimeout(saveTimer);
    savingAt = Date.now() + AUTO_SAVE_DEBOUNCE;
    if (!buildScheduleProgressTicker) {
      beginBuildScheduleProgressTicker();
    }
    saveTimer = setTimeout(async () => {
      fs.writeFileSync(INPUT_FILE, content);
      savingAt = -1;
      saveTimer = null;
      if (buildScheduleProgressTicker) {
        clearInterval(buildScheduleProgressTicker);
        buildScheduleProgressTicker = null;
      }
      buildScheduleProgress = calculateBuildScheduleProgress();

      await build();
      onBuildEnds();
    }, AUTO_SAVE_DEBOUNCE);
  }

  async function initialBuild() {
    await build();
    onBuildEnds();
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
    />
  </div>
{/if}
