<script lang="ts">
  import { onMount } from "svelte";

  let { onFilesDrop }: { onFilesDrop: (files: FileList) => void } = $props();

  let isDragging = $state(false);

  onMount(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    function cancelHide() {
      if (hideTimer !== undefined) {
        clearTimeout(hideTimer);
        hideTimer = undefined;
      }
    }

    function hideOverlay() {
      cancelHide();
      isDragging = false;
    }

    function handleDragEnter() {
      cancelHide();
      isDragging = true;
    }

    function handleDragOver(event: DragEvent) {
      // Required to allow dropping onto the page.
      event.preventDefault();

      cancelHide();
      isDragging = true;

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    }

    function handleDragLeave(event: DragEvent) {
      // Ignore transitions between elements inside the viewport.
      const leftViewport =
        event.clientX <= 0 ||
        event.clientY <= 0 ||
        event.clientX >= window.innerWidth ||
        event.clientY >= window.innerHeight;

      if (!leftViewport) return;

      // Give the browser a moment to emit any re-entry events.
      cancelHide();

      hideTimer = setTimeout(() => {
        isDragging = false;
        hideTimer = undefined;
      }, 80);
    }

    function handleDrop(event: DragEvent) {
      event.preventDefault();

      // Reset the UI regardless of whether any files were supplied.
      hideOverlay();

      const files = event.dataTransfer?.files;

      if (files?.length) {
        onFilesDrop(files);
      }
    }

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    // Also clean up if the browser tab becomes hidden during a drag.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) hideOverlay();
    });

    return () => {
      cancelHide();

      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  });
</script>

<div
  class={[
    "z-9999 fixed inset-6 group bg-black/30 b-2 b-black/20 rounded-4 flex-cc",
    {
      "pointer-events-none opacity-0": !isDragging,
    },
  ]}
  role="region"
>
  <div
    class="inset-1 absolute rounded-4 b-5 b-dashed b-white/60 transition-all group-hover:b-white"
  ></div>
  <div class="text-white flex-cc flex-col">
    <div class="flex-cc -space-x-12">
      <div
        class="i-fa-file-image size-20 flex-cc -rotate-15 transition-transform group-hover:(-rotate-20 -translate-y-3 -translate-x-3)"
      ></div>
      <div
        class="i-fa-folder size-20 flex-cc -rotate-5 transition-transform group-hover:(-rotate-10 -translate-y-3 -translate-x-1)"
      ></div>
      <div
        class="i-fa-file size-20 flex-cc rotate-5 transition-transform group-hover:(rotate-10 -translate-y-3 translate-x-1)"
      ></div>
      <div
        class="i-fa-file-word size-20 flex-cc rotate-15 transition-transform group-hover:(rotate-20 -translate-y-3 translate-x-3)"
      ></div>
    </div>
    <div
      class="font-mono text-6/12 uppercase font-bold text-shadow-[0_2px_0_#0008] transition-transform group-hover:scale-110"
    >
      Drop files here
    </div>
  </div>
</div>
