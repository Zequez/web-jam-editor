<script lang="ts">
  import { onMount } from "svelte";

  let { initialValue } = $props<{ initialValue: string }>();
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
    src = address;
  }

  export function refresh() {
    iframe.contentWindow?.location.reload();
  }
</script>

<div class="h-full w-full flex flex-col bg-gray-300">
  <div class="flex p1 overflow-hidden shrink-0">
    <input
      onkeyup={(e) => e.key === "Enter" && handleGo()}
      bind:value={address}
      class="bg-white px2 rounded-1 shrink-0 mr-1"
    />
    <button
      class="bg-gray-400 text-white rounded-1 font-semibold px2 cursor-pointer"
      onclick={() => handleGo()}>GO</button
    >
    <div class="grow"></div>
    <div class="flex">
      <div class="mr2">{Math.round(width)}&times;{Math.round(height)}</div>

      <div class="mr-2">{Math.round(scale * 100)}%</div>
      <input type="range" bind:value={scale} min="0.1" max="2" step="0.1" />
    </div>
  </div>
  <div
    title="Service-workers are complex"
    class="shrink-0 h-6 bg-amber-200 text-center text-3/6 flex-cc text-black b-b b-black/10"
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
      {src}
      style={`width: ${width}px; height: ${height}px; left: 0px; top: 0px; transform: scale(${scale}); transform-origin: 0 0;`}
    >
    </iframe>
  </div>
</div>
