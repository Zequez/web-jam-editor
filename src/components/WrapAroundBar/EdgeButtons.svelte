<script lang="ts">
  import AwarenessFrame from "./AwarenessFrame.svelte";
  import EdgeButton from "./EdgeButton.svelte";
  import SustainersFrame from "./SustainersFrame.svelte";

  let tab = $state<"sustainers" | "awareness" | "none">("none");

  function selectTab(nextTab: "sustainers" | "awareness") {
    tab = tab === nextTab ? "none" : nextTab;
  }

  function handleEscKey(ev: KeyboardEvent) {
    if (tab !== "none") {
      if (ev.key === "Escape") {
        tab = "none";
      }
    }
  }
</script>

<svelte:window on:keydown={tab === "none" ? undefined : handleEscKey} />

{#if tab !== "none"}
  <button
    aria-label="Close"
    class="fixed w-screen h-screen top-0 left-1/2 -translate-x-1/2 bg-black/0 z-10"
    onclick={() => (tab = "none")}
  ></button>
{/if}

<div class="h-full relative z-1000 flex-cc gap-0.8">
  <EdgeButton
    label="Awareness"
    closedIcon="i-fa-eye-slash"
    openIcon="i-fa-eye"
    color="purple"
    isOpen={tab === "awareness"}
    onclick={() => selectTab("awareness")}
  />
  <EdgeButton
    label="Sustainers"
    closedIcon="i-fa-music"
    openIcon="i-fa-heart"
    color="green"
    isOpen={tab === "sustainers"}
    onclick={() => selectTab("sustainers")}
  />

  <!-- {#if tab === "awareness"} -->
  <div></div>
  <!-- {/if} -->
</div>
<div></div>

<SustainersFrame isOpen={tab === "sustainers"} />
<AwarenessFrame isOpen={tab === "awareness"} />
