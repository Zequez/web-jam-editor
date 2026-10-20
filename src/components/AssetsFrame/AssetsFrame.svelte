<script lang="ts">
  import { persistedState } from "svelte-persisted-state";

  import GlobalFilesDrop from "./GlobalFilesDrop.svelte";
  import BoxWrapper from "./BoxWrapper.svelte";

  import ImagesBox from "./tabs/ImagesBox.svelte";
  import SyntaxBox from "./tabs/SyntaxBox.svelte";
  import IconsBox from "./tabs/IconsBox.svelte";
  import DocumentsBox from "./tabs/DocumentsBox.svelte";

  type Tabs =
    | "Syntax"
    | "Images"
    | "Publishing"
    | "Documents"
    | "Icons"
    | "none";

  let config = persistedState<{
    order: Tabs[];
    tab: Tabs;
  }>("1-drawer-tabs", {
    order: ["Images", "Syntax", "Icons", "Documents"],
    tab: "Images",
  });

  function setTab(tab: Tabs) {
    if (tab === config.current.tab) {
      config.current.tab = "none";
    } else {
      config.current.tab = tab;
      const newTabsOrder = config.current.order.filter((t) => t !== tab);
      newTabsOrder.unshift(tab);
      config.current.order = newTabsOrder;
    }
  }

  const {
    onFilesAdded,
    imagesList,
    onDeleteImage,
    onRenameImage,
  }: {
    onFilesAdded: (files: File[]) => void;
    imagesList: string[];
    onDeleteImage: (name: string) => void;
    onRenameImage: (imgFrom: string, imgTo: string) => void;
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
)}
  {@const isActive = name === config.current.tab}
  {@const isNone = config.current.tab === "none"}
  {@const order = config.current.order.indexOf(name)}
  <button
    style={`order: ${order}; `}
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
    onclick={() => setTab(name)}
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
    <div class="flex gap-1">
      {@render Tab(
        "Syntax",
        "i-fa-code",
        "bg-sky-100",
        "bg-sky-50 hover:bg-sky-100",
      )}
      {@render Tab(
        "Images",
        "i-fa-images",
        "bg-amber-100",
        "bg-amber-50 hover:bg-amber-100",
      )}
      {@render Tab(
        "Icons",
        "i-fa-icons",
        "bg-rose-100",
        "bg-rose-50 hover:bg-rose-100",
      )}
      {@render Tab(
        "Documents",
        "i-fa-file",
        "bg-indigo-100",
        "bg-indigo-50 hover:bg-indigo-100",
      )}
    </div>
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
  </div>
  {#if config.current.tab !== "none"}
    {#if config.current.tab === "Images"}
      <BoxWrapper color="bg-amber-200">
        <ImagesBox {imagesList} {onDeleteImage} {onRenameImage} />
      </BoxWrapper>
    {:else if config.current.tab === "Icons"}
      <BoxWrapper color="bg-rose-200">
        <IconsBox />
      </BoxWrapper>
    {:else if config.current.tab === "Syntax"}
      <BoxWrapper color="bg-sky-200">
        <SyntaxBox />
      </BoxWrapper>
    {:else if config.current.tab === "Documents"}
      <BoxWrapper color="bg-indigo-200">
        <DocumentsBox />
      </BoxWrapper>
    {/if}
  {/if}
</div>
