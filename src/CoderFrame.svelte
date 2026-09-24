<script lang="ts">
  import { onMount } from "svelte";
  import SingleFileCoder from "./SingleFileCoder";
  import Loader from "./Loader.svelte";
  import { INPUT_FILE, build } from "./lib/compiler";
  import type { Fs } from "./lib/zen-fs-type";
  import BuildProgressBar from "./BuildProgressBar.svelte";

  const AUTO_SAVE_DEBOUNCE = 300;

  let loading = $state(true);
  let { fs, onBuildEnds }: { fs: Fs; onBuildEnds: () => void } = $props();

  let content = $state("");

  onMount(async () => {
    try {
      content = fs.readFileSync(INPUT_FILE, "utf-8");
    } catch (e) {
      fs.writeFileSync(INPUT_FILE, "");
    }

    loading = false;
  });

  function handleChange(newContent: string) {
    content = newContent;
    scheduleSave();
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
    <div class="h-6 bg-gray-700 font-mono text-3/6 flex-cs px-2 text-white">
      <span class="mr2">{INPUT_FILE}</span>
      <BuildProgressBar progress={buildScheduleProgress} />
    </div>
    <SingleFileCoder initialValue={content} onChange={handleChange} />
  </div>
{/if}
