<script lang="ts">
  import { onMount } from "svelte";
  import foo from "./tests/foo.pug?raw";

  import { compile, type CompileResult } from "@/lib/pure-pug-compiler";

  let fixValue = $state(localStorage.getItem("fix-value") === "true");
  $effect(() => {
    localStorage.setItem("fix-value", fixValue ? "true" : "false");
  });

  let value: string = $state(
    fixValue ? localStorage.getItem("lexer-test") || "" : foo,
  );

  $effect(() => {
    if (fixValue) {
      localStorage.setItem("lexer-test", value);
    }
  });

  let result = $state<null | CompileResult>(null);
  let timing = $state<null | number>(null);

  function handleChange(val: string) {
    value = val;
    doBuild();
  }

  async function doBuild() {
    let start = Date.now();
    result = await compile(value);
    timing = Date.now() - start;
  }

  onMount(() => {
    doBuild();
  });
</script>

<div class="h-1/2 relative">
  <input
    type="checkbox"
    bind:checked={fixValue}
    class="absolute bottom-1 right-1"
  />
  <textarea
    class="p2 font-mono size-full block bg-gray-100"
    {value}
    oninput={(e) => handleChange(e.currentTarget.value)}
  ></textarea>
</div>
<div class="font-mono relative p2 pt-4 w-full min-h-1/2 bg-gray-300">
  {#if result}
    {#if timing}
      <div
        class="italics absolute bg-gray-400 right-0 top-0 px1 py0.5 rounded-bl-1 mb4 text-white"
      >
        {timing}ms
      </div>
    {/if}
    {#if result.type === "success"}
      <div class="space-y-4">
        {#each Object.entries(result.files) as [name, content]}
          <div>
            <div>{name}</div>
            <div class="bg-gray-600 p2 rounded-1 text-white">
              {content}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="whitespace-pre">
        {JSON.stringify(result, null, 2)}
      </div>
    {/if}
  {/if}
</div>
