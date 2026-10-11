<script lang="ts">
  import { onMount } from "svelte";
  let { isOpen }: { isOpen: boolean } = $props();
  import { html as noteHtml } from "./note.md";
  import { ToneGenerator } from "./ToneGenerator";

  const pianoTones: { [key: string]: number } = {
    C4: 261.63,
    "C#4": 277.18,
    D4: 293.66,
    "D#4": 311.13,
    E4: 329.63,
    F4: 349.23,
    "F#4": 369.99,
    G4: 392.0,
    "G#4": 415.3,
    A4: 440.0,
    "A#4": 466.16,
    B4: 493.88,
  };
  let TONE_MODE_LS = "tone-mode";
  let toneMode = $state<"disabled" | "piano" | "buttons">(
    (localStorage.getItem(TONE_MODE_LS) as "buttons") || "buttons",
  );
  function nextToneMode() {
    toneMode =
      toneMode === "disabled"
        ? "piano"
        : toneMode === "piano"
          ? "buttons"
          : "disabled";
  }

  $effect(() => {
    localStorage.setItem(TONE_MODE_LS, toneMode);
  });

  let toneGen = new ToneGenerator();

  // onMount(() => {

  // })
</script>

{#snippet Btn(text: string, link: string, colorClass: string, tone: number)}
  <a
    href={link}
    target="_blank"
    onmouseenter={() =>
      toneMode !== "disabled" ? toneGen.beep(tone, 100) : null}
    class={`
        flex-cc mx-auto justify-self-right
        p3 w-60 max-w-full
        font-mono font-bold text-4/6 uppercase text-center
        text-white text-shadow-[0_1px_0_#0007]
        ${colorClass} bg-linear-to-b from-white/20
        shadow-[0_1px_0px_1px]
        cursor-pointer
        shadow-opacity-80
        transition-all
        active:(bg-linear-to-t  shadow-[inset_0_0_4px_2px_#0001] text-gray-100 text-shadow-[0_-1px_0_#0005])
        hover:brightness-107
        hover:transition-none
        rounded-1 b b-black/10
        group
        `}><span class="relative group-active:top-1.5px">{text}</span></a
  >
{/snippet}

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
        px3 pb6 pt-8
        bg-gray-50
        text-black/70
        b-t-0 b-purple-700/70 b-b-purple-800/70
        shadow-[inset_0_0_30px_0] shadow-green-500/5
        b-1 b-b-2  rounded-b-1
        `,
    ]}
  >
    <div class="flex-cc">
      <div class="grid cols-2 gap-3 shrink relative">
        <button
          onclick={nextToneMode}
          aria-label="Music Toggling"
          class="
            w-8 h-8 z-20 hover:brightness-107 cursor-pointer
            bg-linear-to-b from-white/20 shadow-[0_1px_0px_0.3px]
            shadow-purple-700 bg-purple-500 rounded-full
            b-1.5 b-purple-600
            absolute top-1/2 left-1/2 -translate-1/2
            text-white text-4.5 flex-cc
            group
            active:(bg-linear-to-t shadow-[inset_0_0_4px_2px_#0001])"
        >
          <span class="relative group-active:top-1px">
            {#if toneMode === "disabled"}
              <div class="i-fa-volume-xmark"></div>
            {:else if toneMode === "piano"}
              <div class="i-fa-music"></div>
            {:else if toneMode === "buttons"}
              <div class="i-fa-volume"></div>
            {/if}
          </span>
        </button>
        {@render Btn(
          "Web Jam Source Code",
          "https://github.com/zequez/web-jam-editor",
          "bg-green-400 shadow-green-700",
          220,
        )}
        {@render Btn(
          "Web Jam Changelog",
          "https://github.com/zequez/web-jam-editor/blob/main/CHANGELOG.md",
          "bg-red-400 shadow-red-700",
          440,
        )}
        {@render Btn(
          "Web Jam Architecture",
          "/architecture",
          "bg-blue-400 shadow-blue-700",
          880,
        )}
        {@render Btn(
          "Web Jam Roadmap",
          "/roadmap",
          "bg-yellow-400 shadow-yellow-700",
          1760,
        )}
      </div>
    </div>
    {#if toneMode == "piano"}
      <div class="mt-6">
        <div class="flex-cc space-x-1.5">
          {#each Array(12) as _, i}
            {@const hue = i * 30}
            {@const tone = pianoTones[Object.keys(pianoTones)[i]!]!}
            <div
              role="region"
              onmouseenter={() => toneGen.beep(tone, 100, 0.2)}
              ontouchstart={() => toneGen.beep(tone, 100, 0.2)}
              class="w-6 h-8 bg-[var(--normal-bg)] hover:bg-[var(--hover-bg)] bg-linear-to-b border-1 border-black/10 from-white/20 rounded-1 shadow-[0_2px_0_1px] transition-colors hover:transition-none"
              style={`--normal-bg: oklch(75% 0.3 ${hue}); --hover-bg: oklch(95% 0.3 ${hue}); --un-shadow-color: oklch(35% 0.4 ${hue});`}
            ></div>
          {/each}
        </div>
        <div class="flex-cc space-x-1.5 mt1">
          {#each Array(12) as _, i}
            {@const hue = i * 30}
            {@const tone = pianoTones[Object.keys(pianoTones)[i]!]!}
            <div
              role="region"
              onpointerenter={() => toneGen.beep(tone * 2, 100, 0.4)}
              ontouchstart={() => toneGen.beep(tone * 2, 100, 0.4)}
              class="w-6 h-8 bg-[var(--normal-bg)] hover:bg-[var(--hover-bg)] bg-linear-to-b border-1 border-black/10 from-white/20 rounded-1 shadow-[0_2px_0_1px] transition-colors hover:transition-none"
              style={`--normal-bg: oklch(55% 0.3 ${hue}); --hover-bg: oklch(75% 0.3 ${hue}); --un-shadow-color: oklch(35% 0.4 ${hue});`}
            ></div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="markdown">
      {@html noteHtml}
    </div>
    <div>
      {@render Btn(
        "Telegram Web Jam Hub",
        "https://t.me/+a3xJw_ekopU0NTcx",
        "bg-sky-500 shadow-sky-800",
        3520,
      )}
    </div>
  </div>
</div>
