<script lang="ts">
  import { onMount } from "svelte";
  import {
    generateIconsFontCss,
    type IconsAvailable,
    iconsPrefixes,
    iconsFontsNames,
  } from "@/lib/icons-engine";

  const iconsExtracts: Record<IconsAvailable, string[]> = {
    faSolid: ["heart", "bacterium"],
    faRegular: ["cloud"],
    faBrands: ["github", "chrome"],
  };

  onMount(async () => {
    const css = await generateIconsFontCss(iconsExtracts);
    injectIconsCss(css);
  });

  function injectIconsCss(css: string) {
    const style = document.createElement("style");

    style.textContent = css;

    document.head.appendChild(style);
  }
</script>

<div
  class="text-12 text-black flex-cc size-full bg-gray-500 text-shadow-[0_1px_0_#ffff] flex-col"
>
  Hello there I'm doing some font-based icons on the fly.

  {#each Object.entries(iconsExtracts) as [iconFontName, iconsToExtract]}
    {@const prefix = iconsPrefixes[iconFontName as IconsAvailable]}
    {@const fontIconsName = iconsFontsNames[iconFontName as IconsAvailable]}
    <div>
      <div>{fontIconsName}</div>
      <div>
        {#each iconsToExtract as iconName}
          <i class="icon-{prefix}-{iconName}"></i>
        {/each}
      </div>
    </div>
  {/each}
</div>
