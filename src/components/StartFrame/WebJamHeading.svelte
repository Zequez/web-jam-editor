<script lang="ts">
  import StarrySky from "./StarrySky.svelte";
  import Subtitle from "./Subtitle.svelte";
</script>

<div>
  <div class="mb12 font-mono flex flex-col md:flex-row">
    <div
      class="
      group
      max-h-42 max-w-full aspect-ratio-square
      overflow-hidden bg-gray-950 flex-cc rounded-12
      relative mx-auto b-4 b-gray-50 shadow-[0_0_2px_#0006,0_1px_0_#aaa]"
    >
      <img
        src="./gaia.webp"
        alt="Earth from space"
        class="w-11/12 z-11 brightness-130 saturate-110 group-hover:(scale-110 brightness-150 saturate-120) transition-all duration-2000"
      />
      <StarrySky
        class="z-10 transition-all duration-2000 group-hover:scale-105"
        density={80}
        upscale={2}
      />
    </div>
    <div class="ml6 text-center md:text-left">
      <h1 class="text-12 sm:text-16 md:text-20 font-serif">Web Jam</h1>
      <div class="text-4 md:text-5 text-black/77 italic font-mono">
        <Subtitle />
      </div>
    </div>
  </div>
</div>
