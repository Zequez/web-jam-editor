<script lang="ts">
  import StarrySky from "./StarrySky.svelte";
  import Subtitle from "./Subtitle.svelte";
</script>

<div class="mb12 text-center font-mono">
  <div
    class="max-h-62 max-w-full aspect-ratio-[162/100] bg-gray-950 flex-cc rounded-md relative b-8 b-white/20 mx-auto"
  >
    <img src="/gaia.webp" alt="Earth from space" class="w-1/2 z-11" />
    <StarrySky class="z-10" density={150} />
  </div>
  <h1 class="text-12 sm:text-16 md:text-24 font-serif">Web Jam</h1>
  <p><Subtitle /></p>
</div>
