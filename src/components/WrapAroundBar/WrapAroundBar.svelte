<script lang="ts">
  import EdgeButtons from "./EdgeButtons.svelte";
</script>

<div class="h-screen w-full bg-violet-200 p1.5 pt-7.5 overflow-auto relative">
  <div
    class="absolute top-0 left-0 w-full bg-violet-800 h-6 flex text-white text-3/6"
  >
    <slot name="menu"></slot>
    <div class="flex-grow"></div>
    <a
      href="http://github.com/zequez/web-jam-editor"
      target="_blank"
      class="h-full flex-cc whitespace-nowrap hover:bg-white/20 cursor-pointer px2"
    >
      <span class="i-fa-brands-github h-full w-5 mr1"></span>
      <span>Web Jam Editor</span>
      <span class="i-fa-up-right-from-square h-full w-3 ml1"></span>
    </a>

    <div class="absolute top-0 left-1/2 w-40 h-5.2 -translate-x-20 z-1000">
      <EdgeButtons />
    </div>
  </div>
  <slot />
</div>
