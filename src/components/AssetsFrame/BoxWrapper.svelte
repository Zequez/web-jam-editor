<script lang="ts">
  const { color, children }: { color: string; children: any } = $props();
</script>

<div
  class="{color} shadow-[0_1px_0_#0007,0_0_2.5px_#0005] z-10 relative rounded-1 p1.5 w-full grow max-h-100 overflow-auto"
>
  <div class="absolute left-2px right-4px top-1px h-1px bg-white/40"></div>
  {@render children()}
</div>
