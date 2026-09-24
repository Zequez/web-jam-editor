<script lang="ts">
  const { progress }: { progress: number } = $props();
</script>

<span
  class={[
    "inline-block h-3.5 b rounded-1 bg-white/10 w-10 mr2 relative overflow-hidden text-2.5 font-mono font-bold",
    {
      "b-white": progress > 0,
      "b-white/25": progress === 0,
    },
  ]}
>
  <span
    class={[
      "transform-origin-left absolute inset-0",
      {
        "bg-green-400/50": progress < 1,
        "bg-green-400": progress >= 1,
      },
    ]}
    style={`transform: scaleX(${progress})`}
  ></span>
  {#if progress >= 1}
    <span class="absolute inset-0 flex-cc text-shadow-[0_1px_0_#0008]"
      >BUILT</span
    >
  {/if}
</span>
