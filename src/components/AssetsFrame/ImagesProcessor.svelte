<script lang="ts">
  import { fs } from "@zenfs/core";
  let canvas: HTMLCanvasElement;

  type QueuedImage = [filePath: string, outputFolder: string];

  let queue = $state<QueuedImage[]>([]);
  let isProcessing = $state(false);

  // File path comes with file name
  // Output is a folder
  export function addToQueue(filePath: string, outputFolder: string) {
    queue.push([filePath, outputFolder]);
    if (!isProcessing) {
      void processQueue();
    }
  }

  export function isImageFile(filePath: string) {
    const mimeType = detectMimeType(filePath);
    return !!mimeType;
  }

  export function imageRoutes(name: string) {
    return {
      dir: `/images/${name}`,
      original: `/images/${name}.webp`,
      sm: `/images/${name}/sm.webp`,
      md: `/images/${name}/md.webp`,
      lg: `/images/${name}/lg.webp`,
    };
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
      const [filePath, outputFolder] = queue[0]!;
      await processImage(filePath, outputFolder);
      queue.shift();
    }
  }

  const sizes = {
    sm: 480,
    md: 960,
    lg: 1440,
  } as const;

  async function processImage(filePath: string, outputFolder: string) {
    const fileName = extractFileName(filePath);
    if (!fileName) return;

    const source = fs.readFileSync(filePath);
    const mimeType = detectMimeType(filePath);

    if (!mimeType) return;

    const imageBlob = new Blob([new Uint8Array(source).slice().buffer], {
      type: mimeType,
    });
    const image = await loadImage(imageBlob);

    const normalizedOutputFolder = outputFolder.replace(/\\/g, "/");
    fs.mkdirSync(normalizedOutputFolder, { recursive: true });

    const fullSizePath = `${normalizedOutputFolder}/${fileName}.webp`;
    await exportImage(
      image,
      fullSizePath,
      image.naturalWidth,
      image.naturalHeight,
    );

    const variantFolder = `${normalizedOutputFolder}/${fileName}`;
    fs.mkdirSync(variantFolder, { recursive: true });

    for (const [variant, maxWidth] of Object.entries(sizes) as [
      string,
      number,
    ][]) {
      const width = Math.min(maxWidth, image.naturalWidth);
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
      case "bmp":
        return "image/bmp";
      default:
        return null;
    }
  }

  function loadImage(blob: Blob): Promise<HTMLImageElement> {
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

  export function extractFileName(filePath: string) {
    const parts = filePath.split(/[\\/]/);
    const fileName = parts[parts.length - 1] ?? "";
    return fileName.replace(/\.[^.]+$/, "");
  }
</script>

<div
  class="hidden absolute bottom-0 right-0 bg-red-400/50 w-100 h-100 z-1000 pointer-events-none"
>
  <canvas class="" bind:this={canvas}></canvas>
</div>
