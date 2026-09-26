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
      `w-100 max-w-screen-md
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
    <!-- prettier-ignore -->
    <div class="whitespace-pre-wrap">
Hello, my name is Ezequiel Adrián Schwartzman. I'm an alive person writing
this. Here is the placeholder space for stuff like blog posts on this project,
which for now there are none; except this one, I guess.

Alright, it seems I'm writing a kind of blog post for the Jam Editor.

Hello everybody, this is all there is to it at the moment. If you are reading this,
this is the last version of this software.

It features the following niceties:

As you enter, you will see a simple interface.
There is a top black bar, and a bottom gray space.
You can't see what's the project for until you
- You can see 4 main areas to the interface.
-

-- Work unfinished, this might change.

--- UP NEXT!

- I should be able to move frames around; at the least I should be able to resize them
- If the frame on the right side (the preview) is sufficiently minimized, it should vanish (the person can see the preview on another tab!)
- The images thumbnails on the images folder should actually work
- Images tab text too dark, lighter, darker background
- Preview UI elements can be greatly aesthetically improved
- Should be able to inspect on the screen the output files
- More tabs for the Assets frames of treasures!
- A great default project pre-loaded!
- Something from the assets frame

-- GOTTA RUN MY LOVER AWAITS!
    </div>
  </div>
</div>
