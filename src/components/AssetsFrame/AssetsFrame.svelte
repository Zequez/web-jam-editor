<script lang="ts">
  import { fs } from "@zenfs/core";
  import AssetsDrawer from "./AssetsDrawer.svelte";
  import ImagesProcessor from "./ImagesProcessor.svelte";

  let imagesProcessor: ImagesProcessor;

  async function handleFilesAdded(files: File[]) {
    fs.mkdirSync("/assets", { recursive: true });
    fs.mkdirSync("/www/assets", { recursive: true });

    for (const file of files) {
      const data = new Uint8Array(await file.arrayBuffer());
      const filePath = `/assets/${file.name}`;
      fs.writeFileSync(filePath, data);

      imagesProcessor.addToQueue(filePath, "www/images");
    }
  }
</script>

<ImagesProcessor bind:this={imagesProcessor} />
<AssetsDrawer onFilesAdded={handleFilesAdded} />
