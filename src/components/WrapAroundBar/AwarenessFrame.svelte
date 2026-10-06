<script lang="ts">
  let { isOpen }: { isOpen: boolean } = $props();
  import {html as noteHtml} from './note.md'
</script>

<div
  class={[
    "absolute top-0 z-11 left-1/2 -translate-x-1/2 duration-1000 transition-transform",
    {
      [`-translate-y-100%
        transition-delay-0
        peer-hover/purple:(translate-y-0 transition-delay-0)
        ho:(translate-y-0 transition-delay-0)`]: !isOpen,
      "translate-y-0": isOpen,
    },
  ]}
>
  <div
    class={[
      `w-screen md:w-screen-md
      max-h-screen
        overflow-auto
        px3 pb3 pt-8
        bg-gray-50
        text-black/70
        b-t-0 b-purple-700/70 b-b-purple-800/70
        shadow-[inset_0_0_30px_0] shadow-green-500/5
        b-1 b-b-2  rounded-b-1
        `,
    ]}
  >
    <div>
      <a
        href="/roadmap"
        target="_blank"
        class="
        block mx-auto w-100
        my6 p3
        font-mono font-bold text-4/6 uppercase text-center
        text-white text-shadow-[0_1px_0_#0007]
        bg-yellow-400 hover:bg-yellow-300 bg-linear-to-br from-white/10
        rounded-1 b b-black/10
        ">Project Roadmap</a
      >
      <div class="markdown">
        {@html noteHtml}
      </div>
    </div>
  </div>
</div>