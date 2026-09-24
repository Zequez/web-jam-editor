<script lang="ts">
  import { fs } from "@zenfs/core";
  import AssetsDrawer from "./AssetsDrawer.svelte";

  async function handleFilesAdded(files: File[]) {
    for (const file of files) {
      const data = new Uint8Array(await file.arrayBuffer());
      fs.writeFileSync(file.name, data);
    }
  }
</script>

<AssetsDrawer onFilesAdded={handleFilesAdded} />
