<script lang="ts">
  import { getPreviewUrlStore } from "@/stores/previewUrlStore.svelte";
  import ImagesBox from "./ImagesBox.svelte";
  import GlobalFilesDrop from "./GlobalFilesDrop.svelte";

  type Tabs = "Syntax" | "Images" | "Publishing" | "Icons" | "none";
  let currentTab = $state<Tabs>("Images");
  let bodyColor = $state("bg-amber-200");

  const { url: previewUrl } = getPreviewUrlStore();

  function setTab(tab: Tabs, newBodyColor: string) {
    if (tab === currentTab) {
      currentTab = "none";
    } else {
      currentTab = tab;
    }
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

  function handleDroppedImages(files: FileList) {
    onFilesAdded(Array.from(files));
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
  {@const isNone = currentTab === "none"}
  <button
    class={[
      `w-30 h-full flex-cc cursor-pointer relative uppercase b-1.5 b-black/15`,
      {
        [`${colorActive} opacity-100 text-black/70`]: isActive,
        [`${colorInactive} saturate-40 hover:saturate-100 text-black/50 hover:text-black/70`]:
          !isActive,
        ["rounded-1"]: isNone,
        ["shadow-[inset_0_-1pxpx_0px_#0007] rounded-t-1 b-b-0 z-11"]: !isNone,
      },
    ]}
    onclick={() => setTab(name, bodyColor)}
  >
    <div class="{icon} mr-2 scale-150"></div>
    {name}
  </button>
{/snippet}

<GlobalFilesDrop onFilesDrop={handleDroppedImages} />

<div class="size-full flex-cc flex-col">
  <div
    class="
      w-full h-6 shrink-0 flex-cs pl-2
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
    {@render Tab(
      "Icons",
      "i-fa-icons",
      "bg-rose-100",
      "bg-rose-50 hover:bg-rose-100",
      "bg-rose-200",
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
  {#if currentTab !== "none"}
    <div
      class="{bodyColor} shadow-[0_1px_0_#0007,0_0_2.5px_#0005] z-10 relative size-full rounded-1 p1.5 max-h-40 overflow-auto"
    >
      <div class="absolute left-2px right-4px top-1px h-1px bg-white/40"></div>
      {#if currentTab === "Images"}
        <ImagesBox {imagesList} {onDeleteImage} />
      {:else if currentTab === "Icons"}
        <div class="p2">
          <div class=" tracking-wider">
            <div class="font-bold">
              <a
                class="text-blue underline"
                href="https://fontawesome.com/search?ic=free-collection"
                target="_blank">Font Awesome 7</a
              >
            </div>
            <div>
              Solid: <span class="font-mono bg-black/10"
                >icon-fa-&lt;name&gt;</span
              >
            </div>
            <div>
              Regular: <span class="font-mono bg-black/10"
                >icon-far-&lt;name&gt;</span
              >
            </div>
            <div>
              Brands: <span class="font-mono bg-black/10"
                >icon-fab-&lt;name&gt;</span
              >
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
