<script lang="ts">
  import { onMount } from "svelte";

  let { onClose } = $props<{ onClose: () => void }>();

  onMount(() => {
    function esc(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
    };
  });
</script>

<div
  aria-label="publishing note"
  class="fixed inset-0 p6 md:pt-24 overflow-auto bg-black/10 z-800"
>
  <button
    class="text-transparent fixed inset-0 bg-black/10 z-10"
    onclick={onClose}>Close</button
  >
  <div
    class="block space-y-3 w-100 mx-auto bg-white rounded-2 z-800 shadow-lg text-black p6 z-11 relative"
  >
    <h2 class="text-6/12">Note on publishing</h2>
    <p>
      <em>Soverign publishing</em> of a website is a non-trivial matter and a valuable
      skill for an edgeworker.
    </p>

    <ul class="pl6 list-disc">
      <li>Choose a domain name</li>
      <li>Choose a domain name registrar provider</li>
      <li>Choose a hosting provider</li>
      <li>Choose the website you will publish</li>
      <li>Learn how to connect all these</li>
    </ul>

    <p>
      No one can do this for you; more interestingly, no one can stop you from
      doing it.
    </p>

    <p>
      And this can all be done for free and effortlessly <em
        >once you know what you are doing</em
      >.
    </p>

    <p class="bg-yellow-100">
      Schedule a call with me and I'll share with you what I know.
    </p>

    <p>For one hour together, paid at your convenience.</p>

    <p class="font-bold">4-tier pricing:</p>

    {#snippet Tier(colorClass: string, color: string)}
      <span
        class={[
          colorClass,
          "text-white font-semibold uppercase rounded-1 px-1 py0.5",
        ]}
      >
        {color}
      </span>
    {/snippet}
    <ul>
      <li>
        {@render Tier("bg-red-500", "RED")}
        US$ 30 / Nortern Europe and US
      </li>
      <li>
        {@render Tier("bg-blue-500", "BLUE")}
        US$ 20 / Southern and Eastern Europe
      </li>
      <li>
        {@render Tier("bg-yellow-500", "YELLOW")}
        US$ 10 / Latin America and Global South
      </li>
      <li>
        {@render Tier("bg-green-500", "GREEN")}
        US$ 25 / Nomadics
      </li>
    </ul>

    <a
      href="https://calendar.app.google/pVjyv1UzAENrHSgMA"
      target="_blank"
      class="block my-12 bg-gradient-to-br from-white/10 shadow-[0_1.5px_0] shadow-amber-600 bg-amber-400 font-bold text-white text-shadow-[0_1px_0_#0004] hover:bg-amber-300 rounded-full p3 text-center"
    >
      Schedule a 1hr call with me
    </a>

    <p>
      - <a
        class="text-blue-500 underline hover:underline-2"
        target="_blank"
        href="https://ezequielschwartzman.org">Ezequiel</a
      >
    </p>

    <p class="italic">
      Or ask any synthetic intelligece for advice and discover it at your own
      pace.
    </p>
  </div>
</div>
