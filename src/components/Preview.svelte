<script lang="ts">
  import { onMount } from "svelte";

  let { initialValue, previewPathPart } = $props<{
    initialValue: string;
    previewPathPart: string;
  }>();
  let scale = $state(1);
  let containerWidth = $state(0);
  let containerHeight = $state(0);
  let width = $derived(containerWidth / scale);
  let height = $derived(containerHeight / scale);
  let address = $state(initialValue);
  let src = $state(address);
  let container: HTMLElement = $state(null!);
  let iframe: HTMLIFrameElement = $state(null!);

  //localhost:5173/preview__/dadb69d0-d47e-46c9-9168-710335910188/

  http: onMount(() => {
    const resizeObserver = new ResizeObserver(([entry]) => {
      containerWidth = entry!.contentRect.width;
      containerHeight = entry!.contentRect.height;
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  });

  export function go(newSrc: string) {
    const isChanging = newSrc !== src;
    src = newSrc;
    address = newSrc;
    if (isChanging) {
      refresh();
    }
  }

  function handleGo() {
    if (src === address) {
      refresh();
    } else {
      src = address;
    }
  }

  export function refresh() {
    iframe.contentWindow?.location.reload();
  }

  let derivedSrc = $derived(src.startsWith("/") ? previewPathPart + src : src);

  $effect(() => {
    console.log(derivedSrc);
  });
</script>

<div class="h-full w-full flex flex-col bg-gray-200 rounded-1 b b-black/10">
  <div class="flex p1.5 overflow-hidden shrink-0">
    <input
      onkeyup={(e) => e.key === "Enter" && handleGo()}
      value={address}
      oninput={(e) => (address = e.currentTarget.value)}
      class="bg-white b-2 b-black/30 focus:b-violet-500 outline-0 px2 rounded-1 shrink-0 mr-1 block flex-grow"
    />
    <button
      class="bg-blue-400 hover:bg-blue-500 mr-1 text-white rounded-1 font-semibold px2 cursor-pointer"
      onclick={() => handleGo()}>GO</button
    >
    <a
      href={src}
      class="w-7 shrink-0 bg-blue-400 hover:bg-blue-500 px-2 text-white rounded-1 mr2"
      target="_blank"
      title="Open in external tab"
    >
      <span class="i-fa-up-right-from-square block size-full"></span>
    </a>
    <div class="flex text-3/6">
      <div class="mr2 font-mono">
        {Math.round(width)}px
      </div>

      <button
        class="w-6 flex-cc hover:bg-white/40 cursor-pointer rounded-1"
        aria-label="Zoom out"
        onclick={() => (scale = Math.max(0.1, scale - 0.1))}
        ><span class="i-fa-minus w-full h-full block"></span></button
      >
      <div class="mx-2 font-mono w-6 flex-cc">
        {Math.round(scale * 100)}%
      </div>
      <button
        class="w-6 flex-cc hover:bg-white/40 cursor-pointer rounded-1"
        aria-label="Zoom in"
        onclick={() => (scale += 0.1)}
        ><span class="i-fa-plus size-full block"></span></button
      >
    </div>
  </div>
  <div
    title="Service-workers are complex"
    class="shrink-0 px-3 bg-amber-200 text-center text-3/6 flex-cc text-black b-b b-black/10"
  >
    <span class="i-fa-warning h-6 w-6 inline-block scale-80"></span>
    <span
      >Bug alert: If the preview does not refresh just reload the whole page
    </span>
  </div>
  <div class="w-full h-full flex-grow relative" bind:this={container}>
    <iframe
      bind:this={iframe}
      title="Preview"
      class="bg-white absolute"
      src={derivedSrc}
      style={`width: ${width}px; height: ${height}px; left: 0px; top: 0px; transform: scale(${scale}); transform-origin: 0 0;`}
    >
    </iframe>
  </div>
</div>
