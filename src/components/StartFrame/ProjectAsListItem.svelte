<script lang="ts">
  import { onMount, tick } from "svelte";

  const {
    pathName,
    storageTarget,
    storageType,
    onFocusProject,
    onDelete,
    onRename,
  }: {
    pathName: string;
    storageTarget: string;
    storageType: "mem" | "dir";
    onFocusProject: (path: string) => void;
    onDelete: (path: string) => void;
    onRename: (newPath: string) => void;
  } = $props();

  let menuOpen = $state(false);
  let menuEl: HTMLElement | null = $state(null);

  function handleClickMenuIcon() {
    menuOpen = true;
  }

  function handleWindowClick(ev: MouseEvent) {
    if (menuOpen && !menuEl?.contains(ev.target as Node)) {
      menuOpen = false;
    }
  }

  function handleUnlink() {
    menuOpen = false;
    onDelete(pathName);
  }

  function handleDeleteConfirm() {
    menuOpen = false;
    const result = prompt(`Type  ${pathName} to confirm deletion`);
    if (result === pathName) {
      onDelete(pathName);
    }
  }

  let pathNameEl: HTMLElement | null = $state(null);
  let isRenaming = $state(false);
  let renamingNewName = $state("");
  let renameInputEl = $state<HTMLInputElement | null>(null);
  let renamingInputWidth = $state(0);

  function handleRenameStart() {
    menuOpen = false;
    renamingNewName = pathName;
    const { width } = pathNameEl!.getBoundingClientRect();
    renamingInputWidth = width;
    isRenaming = true;
    tick().then(() => {
      renameInputEl?.focus();
      renameInputEl?.select();
    });
  }

  function doneRenaming() {
    isRenaming = false;
    onRename(renamingNewName);
  }

  function cancelRenaming() {
    isRenaming = false;
  }

  // onMount(() => {
  //   if (pathName === "ezequiel") {
  //     handleRenameStart();
  //   }
  // });
</script>

<svelte:window onmousedown={menuEl ? handleWindowClick : null} />

<div class="flex-cs gap-2 relative">
  {#if isRenaming}
    <div
      class="pl-1 py0.5 flex font-mono"
      style="width: {renamingInputWidth}px"
    >
      <span class="font-mono">/</span>
      <input
        onblur={cancelRenaming}
        onkeydown={(e) => {
          if (e.key === "Enter") {
            doneRenaming();
          } else if (e.key === "Escape") {
            cancelRenaming();
          }
        }}
        bind:this={renameInputEl}
        class="block grow h6 min-w-0 w-auto bg-white font-mono rounded-1
        outline-none shadow-[inset_0_0_2px_#0005] b-1 b-black/30 outline-offset-2"
        bind:value={renamingNewName}
      />
      <button
        onclick={doneRenaming}
        class="px1 bg-gray-400 h6 b ml2 b-black/10 text-white rounded-1 hover:(bg-sky-500 text-white cursor-pointer)"
        >Save</button
      >
    </div>
  {:else}
    <button
      bind:this={pathNameEl}
      oncontextmenu={(e) => {
        e.preventDefault();
        handleRenameStart();
      }}
      class="cursor-pointer flex-cs whitespace-nowrap grow hover:bg-gray-200 px-1 py0.5 rounded-1"
      onclick={() => onFocusProject(pathName)}
    >
      /{pathName}
    </button>
  {/if}
  <!-- <i class="i i-fa-arrow-right inline-block size-4"></i> -->
  <button
    title={storageTarget}
    class="bg-black/20 whitespace-nowrap b b-black/20 px-1 px0.5 rounded-1 text-white text-3 uppercase"
  >
    <span class="text-shadow-[0_1px_0_#000]">{storageType}</span>
    {#if storageType === "dir"}
      <span class="whitespace-nowrap text-black/60 text-3 normal-case">
        {storageTarget}
      </span>
    {/if}
  </button>

  <button
    onclick={handleClickMenuIcon}
    class={[
      "b b-transparent text-black/70 text-shadow-[0_1px_0_#fff] flex-cc rounded-1 w-7 h-5",
      {
        "bg-white b b-black/30": menuOpen,
        "bg-transparent  hover:bg-black/10 hover:b-black/10": !menuOpen,
      },
    ]}
    aria-label="Menu"
  >
    <i class="font-sans text-1.5em font-bold"
      ><span class="inline-block -translate-y-2px">···</span></i
    >
  </button>
  {#if menuOpen}
    <div
      bind:this={menuEl}
      class="absolute left-100% top-0 w-50 translate-x-1 bg-white py2 rounded-1 z-100 shadow-sm flex flex-col"
    >
      <button
        class="hover:bg-black/10 block px2 text-left"
        onclick={handleRenameStart}>Rename</button
      >
      {#if storageType === "mem"}
        <!-- <button class="hover:bg-black/10 block px2 text-left">Clone</button> -->
        <!-- <button class="hover:bg-black/10 block px2 text-left"
          >Transfer to folder</button
        > -->
        <button
          class="hover:bg-black/10 block px2 text-left"
          onclick={handleDeleteConfirm}
        >
          Delete</button
        >
      {:else if storageType === "dir"}
        <!-- <button class="hover:bg-black/10 block px2 text-left"
          >Fork to MEM</button
        > -->
        <button
          class="hover:bg-black/10 block px2 text-left"
          onclick={handleUnlink}
        >
          Unlink</button
        >
      {/if}
    </div>
  {/if}
</div>
