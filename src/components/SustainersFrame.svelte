<script lang="ts">
  let { isOpen }: { isOpen: boolean } = $props();
</script>

<div
  class={[
    "absolute top-0 z-11 left-1/2 -translate-x-1/2 duration-1000 transition-transform",
    {
      [`-translate-y-100%
        transition-delay-500
        peer-hover:(translate-y-0 transition-delay-0)
        hover:(translate-y-0 transition-delay-0)`]: !isOpen,
      "translate-y-0": isOpen,
    },
  ]}
>
  <div
    class={[
      `w-200
        overflow-auto
        px3 pb3 pt-8
        bg-gray-50
        text-black/70
        b-t-0 b-green-700/70 b-b-green-800/70
        shadow-[inset_0_0_30px_0] shadow-green-500/5`,
      {
        "b-2 b-b-4  rounded-b-1.5": isOpen,
        "b-1 b-b-2  rounded-b-1": !isOpen,
      },
    ]}
  >
    <div class="text-4/6 mb-3 text-center">
      <div>Become a sustainer</div>
      <div>
        Invest in the growth, development and long-term sustainability of this
        system.
      </div>
    </div>
    <div class="flex">
      <div
        class="text-shadow-[0_1px_0_#0007] uppercase text-white font-mono font-semibold"
      >
        <div
          class="w-full px-3 font-semibold text-6/12 flex-cc rounded-t-1 bg-green-500 b b-black/10 b-b-0"
        >
          Sustainer's contribution
        </div>
        <div class="flex">
          <div
            class="w-60% rounded-b-1 b b-black/10 b-t-0 bg-green-400 px-1.5 mb3 pb3 text-center flex flex-col"
          >
            <div class="text-4/12">Project Steward</div>
            <a
              href="https://ezequielschwartzman.org"
              class="hover:bg-white/40 rounded-2 py1.5"
            >
              <div class="flex-cc w-full">
                <img
                  class="block rounded-full bg-gray-400 h-24 w-24 b-3 b-green-600"
                  src="/steward.webp"
                  alt="Steward face photography"
                />
              </div>
              <div>Ezequiel Adrián Schwartzman</div>
            </a>
          </div>
          <div class="flex-grow ml-3">
            <div
              class="bg-green-600 h-full w-full b-x b-black/10 flex-cc text-6 relative"
            >
              <div class="i-fa-droplet scale-200"></div>
              <!-- <div
                  class="bg-green-200 absolute rounded-2 inset-3 opacity-0 hover:opacity-100"
                >
                  Money flows upstream
                </div> -->
            </div>
          </div>
        </div>
        <div
          class="w-100% rounded-1 -mt-1px rounded-tr-0 bg-green-400 text-3/6 pb3 b b-black/10"
        >
          <div class="text-center px-1.5">
            <div class="text-4/12">The indie commons</div>
            <div class="mb-3">
              Projects and their stewards<br />whose work makes this system
              possible.
            </div>
            <div>
              {#snippet ProjectLink(name: string, src: string)}
                <a
                  href={src}
                  target="_blank"
                  class="hover:bg-white/40 p.5 rounded-1">{name}</a
                >
              {/snippet}
              {@render ProjectLink("Vite", "https://vitejs.dev/")}
              {@render ProjectLink("Svelte", "https://svelte.dev/")}
              {@render ProjectLink("UnoCSS", "https://unocss.dev/")}
              <br />
              {@render ProjectLink("Pug", "https://pugjs.org/")}
              {@render ProjectLink("CodeMirror", "https://codemirror.net/")}
              {@render ProjectLink("ZenFS", "https://zenfs.dev/")}
            </div>
          </div>
        </div>
      </div>
      <div class="grow flex-shrink-0 flex-cc flex-col text-center text-4/6">
        <div>
          Become the first backer
          <br />
          Your name or project could appear here.
        </div>
        <a
          href="https://forms.gle/y6BLpC1Wz1QHopUL8"
          target="_blank"
          class="mt3 cursor-pointer b b-black/10 hover:scale-105 bg-yellow-400 hover:bg-yellow-300 text-shadow-[0_1px_0_#0007] text-white uppercase font-semibold font-mono text-4/6 px3 py-1 rounded-full transition-all duration-100"
        >
          Commit
        </a>
      </div>
    </div>
  </div>
</div>
