<script lang="ts">
  let { isOpen }: { isOpen: boolean } = $props();
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
        b-t-0 b-green-700/70 b-b-green-800/70
        shadow-[inset_0_0_30px_0] shadow-green-500/5`,
      {
        "b-2 b-b-4  rounded-b-1.5": isOpen,
        "b-1 b-b-2  rounded-b-1": !isOpen,
      },
    ]}
  >
    <div>
      <h2>
        IF YOU ARE READING THIS YOU ARE USING THE LATEST VERSION OF THE JAM
        EDITOR
      </h2>

      <p>
        The project is genuinely unfinished, and I'm not missing out on
        fantastic feedback so here it is.
      </p>

      <p>
        Use it, touch it, sense it, share it with others. Notice where it breaks
        and share that too.
      </p>

      <p>
        Oh and join the Gaia's Team infinity ring if you make a web jam for
        yourself! It's like holding our hands in a circle but over the Internet.
      </p>

      <p>Together we're building Earth's next culture!</p>
    </div>
    <!-- prettier-ignore -->
    <div class="whitespace-pre-wrap">

--- UP NEXT!

- I should be able to move frames around; at the least I should be able to resize them
- If the frame on the right side (the preview) is sufficiently minimized, it should vanish (the person can see the preview on another tab!)

- Preview UI elements can be greatly aesthetically improved
  - If showing a page from the preview (remember the iframe could be navigated to another website and that should be fine as long as the website allows itself to be iframeable)
- Should be able to inspect on the screen the output files
- More tabs for the Assets frames of treasures!

- Something from the assets frame

# Up Next Priorities

## More Urgent

- A great default project pre-loaded!
  - When the system opens it should load an empty memory-based ZenFS filesystem using
    indexed DB
  - Have a default project in the filesystem of the repo and name it "visibility",
    so you remember that's whatever someone sees when he or she enters the app.
- If you open an empty folder with a folder named "assets" it actually does not work
- Share on social media
- Default page
- If there is a Pug templating error or any error in the app
  it should be reported visually on the public UI

## Might require some close attention and time
- Preview stability; sometimes the reloading just breaks (remember Pug errors aren't being recorded or reported in any way)

## Less Urgent

- Awareness and Sustainers edge buttons should not cause
  both frames to occur at the same time.
- Believing I'm alive for the next 45 minutes
- The images thumbnails on the images folder should actually work
- Introduce Font Awesome support using dynamic web fonts so that text-shadow works with the glyphs
- I should be able to use `font-mono font-semibold text-shadow-[0_1px_0_#000]` rather than `font-mono font-semibold text-shadow="[0_1px_0_#000]"`. Maybe a Pug evolution or a pre-processor? Same thing if then I make a pull request with a `--jam-mode` flag.

## Priority Optimization Towards

What is the irreducible thing this commons exists to make possible?

- A financially remunerated job for the human steward of the project.
- Multiple people sharing the Jam Editor to build their own websites.
- Gaia's Infinity Web Ring; the archan web on the Internet,
  made of humans, and human-stewarded intelligent agents. A kind of big hug
  over the Internet.



## Blog Posts Ideas

- Public vs Private UIs of software

    </div>
  </div>
</div>
