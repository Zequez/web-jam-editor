import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import decompress from "woff2-encoder/decompress";

const sourceDir = resolve(
  "node_modules/@fortawesome/fontawesome-free/webfonts",
);

const outputDir = resolve("public/font-awesome");

const fonts = ["fa-brands-400", "fa-regular-400", "fa-solid-900"];

async function main() {
  await mkdir(outputDir, { recursive: true });

  for (const name of fonts) {
    const source = join(sourceDir, `${name}.woff2`);
    const destination = join(outputDir, `${name}.ttf`);

    console.log(`Decompressing ${name}.woff2...`);

    const input = await readFile(source);
    const output = await decompress(input);

    await writeFile(destination, output);

    console.log(`  → ${destination}`);
  }

  console.log("Font Awesome fonts ready.");
}

main().catch((error: unknown) => {
  console.error("Failed to prepare Font Awesome fonts:", error);
  process.exitCode = 1;
});
