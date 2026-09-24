<script lang="ts">
  import { onMount } from "svelte";
  import type { Fs } from "./lib/zen-fs-type";
  import Preview from "./Preview.svelte";

  const { fs, servePath }: { fs: Fs; servePath: string } = $props();

  let previewEl: Preview;

  const URL = "about:blank"; // Set it so it loads index.html from the root path

  // Placeholder for Codex

  export function refresh() {
    console.log("Refreshing preview");
    previewEl.refresh();
  }

  onMount(() => {
    // Placeholder for Codex
  });
</script>

<div>
  <Preview initialValue={URL} bind:this={previewEl} />
</div>
