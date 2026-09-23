<script lang="ts">
  import { fs, configureSingle } from "@zenfs/core";
  import { type WebAccessFS } from "@zenfs/dom";
  import { onMount } from "svelte";
  import SingleFileCoder from "./SingleFileCoder";
  import Loader from "./Loader.svelte";

  let loading = $state(true);
  let { fs: propsFs }: { fs: WebAccessFS } = $props();

  let content = $state("");

  onMount(async () => {
    await configureSingle(propsFs);
    content = fs.readFileSync("index.pug", "utf-8");

    loading = false;
  });
</script>

{#if loading}
  <Loader />
{:else}
  <SingleFileCoder initialValue={content} onChange={(v) => (content = v)} />
{/if}
