<script lang="ts">
  import { onMount } from "svelte";

  let { initialValue } = $props<{ initialValue: string }>();
  let scale = $state(1);
  let containerWidth = $state(0);
  let containerHeight = $state(0);
  let width = $derived(containerWidth / scale);
  let height = $derived(containerHeight / scale);
  let address = $state(
    //"https://www.openstreetmap.org/export/embed.html?bbox=-57.57,-38.02,-57.54,-37.99&layer=mapnik",
    initialValue,
  );
  let src = $state(address);
  let container: HTMLElement = $state(null!);

  onMount(() => {
    const resizeObserver = new ResizeObserver(([entry]) => {
      containerWidth = entry!.contentRect.width;
      containerHeight = entry!.contentRect.height;
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  });

  function go() {
    src = address;
  }
</script>

<div class="h-full w-full flex flex-col bg-gray-300">
  <div class="flex p1 overflow-hidden">
    <input
      onkeyup={(e) => e.key === "Enter" && go()}
      bind:value={address}
      class="bg-white px2 rounded-1 shrink-0 mr-1"
    />
    <button
      class="bg-gray-400 text-white rounded-1 font-semibold px2 cursor-pointer"
      onclick={() => go()}>GO</button
    >
    <div class="grow"></div>
    <div class="flex">
      <div class="mr2">{width}&times;{height}</div>

      <div class="mr-2">{Math.round(scale * 100)}%</div>
      <input type="range" bind:value={scale} min="0.1" max="2" step="0.1" />
    </div>
  </div>
  <div class="w-full h-full flex-grow relative" bind:this={container}>
    <iframe
      title="Preview"
      class="bg-white absolute"
      {src}
      style={`width: ${width}px; height: ${height}px; left: 0px; top: 0px; transform: scale(${scale}); transform-origin: 0 0;`}
    >
    </iframe>
  </div>
</div>
