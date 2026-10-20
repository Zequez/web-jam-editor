<script lang="ts">
  import { type CompileError } from "@/lib/pure-pug-compiler";
  const { buildError }: { buildError: CompileError } = $props();
</script>

<div
  class={[
    "absolute overflow-auto inset-04 bg-black/80 b b-4 b-red-500 rounded-2 text-white font-mono whitespace-pre p6",
    // {
    //   "inset-4": !previewIsHidden,
    //   "top-0 right-0 w-1/4 h-full z-100": previewIsHidden,
    // },
  ]}
>
  <div class="text-7">
    Error
    {#if buildError.type === "pug-error"}
      <span>on Pug code</span>
    {/if}
  </div>

  {#if buildError.error.code}
    <div>{buildError.error.code}</div>
  {/if}

  {#if buildError.error.message}
    {#if buildError.error.stack}
      <div class="text-0.7em text-red-400">
        {buildError.error.stack}
      </div>
    {:else}
      <div>{buildError.error.message}</div>
    {/if}

    <!-- {#if currentBuildError.error.stack}
                <div class="text-0.7em">{currentBuildError.error.stack}</div>
              {/if} -->
  {:else if buildError.error.msg}
    <div>{buildError.error.msg}</div>
  {/if}

  <!-- {JSON.stringify(currentBuildError, null, 2)} -->
</div>
