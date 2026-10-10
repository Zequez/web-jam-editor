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
    <h2 class="text-6/12">A note on publishing</h2>
    <p class="font-bold">Your website. Your domain. Your sovereignty.</p>
    <p>
      Publishing a website under your own domain is a valuable skill for any
      <a
        class="text-blue underline"
        href="https://edgeworker.startover.world/"
        target="_blank">Edgeworker</a
      >. It's a step toward owning your presence on the Internet rather than
      depending entirely on platforms that someone else controls.
    </p>
    <p>There are a few things to learn along the way:</p>

    <ul class="pl6 list-disc">
      <li>Choose a domain name that feels right for you.</li>
      <li>Find a domain registrar to register it.</li>
      <li>Choose where to host your website.</li>
      <li>Prepare the website you want to publish.</li>
      <li>Learn how to connect everything together.</li>
    </ul>

    <p>
      These pieces might seem intimidating at first, but they're not beyond your
      reach. Once you understand how they fit together, publishing a website can
      be surprisingly simple — and can cost you nothing beyond the domain
      itself, if you choose your tools wisely.
    </p>

    <p class="font-bold">
      No one can do this for you; more interestingly, none can stop you from
      learning to do it.
    </p>

    <p>
      You can explore it on your own, ask a synthetic intelligence to guide you,
      or learn alongside another human.
    </p>

    <h3 class="text-5/12">Let's figure it out together</h3>

    <p>
      If you'd like a hand, schedule a one-hour call with me. Bring your
      questions, your website, or simply your curiosity. I'll share what I know
      and help you find a path that works for you.
    </p>

    <p class="font-bold">One hour together, paid at your convenience.</p>

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
      Schedule a one-hour call
    </a>

    <p>
      - <a
        class="text-blue-500 underline hover:underline-2"
        target="_blank"
        href="https://ezequielschwartzman.org">Ezequiel</a
      >
    </p>
  </div>
</div>
