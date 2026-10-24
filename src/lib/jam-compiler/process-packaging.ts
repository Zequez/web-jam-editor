import { fs } from "@zenfs/core";
import JSZip from "jszip";
import { cp, rm, writeFile } from "@zenfs/core/promises";

type ProcessPackagingConfig = {
  sourceDir: string;
  inputDir: string;
  outputDir: string;
  projectName: string;
  projectVersion: string | null;
  downloadZip: boolean;
};

export async function processPackaging(
  config: ProcessPackagingConfig,
): Promise<null> {
  console.log(`Packing Jam...`);
  const { sourceDir, inputDir, outputDir } = config;

  const INPUT_DIR = join(sourceDir, inputDir);
  const OUTPUT_DIR = join(sourceDir, outputDir);

  await rm(OUTPUT_DIR, { recursive: true, force: true });

  console.log(INPUT_DIR, OUTPUT_DIR);
  await cp(INPUT_DIR, OUTPUT_DIR, {
    recursive: true,
    preserveTimestamps: true,
  });

  const IGNORED_FILES = [".git", "www", "www0", "www2", ".DS_Store"];

  const sourceZip = await zipDirectory(sourceDir, (file) => {
    if (IGNORED_FILES.includes(file)) return false;
    return true;
  });

  await writeFile(
    join(OUTPUT_DIR, "source.zip"),
    new Uint8Array(await sourceZip.arrayBuffer()),
  );

  if (config.downloadZip) {
    const outputZip = await zipDirectory(OUTPUT_DIR);
    downloadZip(
      outputZip,
      `${config.projectName}${config.projectVersion ? `-${config.projectVersion}` : ""}.zip`,
    );
  }

  return null;
}

export async function zipDirectory(
  root: string,
  shouldInclude = (file: string) => true,
) {
  const zip = new JSZip();

  async function addDirectory(dir: string, relative = "") {
    for (const name of await fs.promises.readdir(dir)) {
      const path = join(dir, name);
      const rel = relative ? `${relative}/${name}` : name;

      if (!shouldInclude(rel)) continue;

      const stat = await fs.promises.stat(path);

      if (stat.isDirectory()) {
        await addDirectory(path, rel);
      } else if (stat.isFile()) {
        zip.file(rel, await fs.promises.readFile(path));
      }
    }
  }

  await addDirectory(root);

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export function join(...paths: string[]) {
  const joined = paths.join("/");
  const absolute = joined.startsWith("/");

  const normalized = joined.split("/").filter(Boolean).join("/");

  return absolute ? `/${normalized}` : normalized;
}

function downloadZip(zip: Blob, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(zip);
  link.download = filename;
  link.click();
}
