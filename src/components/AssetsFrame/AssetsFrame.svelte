<script lang="ts">
  import { fs } from "@zenfs/core";
  import AssetsDrawer from "./AssetsDrawer.svelte";
  import ImagesProcessor from "./ImagesProcessor.svelte";
  import { onMount } from "svelte";

  // http://localhost:5173/__preview/eafec662-0bc3-4d81-bd00-59281e3b0696/images/ezequiel/sm.webp

  let images = $state<{ [key: string]: string }>({});
  let imagesProcessor: ImagesProcessor;

  const IMAGES_OUTPUT = "/www/images";
  const UPLOAD_PATH = "/assets";

  onMount(() => {
    scanAssets();
  });

  async function handleFilesAdded(files: File[]) {
    fs.mkdirSync(UPLOAD_PATH, { recursive: true });
    fs.mkdirSync(IMAGES_OUTPUT, { recursive: true });

    for (const file of files) {
      const data = new Uint8Array(await file.arrayBuffer());
      const filePath = `${UPLOAD_PATH}/${file.name}`;
      fs.writeFileSync(filePath, data);

      processSingleFile(filePath);
    }
  }

  function scanAssets() {
    // TODO: Optimize the images processing
    // by storing a hash of the original file along the .webp files
    // Then compare the hash with the original file to see if
    // it needs to be processed
    // ALSO, if there is an output and there is no
    // image by that output name, delete it
    // Also, what happens if someone uploads an image
    // with the same name but different formats? foo.png + foo.jpg?

    const files = fs.readdirSync(UPLOAD_PATH);
    for (const file of files) {
      const filePath = `${UPLOAD_PATH}/${file}`;
      processSingleFile(filePath);
    }
  }

  function processSingleFile(filePath: string) {
    const name = imagesProcessor.extractFileName(filePath);
    const isImage = imagesProcessor.isImageFile(filePath);

    if (isImage) {
      imagesProcessor.addToQueue(filePath, IMAGES_OUTPUT);
      images[name] = filePath;
    }
  }

  function deleteImage(imgName: string) {
    const filePath = images[imgName];
    if (!filePath) return;
    delete images[imgName];

    // const filePath = `${UPLOAD_PATH}/${file}`;
    // const name = imagesProcessor.extractFileName(filePath);
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { recursive: true });
    }
    const routes = imagesProcessor.imageRoutes(imgName);

    const outputOriginalPath = `/www${routes.original}`;
    const outputDirPath = `/www${routes.dir}`;

    console.log(outputOriginalPath);

    if (fs.existsSync(outputOriginalPath)) {
      console.log("REMOVING", outputOriginalPath);
      fs.rmSync(outputOriginalPath, { recursive: true });
    }
    if (fs.existsSync(outputDirPath)) {
      fs.rmSync(outputDirPath, { recursive: true });
    }
  }
</script>

<ImagesProcessor bind:this={imagesProcessor} />
<AssetsDrawer
  onFilesAdded={handleFilesAdded}
  imagesList={Object.keys(images)}
  onDeleteImage={(name: string) => deleteImage(name)}
/>
