<script lang="ts">
  import WebJamHeading from "./WebJamHeading.svelte";
  import registryRaw from "../../../webjam-registry.yaml";
  import { version } from "../../../package.json";
  import type {
    MountingMap,
    StorageType,
  } from "@/stores/projects-storage-service.svelte";
  import ProjectAdder from "./ProjectAdder.svelte";
  import ProjectAsListItem from "./ProjectAsListItem.svelte";
  import { projectsStorageService } from "@/stores/projects-storage-service.svelte";

  const {
    mountingMap,
    onFocusProject,
  }: {
    mountingMap: MountingMap;
    onFocusProject: (path: string) => void;
  } = $props();

  const S = projectsStorageService();

  type Registry = {
    source: string;
    www: string;
    host: string;
    owner: string;
    name: string;
  };
  type RawRegistry = { [key: string]: { source: string; www: string } };
  type ParsedRegistry = { [key: string]: Registry };

  const registry = registryRaw.repos as RawRegistry;
  const parsedRegistry: ParsedRegistry = {};

  function parseRepo(repoDef: string) {
    const [host, repo] = repoDef.split(":") as [string, string];
    const [owner, name] = repo.split("/") as [string, string];
    return { host, owner, name };
  }

  Object.entries(registry).forEach(([suggestedPath, { source, www }]) => {
    const parsed = parseRepo(source);
    parsedRegistry[suggestedPath] = {
      source: source,
      www: www,
      host: parsed.host,
      owner: parsed.owner,
      name: parsed.name,
    };
  });

  function cloneRepo(reg: string, pathTarget: string) {
    console.log("Cloning repo");
  }

  function cloneCustom() {}

  const HOSTS: { [key: string]: string } = {
    gh: "https://github.com",
  };

  function handleOnDeleteProject(pathName: string) {
    console.log("DELETING");
    S.deleteProject(pathName);
  }

  async function handleAddProject(pathName: string, storage: StorageType) {
    await S.addProject(pathName, storage);
    onFocusProject(pathName);
  }

  function handleOnRenameProject(fromPathName: string, toPathName: string) {
    S.renameProject(fromPathName, toPathName);
  }
</script>

<div
  class="bg-gray-200 rounded-1 size-full overflow-auto shadow-sm b b-black/10"
>
  <div
    class="py-6 md:py-12 relative px6 flex-cs flex-col space-y-3 max-w-screen-lg mx-auto text-center"
  >
    <!-- {#if version.match(/staging/)}
      <div class="font-mono text-3 absolute top-0 left-0">STAGING</div>
    {/if} -->

    <WebJamHeading />

    <div class="flex w-full max-w-screen-sm">
      <div
        class="w-full bg-black/10 b b-black/10 text-black/80 rounded-2 p4 font-mono text-left flex flex-col gap-4"
      >
        <div class="text-5">Codebase</div>
        <div class="w-full min-h-140px">
          {#if mountingMap.size === 0}
            <div class="size-full flex-cc opacity-60">No projects</div>
          {:else}
            {#each mountingMap.entries() as [pathName, project] (pathName)}
              {@const storageName =
                project.storage.type === "dir"
                  ? project.storage.handle.name
                  : project.storage.storeName}
              <ProjectAsListItem
                {pathName}
                storageType={project.storage.type}
                storageTarget={storageName}
                {onFocusProject}
                onDelete={handleOnDeleteProject}
                onRename={(newPath: string) =>
                  handleOnRenameProject(pathName, newPath)}
              />
            {/each}
          {/if}
        </div>
        <ProjectAdder onAddProject={handleAddProject} />
        <div>
          Every Web Jam generated website includes it's own source code. Try
          cloning one of these websites and editting them locally:
        </div>
        <div>
          <div class="flex">
            <a
              class="underline underline-offset-2 hover:underline-2 text-sky-500 hover:text-sky-400"
              href="https://ezequielschwartzman.org">ezequielschwartzman.org</a
            >
            <div class="grow"></div>
            <button
              class="hover:(bg-sky-500 text-white) rounded-1 bg-black/0 px-1 py0.5 cursor-pointer"
              >CLONE</button
            >
          </div>
        </div>
        <div class="flex-ce opacity-33 text-black text-shadow-[0_1px_0_#fff]">
          <span>
            -<a
              href="https://ezequielschwartzman.org"
              class="underline underline-0.5 underline-offset-2 hover:underline-1.5"
              >Ezequiel</a
            >
          </span>
        </div>
        <!-- {#each Object.entries(parsedRegistry) as [suggestedPath, reg]}
            {@const host = HOSTS[reg.host]}
            <div class="flex gap-4">
              <div class="grow">
                <i
                  class="h5 w5 translate-y-3px mr2px inline-block i i-fa-brands-github"
                ></i><a
                  class="underline px1 py0.5 rounded-1 hover:(bg-sky-500 text-white) text-black/77"
                  target="_blank"
                  href="{host}/{reg.owner}/{reg.name}">{reg.owner}/{reg.name}</a
                >
              </div>
              <button
                class="px1 bg-gray-400 b b-black/10 text-white rounded-1 hover:(bg-sky-500 text-white cursor-pointer)"
                onclick={() => cloneRepo(reg.source, suggestedPath)}
                >Clone</button
              >
            </div>
          {/each} -->
      </div>
    </div>
    <!-- <div
        class="bg-black/10 b b-black/10 rounded-2 p4 font-mono text-left flex flex-col gap-1"
      >
        <div class="text-5">Commons</div>

      </div> -->
    <!-- </div> -->
  </div>
  <div
    class="font-mono relative flex-ee pr-2 pb-2 opacity-33 text-black text-shadow-[0_1px_0_#fff]"
  >
    <div class="text-right">
      Made with love<br />
      ...<a
        target="_blank"
        class="underline underline-0.5 underline-offset-2 hover:underline-1.5"
        href="https://www.youtube.com/watch?v=UxiJzpS8lhA">and fury</a
      ><br />
      -
      <a
        href="https://ezequielschwartzman.org"
        class="underline underline-0.5 underline-offset-2 hover:underline-1.5"
        >Ezequiel</a
      >
    </div>

    <div class="font-mono text-3 absolute left-1.5 bottom-1">v{version}</div>
  </div>
</div>
