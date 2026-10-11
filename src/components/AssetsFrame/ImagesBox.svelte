<script lang="ts">
  import { fs } from "@zenfs/core";
  import { SvelteMap } from "svelte/reactivity";
  import { untrack } from "svelte";

  const {
    imagesList,
    onDeleteImage,
    onRenameImage,
  }: {
    imagesList: string[];
    onDeleteImage: (name: string) => void;
    onRenameImage: (imgFrom: string, imgTo: string) => void;
  } = $props();

  let renaming = $state<[imgFrom: string, imgTo: string] | null>(null);
  let imagesThumbnailUrls: SvelteMap<string, string> = new SvelteMap();

  $effect(() => {
    const images = imagesList;
    untrack(() => {
      loadThumbnails(images);
    });
  });

  async function loadThumbnails(images: string[]) {
    // console.log("Regenerating images");
    let keys = Array.from(imagesThumbnailUrls.keys());

    for (let img of images) {
      const buffer = await insistantReadFileWithTimeout(
        `/www/images/${img}/sm.webp`,
      );

      // Revoke an old URL if we're replacing it
      const oldUrl = imagesThumbnailUrls.get(img);
      if (oldUrl) URL.revokeObjectURL(oldUrl);

      const blob = new Blob([buffer], { type: "image/webp" });
      const url = URL.createObjectURL(blob);

      imagesThumbnailUrls.set(img, url);

      keys = keys.filter((key) => key !== img);
    }

    // Remove images no longer in imagesList
    for (let key of keys) {
      const url = imagesThumbnailUrls.get(key);
      if (url) URL.revokeObjectURL(url);

      imagesThumbnailUrls.delete(key);
    }
  }

  const TIMEOUT = 6000;
  async function insistantReadFileWithTimeout(path: string) {
    const startTime = Date.now();
    let buffer: Buffer<ArrayBuffer> | null = null;
    while (Date.now() - startTime < TIMEOUT && !buffer) {
      try {
        buffer = await fs.promises.readFile(path);
      } catch (e) {
        console.log("Error reading image");
        await wait(200);
      }
    }

    if (!buffer) throw new Error(`Timed out reading ${path}`);

    return buffer;
  }

  async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let renameInput: HTMLInputElement = $state(null!);
  let justCopied = $state("");
  async function copyToClipboard(img: string) {
    await navigator.clipboard.writeText(`images/${img}/md.webp`);
    justCopied = img;
    setTimeout(() => (justCopied = ""), 1000);
  }

  $effect(() => {
    if (renameInput) {
      renameInput.focus();
      renameInput.select();
    }
  });

  function handleRenameStart(img: string) {
    console.log("Rename start", img);
    renaming = [img, img];
  }

  function handleRenamingInput(newImgName: string) {
    if (!renaming) return;
    renaming = [renaming[0], newImgName];
  }

  function handleRenamingBlur() {
    if (!renaming) return;

    const [imgFrom, imgTo] = renaming;

    onRenameImage(imgFrom, imgTo);

    renaming = null;
  }

  function handleCancelRename() {
    renaming = null;
  }

  function handleRenamingSpecialKeys(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenamingBlur();
    } else if (e.key === "Escape") {
      handleCancelRename();
    }
  }
</script>

<div class="flex flex-col sm:flex-row">
  <div class="mr-2">
    <h2 class="font-bold">How to use images</h2>
    <p class="text-3.5/6">Reference them using:</p>
    <ul class="text-3.5/6">
      <li>
        Original size: <span class="font-mono bg-black/10"
          >./images/{`<name>`}/original.webp</span
        >
      </li>
      <li>
        480px: <span class="font-mono bg-black/10"
          >./images/{`<name>`}/sm.webp</span
        >
      </li>
      <li>
        960px: <span class="font-mono bg-black/10"
          >./images/{`<name>`}/md.webp</span
        >
      </li>
      <li>
        1440px: <span class="font-mono bg-black/10"
          >./images/{`<name>`}/lg.webp</span
        >
      </li>
    </ul>
  </div>
  <div class="font-mono space-y-1.5 grow">
    {#if imagesList.length === 0}
      <div
        class="text-center h-full bg-black/5 b b-black/20 rounded-1 w-full flex-cc font-mono"
      >
        Drop some images
      </div>
    {/if}
    {#each imagesList as img}
      {@const imgUrl = imagesThumbnailUrls.get(img)}
      {@const isRenamingThis = renaming && renaming[0] === img}
      <div class="flex-cs w-full">
        <button
          onclick={() => copyToClipboard(img)}
          class="flex-cs cursor-pointer shrink-0 hover:bg-white/40 mr-1 rounded-r-2 relative"
        >
          {#if imgUrl}
            <img
              alt="Thumbnail"
              class="w-10 h-10 bg-gray-200 b b-black/20 rounded-1"
              src={imgUrl}
            />
          {:else}
            <div
              class="w-10 h-10 bg-gray-200 b b-black/20 rounded-1 flex-cc mr1.5"
            >
              <div class="i-fa-spinner animate-spin"></div>
            </div>
          {/if}
          {#if justCopied === img}
            <div
              class="absolute -inset-1 rounded-1 pointer-events-none bg-white/70 font-mono uppercase tracking-wider flex-cc"
            >
              <span class="bg-white px-0.5 rounded-1">Path Copied</span>
            </div>
          {/if}
        </button>
        {#if !isRenamingThis}
          <button
            onclick={() => handleRenameStart(img)}
            class="hover:bg-white/50 cursor-text px1.5 py0.5 rounded-1"
          >
            {img}
          </button>
        {:else}
          <input
            type="text"
            value={renaming![1]}
            onkeydown={handleRenamingSpecialKeys}
            oninput={(e) => handleRenamingInput(e.currentTarget.value)}
            onblur={() => handleRenamingBlur()}
            bind:this={renameInput}
            class="bg-white b-2 font-mono b-black/30 focus:b-violet-500 outline-0 px1 rounded-1 shrink-0 mr-1 block flex-grow"
          />
        {/if}

        {#if !isRenamingThis}
          <button
            aria-label="Delete"
            onclick={() => onDeleteImage(img)}
            class={[
              "ml-0.5 cursor-pointer  rounded-full p0.5 text-black/60 hover:(bg-white shadow-sm text-red-700/70)",
            ]}
          >
            <i class="i-fa-trash block size-4"></i>
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>
