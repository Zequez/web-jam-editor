import { getContext, setContext } from "svelte";
import type { Fs } from "@/lib/zen-fs-type";

const CONTEXT_ID = Symbol("images-engine");

type ImagesEngineStoreConfig = {
  fs: Fs;
  sizes: { [key: string]: number | null };
  sourceDir: string; // Relative to root
  outputDir: string; // Relative to root
  targetDir: string; // Relative to outputDir
};

export function imagesEngineStore(config: ImagesEngineStoreConfig) {
  const { fs, sizes, sourceDir, outputDir, targetDir } = config;

  const OUTPUT_DIR = `${outputDir}/${targetDir}`;

  const canvas: HTMLCanvasElement = document.createElement("canvas");

  let queue = $state<string[]>([]);
  let isProcessing = $state(false);
  let images = $state<{ [key: string]: string }>({});
  let errors = $state<{ [key: string]: boolean }>({});

  async function digestImagesFromFiles(files: File[]) {
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    let undigestedFiles: File[] = [];
    for (const file of files) {
      // Skip non images
      if (detectMimeType(file.name) === null) {
        undigestedFiles.push(file);
        continue;
      }

      const data = new Uint8Array(await file.arrayBuffer());
      const filePath = `${sourceDir}/${file.name}`;
      fs.writeFileSync(filePath, data);

      processSingleFile(filePath);
    }

    return undigestedFiles;
  }

  function addToQueue(filePath: string) {
    queue.push(filePath);
    if (!isProcessing) {
      void processQueue();
    }
  }

  function scan() {
    console.log("Scanning assets");
    // TODO: Optimize the images processing
    // by storing a hash of the original file along the .webp files
    // Then compare the hash with the original file to see if
    // it needs to be processed
    // ALSO, if there is an output and there is no
    // image by that output name, delete it
    // Also, what happens if someone uploads an image
    // with the same name but different formats? foo.png + foo.jpg?

    if (fs.existsSync(sourceDir)) {
      const files = fs.readdirSync(sourceDir);
      for (const file of files) {
        if (detectMimeType(file) === null) continue;
        const filePath = `${sourceDir}/${file}`;
        processSingleFile(filePath);
      }
    }
  }

  function processSingleFile(filePath: string) {
    const name = extractFileName(filePath);
    addToQueue(filePath);
    images[name] = filePath;
  }

  function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    void startProcessing().finally(() => {
      isProcessing = false;
      if (queue.length > 0) {
        void processQueue();
      }
    });
  }

  async function startProcessing() {
    while (queue.length) {
      const filePath = queue[0]!;
      const startTime = Date.now();
      await processImage(filePath);
      const endTime = Date.now();
      console.log(
        "Processed image ",
        filePath,
        OUTPUT_DIR,
        endTime - startTime,
        "ms",
      );
      queue.shift();
    }
  }

  async function processImage(filePath: string) {
    const fileName = extractFileName(filePath);
    if (!fileName) return;

    const source = fs.readFileSync(filePath);
    const mimeType = detectMimeType(filePath);

    if (!mimeType) return;

    const imageBuffer = new Uint8Array(source).slice().buffer;
    const imageBlob = new Blob([imageBuffer], {
      type: mimeType,
    });
    const imageHash = await hashBuffer(imageBuffer);

    const normalizedOutputFolder = OUTPUT_DIR.replace(/\\/g, "/");
    fs.mkdirSync(normalizedOutputFolder, { recursive: true });
    const variantFolder = `${normalizedOutputFolder}/${fileName}`;
    fs.mkdirSync(variantFolder, { recursive: true });

    const HASH_PATH = `${variantFolder}/hash`;
    if (!fs.existsSync(HASH_PATH)) {
      fs.writeFileSync(HASH_PATH, "");
    }
    const currentHash = fs.readFileSync(HASH_PATH, "utf-8");
    // console.log("CURRENT HASH", currentHash, "NEW HASH", imageHash);

    if (currentHash !== imageHash) {
      const image = await imageElementFromBlob(imageBlob);

      for (const [variant, maxWidth] of Object.entries(sizes) as [
        string,
        number,
      ][]) {
        const width =
          maxWidth === null
            ? image.naturalWidth
            : Math.min(maxWidth, image.naturalWidth);
        const height = Math.max(
          1,
          Math.round((image.naturalHeight / image.naturalWidth) * width),
        );

        await exportImage(
          image,
          `${variantFolder}/${variant}.webp`,
          width,
          height,
        );
      }

      fs.writeFileSync(HASH_PATH, imageHash);
    } else {
      console.log("HASH MATCH: skipping image processing");
    }
  }

  async function hashBuffer(buffer: ArrayBuffer) {
    console.time("hashBuffer");

    const hash = await crypto.subtle.digest("SHA-256", buffer);

    console.timeEnd("hashBuffer");

    return [...new Uint8Array(hash)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function exportImage(
    image: HTMLImageElement,
    outputPath: string,
    width: number,
    height: number,
  ) {
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("2D canvas context is unavailable.");
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToWebp(canvas);
    const data = new Uint8Array(await blob.arrayBuffer());
    fs.writeFileSync(outputPath, data);
  }

  function detectMimeType(filePath: string): string | null {
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      default:
        return null;
    }
  }

  function imageElementFromBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Unable to read image: ${blob.type}`));
      };
      image.src = url;
    });
  }

  function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Unable to export canvas as WebP."));
            return;
          }
          resolve(blob);
        },
        "image/webp",
        0.9,
      );
    });
  }

  function extractFileName(filePath: string) {
    const parts = filePath.split(/[\\/]/);
    const fileName = parts[parts.length - 1] ?? "";
    return fileName.replace(/\.[^.]+$/, "");
  }

  function deleteImage(imgName: string) {
    const filePath = images[imgName];
    if (!filePath) return;
    delete images[imgName];

    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { recursive: true });
    }

    const imageOutputPath = `${OUTPUT_DIR}/${imgName}`;
    if (fs.existsSync(imageOutputPath)) {
      fs.rmSync(imageOutputPath, { recursive: true });
    }
  }

  function renameImage(imgFrom: string, imgTo: string) {
    const fromDir = `${OUTPUT_DIR}/${imgFrom}`;
    const outDir = `${OUTPUT_DIR}/${imgTo}`;
    if (fs.existsSync(outDir)) {
      console.error("Output name exists");
      return;
    }
    console.log("Renaming source image", imgFrom, "to", imgTo);

    const pathsToTry = [
      `${sourceDir}/${imgFrom}.jpg`,
      `${sourceDir}/${imgFrom}.png`,
      `${sourceDir}/${imgFrom}.webp`,
      `${sourceDir}/${imgFrom}.jpeg`,
      `${sourceDir}/${imgFrom}.gip`,
    ];

    for (const path of pathsToTry) {
      if (fs.existsSync(path)) {
        const extension = path.split(".").pop();
        const replacementPath = `${sourceDir}/${imgTo}.${extension}`;
        console.log("RENAMING ORIGINAL", path, replacementPath);
        fs.renameSync(path, replacementPath);
        console.log("RENAMING OUTPUT", fromDir, outDir);
        fs.renameSync(fromDir, outDir);
        console.log("Does it reach here?");
        const newImages = { ...images, [imgTo]: outDir };
        delete newImages[imgFrom];
        images = newImages;
        break;
      }
    }
  }

  function thumbnailsBlobsUrls() {}

  return {
    digestImagesFromFiles,
    scan,
    remove: deleteImage,
    rename: renameImage,
    get images() {
      return images;
    },
  };
}

export function createImagesEngineStore(config: ImagesEngineStoreConfig) {
  const store = imagesEngineStore(config);
  setContext(CONTEXT_ID, store);
  return store;
}

export function getImagesEngineStore() {
  return getContext<ReturnType<typeof imagesEngineStore>>(CONTEXT_ID);
}
