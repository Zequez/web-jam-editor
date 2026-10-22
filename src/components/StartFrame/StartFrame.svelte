<script lang="ts">
  import WebJamHeading from "./WebJamHeading.svelte";
  import registryRaw from "../../../webjam-registry.yaml";
  import type {
    MountingMap,
    StorageType,
  } from "@/stores/projects-storage.svelte";
  import ProjectAdder from "./ProjectAdder.svelte";

  const {
    mountingMap,
    onFocusProject,
    onAddProject,
  }: {
    mountingMap: MountingMap;
    onFocusProject: (path: string) => void;
    onAddProject: (name: string, storage: StorageType) => void;
  } = $props();

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
</script>

<div
  class="bg-gray-200 rounded-1 size-full overflow-auto shadow-sm b b-black/10"
>
  <div
    class="py-6 md:py-12 px6 flex-cs flex-col space-y-3 max-w-screen-lg mx-auto text-center"
  >
    <WebJamHeading />

    <div class="flex gap-4">
      <div
        class="bg-black/10 b b-black/10 text-black/80 rounded-2 p4 font-mono text-left flex flex-col gap-1"
      >
        <div class="text-5">Codebase</div>
        {#snippet Project(
          pathName: string,
          storageType: "dir" | "mem",
          storageTarget: string,
        )}
          <div class="flex-cs gap-2 relative">
            <button
              class="cursor-pointer hover:bg-gray-200 px-1 py0.5 rounded-1"
              onclick={() => onFocusProject(pathName)}
            >
              /{pathName}
            </button>
            <i class="i i-fa-arrow-right inline-block size-4"></i>
            <button
              class="bg-black/20 px-1 px0.5 rounded-1 text-white text-3 uppercase"
              >{storageType}</button
            >
            {storageTarget}
            <button
              class="bg-gray-400 b b-black/20 text-white flex-cc rounded-1 size-7 hover:bg-blue-400"
              aria-label="Menu"
            >
              <i class="i i-fa-ellipsis-vertical text-1.3em"></i>
            </button>
            <div
              class="absolute hidden left-100% top-0 w-40 -translate-x-7 bg-white py2 rounded-1 z-100 shadow-sm flex flex-col"
            >
              <button class="hover:bg-black/10 block px2 text-left"
                >Rename</button
              >
              <button class="hover:bg-black/10 block px2 text-left"
                >Move to MEM</button
              >
              <button class="hover:bg-black/10 block px2 text-left"
                >Delete</button
              >
            </div>
          </div>
        {/snippet}
        {#each mountingMap.entries() as [pathName, project]}
          {@const storageName =
            project.storage.type === "dir"
              ? project.storage.handle.name
              : project.storage.storeName}
          {@render Project(pathName, project.storage.type, storageName)}
        {/each}
        <div class="grow"></div>
        <ProjectAdder
          onAddProject={(name, storage) => onAddProject(name, storage)}
        />
      </div>
      <div
        class="bg-black/10 b b-black/10 rounded-2 p4 font-mono text-left flex flex-col gap-1"
      >
        <div class="text-5">Commons</div>
        {#each Object.entries(parsedRegistry) as [suggestedPath, reg]}
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
              onclick={() => cloneRepo(reg.source, suggestedPath)}>Clone</button
            >
          </div>
        {/each}
        <div class="flex gap-4 mt2">
          <input
            type="text"
            class="block grow bg-white rounded-1 px-2 b b-black/40"
            placeholder="...or load a Github URL"
          />
          <button
            class="px1 bg-gray-400 b b-black/10 text-white rounded-1 hover:(bg-sky-500 text-white cursor-pointer)"
            onclick={() => cloneCustom()}>Clone</button
          >
        </div>
      </div>
    </div>
    <!-- <div class="flex flex-col space-y-3 w-100 max-w-full">

      <button
        class="uppercase bg-blue-400 hover:bg-blue-300 text-white font-semibold px-3 py1.5 rounded-1 b b-black/10 cursor-pointer"
        onclick={systemFs.pickSessionFolder}>Open a folder</button
      >
      <button
        class="uppercase bg-blue-400 hover:bg-blue-300 text-white font-semibold px-3 py1.5 rounded-1 b b-black/10 cursor-pointer"
        onclick={() => systemFs.loadEmptyFilesystem()}>Empty project</button
      >
      <button
        class="uppercase bg-blue-400 hover:bg-blue-300 text-white font-semibold px-3 py1.5 rounded-1 b b-black/10 cursor-pointer"
        onclick={() => systemFs.loadTemplateFilesystem("default")}
        >Example project</button
      >
      <button
        class="uppercase bg-blue-400 hover:bg-blue-300 text-white font-semibold px-3 py1.5 rounded-1 b b-black/10 cursor-pointer"
        onclick={() => systemFs.loadTemplateFilesystem("foo")}
        >Foo project</button
      >
    </div> -->
    <div
      class="font-mono mt-24 opacity-33 text-black text-shadow-[0_1px_0_#fff]"
    >
      Made with love and fury<br />
      -
      <a
        href="https://ezequielschwartzman.org"
        class="underline underline-0.5 underline-offset-2 hover:underline-1.5"
        >Ezequiel</a
      >
    </div>
  </div>
</div>
