<script lang="ts">
  import { fs } from "@zenfs/core";
  import { SvelteMap } from "svelte/reactivity";
  import { untrack } from "svelte";

  const {
    imagesList,
    onDeleteImage,
  }: { imagesList: string[]; onDeleteImage: (name: string) => void } = $props();

  let imagesThumbnailUrls: SvelteMap<string, string> = new SvelteMap();

  $effect(() => {
    const images = imagesList;
    untrack(() => {
      // console.log("Regenerating images");
      let keys = Array.from(imagesThumbnailUrls.keys());

      for (let img of images) {
        const buffer = fs.readFileSync(`/www/images/${img}/sm.webp`);

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
    });
  });

  let justCopied = $state("");
  async function copyToClipboard(img: string) {
    await navigator.clipboard.writeText(`images/${img}/md.webp`);
    justCopied = img;
    setTimeout(() => (justCopied = ""), 1000);
  }
</script>

<div class="font-mono grid gap-1.5 cols-2">
  {#each imagesList as img}
    <div class="flex-cs">
      <button
        onclick={() => copyToClipboard(img)}
        class="flex-cs cursor-pointer hover:bg-white/40 pr-0.5 rounded-r-2 relative"
      >
        <img
          alt="Thumbnail"
          class="w-10 h-10 bg-gray-200 rounded-1 mr1.5"
          src={imagesThumbnailUrls.get(img)}
        />
        {img}
        {#if justCopied === img}
          <div
            class="absolute inset-1 rounded-1 pointer-events-none bg-white/70 font-mono uppercase tracking-wider flex-cc"
          >
            <span class="bg-white px-0.5 rounded-1">Copied</span>
          </div>
        {/if}
      </button>
      <button
        aria-label="Delete"
        onclick={() => onDeleteImage(img)}
        class={[
          "ml-0.5 cursor-pointer  rounded-full p0.5 text-black/60 hover:(bg-white shadow-sm text-red-700/70)",
        ]}
      >
        <i class="i-fa-trash block size-4"></i>
      </button>
    </div>
  {/each}
</div>
