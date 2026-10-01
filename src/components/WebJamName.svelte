<script lang="ts">
  import StarrySky from "./StarrySky.svelte";
  import Subtitle from "./Subtitle.svelte";
</script>

<div class="mb12 text-center font-mono max-w-screen-sm">
  <div
    class="h-62 aspect-ratio-[162/100] bg-gray-950 flex-cc rounded-md relative b-8 b-white/20"
  >
    <img src="/gaia.webp" alt="Earth from space" class="w-1/2 z-11" />
    <StarrySky class="z-10" density={150} />
  </div>
  <h1 class="text-24 font-serif">Web Jam</h1>
  <p><Subtitle /></p>
</div>
