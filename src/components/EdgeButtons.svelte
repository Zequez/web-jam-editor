<script lang="ts">
  import AwarenessFrame from "./AwarenessFrame.svelte";
  import EdgeButton from "./EdgeButton.svelte";
  import SustainersFrame from "./SustainersFrame.svelte";

  let tab = $state<"sustainers" | "awareness" | "none">("none");

  function selectTab(nextTab: "sustainers" | "awareness") {
    tab = tab === nextTab ? "none" : nextTab;
  }
</script>

<div class="pb.8 h-full relative z-1000 flex-cc gap-0.8">
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
  <div class="group"></div>
  <SustainersFrame isOpen={tab === "sustainers"} />
  <AwarenessFrame isOpen={tab === "awareness"} />
  <!-- {#if tab === "awareness"} -->
  <div></div>
  <!-- {/if} -->
</div>
