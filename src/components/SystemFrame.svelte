<script lang="ts">
  import { projectsStorageService_ANCHOR } from "@/stores/projects-storage-service.svelte";

  import Loader from "./Loader.svelte";
  import WebJamHeading from "./StartFrame/WebJamHeading.svelte";
  import WrapAroundBar from "./WrapAroundBar";
  import ProjectFrame from "./ProjectFrame.svelte";
  import StartFrame from "./StartFrame";
  import { persistedState } from "svelte-persisted-state";

  const storedSessionID = sessionStorage.getItem("session-id");

  // svelte-ignore non_reactive_update
  let sessionID: string;
  if (!storedSessionID) {
    sessionID = crypto.randomUUID();
    sessionStorage.setItem("session-id", sessionID);
  } else {
    sessionID = storedSessionID;
  }

  const S = projectsStorageService_ANCHOR();

  let currentProject = persistedState<string | null>("currentProject", null, {
    storage: "session",
  });

  function focusProject(name: string) {
    currentProject.current = name;
  }

  function defocusProject() {
    currentProject.current = null;
  }
  // $effect(() => {
  // console.log("Change", S.state);
  // });

  async function revalidateDirHandle() {
    const handle = await window.showDirectoryPicker({
      mode: "readwrite",
    });
    S.updateDirHandle(currentProject.current!, handle);
    let current = currentProject.current;
    defocusProject();
    setTimeout(() => {
      focusProject(current!);
    }, 100);
  }
</script>

<WrapAroundBar>
  <div slot="menu">
    {#if currentProject.current}
      <button
        onclick={() => defocusProject()}
        class="h-full px-2 uppercase font-semibold text-3/6 hover:bg-white/20 cursor-pointer"
      >
        <span class="i-fa-close inline-block relative -bottom-2px"></span>
        Close
      </button>
      <span class="px-2 font-mono">
        /{currentProject.current}
      </span>
    {/if}
  </div>
  {#snippet LoadScreen()}
    <div class="bg-gray-200 rounded-1 size-full flex-cc flex-col">
      <WebJamHeading />
      <div class="w-70 h-30 flex-cc">
        <Loader />
      </div>
    </div>
  {/snippet}
  {#if S.state.type === "loading"}
    {@render LoadScreen()}
  {:else if S.state.type === "ready"}
    {#if currentProject.current}
      {#await S.focusFs(currentProject.current)}
        {@render LoadScreen()}
      {:then}
        <ProjectFrame
          fs={S.fs}
          {sessionID}
          name={currentProject.current}
          fsType={S.focusedProject!.storage.type}
        />
      {:catch}
        <div class="h-screen w-screen flex-cc">
          <div>
            The directory handler permission expired. You have to pick the
            directory again.
          </div>
          <button
            class="bg-red-400 hover:bg-red-500 text-white rounded-1 font-semibold px2 cursor-pointer"
            onclick={revalidateDirHandle}>Select directory</button
          >
        </div>
      {/await}
    {:else}
      <StartFrame
        onFocusProject={(name) => focusProject(name)}
        mountingMap={S.state.config}
      />
    {/if}
  {/if}
</WrapAroundBar>
