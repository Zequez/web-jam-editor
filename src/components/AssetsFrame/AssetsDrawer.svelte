<script lang="ts">
  type Tabs = "Syntax" | "Images" | "Publishing";
  let currentTab = $state<Tabs>("Images");
  let bodyColor = $state("bg-amber-200");

  function setTab(tab: Tabs, newBodyColor: string) {
    currentTab = tab;
    bodyColor = newBodyColor;
  }

  const {
    onFilesAdded,
    imagesList,
    onDeleteImage,
  }: {
    onFilesAdded: (files: File[]) => void;
    imagesList: string[];
    onDeleteImage: (name: string) => void;
  } = $props();

  function openFilePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = () => {
      if (input.files) {
        onFilesAdded(Array.from(input.files));
      }
    };
    input.click();
  }
</script>

{#snippet Tab(
  name: Tabs,
  icon: string,
  colorActive: string,
  colorInactive: string,
  bodyColor: string,
)}
  {@const isActive = name === currentTab}
  <button
    class={[
      `w-30 h-full flex-cc rounded-t-1 cursor-pointer uppercase`,
      {
        [`${colorActive} opacity-100 text-black/80`]: isActive,
        [`${colorInactive} opacity-60 hover:opacity-100 text-black/50 hover:text-black/80 shadow-[inset_0_-3px_2px_#0001]`]:
          !isActive,
      },
    ]}
    onclick={() => setTab(name, bodyColor)}
  >
    <div class="{icon} mr-2 scale-150"></div>
    {name}
  </button>
{/snippet}

<div class="size-full bg-gray-300 flex-cc p1.5 flex-col">
  <div
    class="
      w-full h-6 shrink-0 flex-cs
      gap-1
      text-3/6 tracking-1.5px uppercase font-mono font-semibold"
  >
    <!-- {@render Tab(
      "Syntax",
      "i-fa-code",
      "bg-sky-100",
      "bg-sky-50 hover:bg-sky-100",
      "bg-sky-200",
    )} -->
    {@render Tab(
      "Images",
      "i-fa-images",
      "bg-amber-100",
      "bg-amber-50 hover:bg-amber-100",
      "bg-amber-200",
    )}
    <!-- {@render Tab(
      "Publishing",
      "i-fa-person-chalkboard",
      "bg-amber-100",
      "bg-amber-50 hover:bg-amber-100",
      "bg-amber-200",
    )} -->

    <div class="flex-grow"></div>
    <button
      title="Import assets from system"
      class="px1.5 h-5 mb1 flex-cc
      bg-white/80 hover:bg-white/100 shadow-[0_1px_0_#0006]
      rounded-1 cursor-pointer"
      onclick={openFilePicker}
    >
      <div class="i-fa-folder-open scale-150"></div>
    </button>
    <!-- <button
      title="Import assets from web"
      class="px1.5 h-5 mb1 flex-cc
      bg-white/80 hover:bg-white/100 shadow-[0_1px_0_#0006]
      rounded-1 cursor-pointer"
    >
      <div class="i-fa-clipboard scale-150"></div>
    </button> -->
  </div>
  <div
    class="{bodyColor} shadow-[0_1px_0_#0007] size-full rounded-1 rounded-tl-0 p1.5 max-h-40 overflow-auto"
  >
    {#if currentTab === "Images"}
      <div class="font-mono grid gap-1.5 cols-2">
        {#each imagesList as img}
          <div class="flex-cs">
            <img
              class="w-10 h-10 bg-gray-200 rounded-1 mr1.5"
              src="/__preview/9c808fae-d0c0-4cf2-8f68-609d9d2db12e/images/{img}/sm.webp"
            />
            {img}
            <button onclick={() => onDeleteImage(img)}>[Del]</button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
