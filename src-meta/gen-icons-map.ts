import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import icons from "@fortawesome/fontawesome-free/metadata/icons.yml";

type IconStyle = "solid" | "regular" | "brands";

interface IconMetadata {
  unicode: string;
  styles: IconStyle[];
}

type IconMetadataMap = Record<string, IconMetadata>;

const outputDir = resolve("public/font-awesome");

const styleFiles: Record<IconStyle, string> = {
  solid: "solid.json",
  regular: "regular.json",
  brands: "brands.json",
};

async function generateIconMaps(iconData: IconMetadataMap): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  const maps: Record<IconStyle, Record<string, string>> = {
    solid: {},
    regular: {},
    brands: {},
  };

  for (const [name, metadata] of Object.entries(iconData)) {
    if (!metadata.unicode) continue;

    const character = String.fromCodePoint(parseInt(metadata.unicode, 16));

    for (const style of metadata.styles) {
      maps[style][name] = character;
    }
  }

  for (const [style, filename] of Object.entries(styleFiles) as [
    IconStyle,
    string,
  ][]) {
    const outputPath = resolve(outputDir, filename);

    await writeFile(
      outputPath,
      JSON.stringify(maps[style], null, 2) + "\n",
      "utf8",
    );

    console.log(
      `Generated ${filename}: ${Object.keys(maps[style]).length} icons`,
    );
  }
}

generateIconMaps(icons as IconMetadataMap).catch((error: unknown) => {
  console.error("Failed to generate Font Awesome icon maps:", error);
  process.exitCode = 1;
});
