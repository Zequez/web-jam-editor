<script lang="ts">
  // import { html as syntaxV3Wrapped } from "./syntax-v3-wrapped.md";
  import syntaxV3WrappedMarkdown from "./syntax-v3-wrapped-compressed.md?raw";

  import { html as syntaxV3 } from "./syntax-v3.md";
  import syntaxV3Markdown from "./syntax-v3.md?raw";

  let justCopied = $state(false);

  function handleCopy() {
    navigator.clipboard.writeText(syntaxV3Markdown);
    justCopied = true;
    setTimeout(() => (justCopied = false), 1000);
  }

  let justCopiedWrapped = $state(false);
  function handleCopyWrapped() {
    navigator.clipboard.writeText(syntaxV3WrappedMarkdown);
    justCopiedWrapped = true;
    setTimeout(() => (justCopiedWrapped = false), 1000);
  }
</script>

<div class="markdown px2 relative">
  <div class="flex gap-1 absolute top-0 right-0">
    <button
      onclick={handleCopy}
      class="
    relative bg-gray-100 shadow-sm
    bg-linear-to-b from-white/20 cursor-pointer
    uppercase font-mono font-bold rounded-1 px3 py1.5
    active:(shadow-none translate-y-1px) group b b-black/20
  "
    >
      Copy Raw
      {#if justCopied}
        <div class="absolute inset-1 bg-white rounded-1 text-3 flex-cc">
          Copied
        </div>
      {/if}
    </button>
    <button
      onclick={handleCopyWrapped}
      class="
    relative bg-gray-100 shadow-sm
    bg-linear-to-b from-white/20 cursor-pointer
    uppercase font-mono font-bold rounded-1 px3 py1.5
    active:(shadow-none translate-y-1px) group b b-black/20
  "
    >
      Copy AI Context
      {#if justCopiedWrapped}
        <div class="absolute inset-1 bg-white rounded-1 text-3 flex-cc">
          Copied
        </div>
      {/if}
    </button>
  </div>
  {@html syntaxV3}
</div>
