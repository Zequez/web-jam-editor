<script lang="ts">
  const {
    onclick,
    isLoading,
    justDone,
    doneMsg,
  }: {
    onclick: () => void;
    isLoading: boolean;
    justDone: boolean;
    doneMsg: string;
  } = $props();

  let canvas = $state<HTMLCanvasElement | null>(null);

  $effect(() => {
    if (canvas) {
      loadingStart();
    }
  });

  function loadingStart() {
    const W = 3;
    const H = 3;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 1, 1);

    const tickTime = 500;
    let timeFill = 0;

    // const tickTime2 = 1200;
    // let timeFill2 = 0;

    let pattern: number[][];
    function craftPattern() {
      let newPattern: number[][] = [];
      for (let i = 0; i < W; i++) {
        for (let j = 0; j < H; j++) {
          if (!newPattern[i]) newPattern[i] = [];
          newPattern[i]![j] = Math.floor(Math.random() * 2);
        }
      }
      return newPattern;
    }
    pattern = craftPattern();

    let lastTime: number;
    function animate(time: number) {
      const delta = lastTime === undefined ? 0 : time - lastTime;
      lastTime = time;

      if (!canvas) return;
      if (!ctx) return;

      timeFill += delta;
      // timeFill2 += delta;

      if (timeFill > tickTime) {
        timeFill = 0;
        pattern = craftPattern();
      }

      // if (timeFill2 > tickTime2) {
      //   timeFill2 = 0;
      // }

      // ctx.clearRect(0, 0, W, H);

      // const minOpacity = 0.2;
      // const maxOpacity = 1;
      // const opacity = Math.sin((timeFill2 / tickTime2) * Math.PI);
      // const blackOpacity = minOpacity + (maxOpacity - minOpacity) * opacity;
      const blackOpacity = 1;

      for (let i = 0; i < W; i++) {
        for (let j = 0; j < H; j++) {
          ctx.fillStyle = pattern[i]![j]
            ? "white"
            : "rgba(0,0,0," + blackOpacity + ")";
          ctx.fillRect(i, j, 1, 1);
        }
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }
</script>

<button
  disabled={isLoading}
  class="cursor-pointer enabled:hover:bg-white/20 px-2"
  {onclick}
>
  {#if isLoading}
    <div class="flex-cc">
      Processing
      <canvas
        class="w-4 ml1 h-4 rounded-0.5 b-1.5 b-white bg-white scale [image-rendering:pixelated]"
        bind:this={canvas}
      ></canvas>
    </div>
  {:else if justDone}
    {doneMsg}
  {:else}
    Pack for publishing
  {/if}
</button>
