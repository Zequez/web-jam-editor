<script lang="ts">
  import { onMount } from 'svelte'

  const props: { class?: any; density?: number; upscale?: number } = $props()

  let canvas: HTMLCanvasElement

  onMount(() => {
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let w: number, h: number
    let stars: {
      x: number
      y: number
      r: number
      hue: number
      twinkle: number
    }[]
    let upscale = props.upscale || 1
    let density = (props.density || 50) / upscale

    function resize() {
      const { width, height } = canvas.getBoundingClientRect()
      w = width
      h = height
      canvas.width = w
      canvas.height = h
      makeStars()
    }
    window.addEventListener('resize', resize)

    function makeStars() {
      const count = Math.floor((w * h) / density) // density-based
      stars = new Array(count).fill(null).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 * (1 / upscale) + 0.2,
        hue:
          Math.random() > 0.05
            ? Math.random() * 60 + 200
            : Math.random() * 40 + 0, // bluish to whitish
        twinkle: Math.random() * Math.PI * 2,
      }))
    }

    function draw() {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, w, h)

      for (const s of stars) {
        const intensity =
          0.5 + 0.5 * Math.sin((s.twinkle += 0.02 + Math.random() * 0.01))
        ctx.beginPath()
        ctx.fillStyle = `hsl(${s.hue}, 100%, ${70 * intensity}%)`
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      // requestAnimationFrame(draw)
    }

    resize()
    draw()
  })
</script>

<canvas
  class={['absolute top-0 left-0 w-full h-full', props.class]}
  bind:this={canvas}
></canvas>
