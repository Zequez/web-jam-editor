<script lang="ts">
  import { fs } from "@zenfs/core";
  import AssetsDrawer from "./AssetsDrawer.svelte";

  async function handleFilesAdded(files: File[]) {
    for (const file of files) {
      const data = new Uint8Array(await file.arrayBuffer());
      fs.mkdirSync("/www/assets", { recursive: true });
      fs.writeFileSync(`/www/assets/${file.name}`, data);
    }
  }
</script>

<AssetsDrawer onFilesAdded={handleFilesAdded} />
