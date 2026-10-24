<script lang="ts">
  import { type Fs } from "@/lib/zen-fs-type";
  import { type CompileResult, type CompileError } from "@/lib/jam-compiler";
  import { createImagesEngineStore } from "@/lib/assets-compiler/images-engine.svelte.ts";

  import AssetsFrame from "./AssetsFrame";
  import CoderFrame from "./CoderFrame";
  import PreviewHostFrame from "./PreviewHostFrame.svelte";
  import BuildErrorDisplay from "./BuildErrorDisplay.svelte";
  import { assetsDir, imagesDir, imagesSizes, outputDir } from "@/lib/CONSTS";
  import { onMount } from "svelte";

  const {
    fs,
    sessionID,
    name,
    fsType,
  }: { fs: Fs; sessionID: string; name: string; fsType: "mem" | "dir" } =
    $props();

  const IMNG = createImagesEngineStore({
    // Assuming the ProjectFrame component is fully dismounted before FS changes
    // svelte-ignore state_referenced_locally
    fs,
    sourceDir: assetsDir,
    outputDir: outputDir,
    targetDir: imagesDir,
    sizes: imagesSizes,
  });

  onMount(() => {
    IMNG.scan();

    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      for (const file of files) {
        const ext = file.split(".").pop()?.toLowerCase();
        if (ext === "js") {
          fs.mkdirSync(`${outputDir}/scripts`, { recursive: true });
          console.log(
            "Copying",
            `${assetsDir}/${file}`,
            `${outputDir}/scripts/${file}`,
          );
          fs.copyFileSync(
            `${assetsDir}/${file}`,
            `${outputDir}/scripts/${file}`,
          );
        }
      }
    }
  });

  let previewHostFrameEl: PreviewHostFrame | null = $state(null);

  let currentBuildError = $state<CompileError | null>(null);
  function afterBuild() {
    currentBuildError = null;
    previewHostFrameEl?.refresh();
  }

  function handleBuildError(buildError: CompileError) {
    console.log("Handling build errror", buildError);
    currentBuildError = buildError;
  }

  let codePanelSize = $state(0.6);
  let resizing = $state(false);

  function handleStartDragResize(ev: MouseEvent) {
    resizing = true;
    const splitter = ev.currentTarget as HTMLElement;
    const container = splitter.parentElement;
    if (!container) return;

    const { left, width } = container.getBoundingClientRect();
    const splitterWidth = splitter.getBoundingClientRect().width;

    function handleMouseUp() {
      resizing = false;
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);

      if (codePanelSize === 1) {
        // const previewUrl = previewHostFrameEl?.generateUrl();
        // open new tab
      }
    }

    function handleMouseMove(ev: MouseEvent) {
      const position = (ev.clientX - left + splitterWidth / 2) / width;

      if (position > 0.9) {
        codePanelSize = 1;
      } else if (position < 0.2) {
        codePanelSize = 0.2;
      } else {
        codePanelSize = position;
      }
    }

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
  }

  const previewIsHidden = $derived(codePanelSize === 1);

  async function handleFilesAdded(files: File[]) {
    const undigestedFiles = await IMNG.digestImagesFromFiles(files);

    console.log("Some files undigested; not uploaded", undigestedFiles);
  }
</script>

{#if resizing}
  <div class="fixed size-full bg-black/0 z-1000 cursor-ew-resize"></div>
{/if}

<div class="flex w-full h-full relative">
  <div
    style={`width: calc(${codePanelSize * 100}% - 12px); max-width: ${currentBuildError ? "75%" : "100%"}`}
    class="shrink-0 h-full flex flex-col space-y-1.5"
  >
    <div class="max-h-50% w-full">
      <AssetsFrame
        onFilesAdded={handleFilesAdded}
        imagesList={Object.keys(IMNG.images)}
        onDeleteImage={(name: string) => IMNG.remove(name)}
        onRenameImage={(imgFrom: string, imgTo: string) =>
          IMNG.rename(imgFrom, imgTo)}
      />
    </div>
    <div class="h-40% grow w-full">
      <div
        class="h-full w-full relative rounded-1 overflow-hidden shadow-[0_1px_0_#0007] bg-red"
      >
        <CoderFrame
          {fs}
          onBuildEnds={afterBuild}
          onBuildError={handleBuildError}
          project={name}
          filePath="index.pug"
          outputDir="www"
          {fsType}
        />
      </div>
    </div>
  </div>
  <button
    aria-label="Drag"
    class={["group relative h-full cursor-ew-resize w-12px shrink-0", {}]}
    onmousedown={handleStartDragResize}
  >
    <div
      class={[
        "absolute group-hover:block top-2 bottom-2 left-1/2 -translate-x-1/2 rounded-full  w-1",
        {
          "block bg-violet-500": resizing,
          "hidden bg-black/30": !resizing,
        },
      ]}
    ></div>
  </button>
  <div
    class="h-full relative"
    style={`min-width: ${currentBuildError ? "25%" : "0%"}; width: ${previewIsHidden && currentBuildError ? 25 : (1 - codePanelSize) * 100}%;`}
  >
    <PreviewHostFrame
      {fs}
      sessionId={sessionID}
      hiddenMode={codePanelSize === 1}
      servePath="www"
      bind:this={previewHostFrameEl}
    />
    {#if currentBuildError}
      <BuildErrorDisplay buildError={currentBuildError} />
    {/if}
  </div>
</div>
