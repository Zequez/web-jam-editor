<script lang="ts">
  import pug from "./pug-browser.ts";

  let dir: FileSystemDirectoryHandle | null = $state(null);
  let indexFile: FileSystemFileHandle | null = $state(null);
  let content = $state("");
  let status = $state("Pick a directory to begin");
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveQueue: Promise<void> = Promise.resolve();
  let directoryVersion = 0;

  async function pick() {
    try {
      const selectedDirectory = await window.showDirectoryPicker();
      const selectedIndexFile = await selectedDirectory.getFileHandle(
        "index.pug",
        {
          create: true,
        },
      );
      const file = await selectedIndexFile.getFile();

      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }

      directoryVersion += 1;
      dir = selectedDirectory;
      indexFile = selectedIndexFile;
      content = await file.text();
      status = "Saved";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      status = "Could not open index.pug";
      console.error("Unable to open index.pug", error);
    }
  }

  function updateContent(event: Event) {
    content = (event.currentTarget as HTMLTextAreaElement).value;
    console.log("content", content);
    const renderTemplate = pug.compile(content, {
      compileDebug: false,
      inlineRuntimeFunctions: true,
      name: "template",
    });
    console.log(renderTemplate({}));
    scheduleSave();
  }

  function scheduleSave() {
    if (!indexFile) return;

    if (saveTimer) clearTimeout(saveTimer);

    const contentToSave = content;
    const fileToSave = indexFile;
    const versionToSave = directoryVersion;
    status = "Saving...";

    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveQueue = saveQueue
        .catch(() => undefined)
        .then(async () => {
          const writable = await fileToSave.createWritable();
          await writable.write(contentToSave);
          await writable.close();

          if (directoryVersion === versionToSave) status = "Saved";
        })
        .catch((error) => {
          if (directoryVersion === versionToSave) status = "Could not save";
          console.error("Unable to save index.pug", error);
        });
    }, 400);
  }
</script>

<div class="h-screen flex flex-col">
  <div class="h-12 p2 bg-gray-200 flex items-center gap-3">
    <button
      class="h-full px2 rounded-2 cursor-pointer uppercase text-white font-semibold bg-gray-500 hover:bg-gray-400"
      onclick={pick}>Open</button
    >
    {#if dir}
      <span class="text-sm text-gray-600">{dir.name}/index.pug · {status}</span>
    {/if}
  </div>
  <div class="grow">
    {#if dir}
      <textarea
        class="w-1/2 h-full bg-white font-mono p4 block"
        value={content}
        oninput={updateContent}
        aria-label="index.pug editor"
      ></textarea>
    {/if}
  </div>
</div>
