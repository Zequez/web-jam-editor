import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { zipSync } from "fflate";

const ZIP_PATH = "/default-webjam.zip";
const SOURCE_DIR = "default-webjam";
const EXCLUDED_DIR = "www";
const EXCLUDED_DIR_2 = ".git";
const OUTPUT_FILE = "default-webjam.zip";

async function collectFiles(
  root: string,
  current = root,
): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = {};

  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (
      current === root &&
      (entry.name === EXCLUDED_DIR || entry.name === EXCLUDED_DIR_2)
    ) {
      continue;
    }

    const absolutePath = join(current, entry.name);

    if (entry.isDirectory()) {
      Object.assign(files, await collectFiles(root, absolutePath));
      continue;
    }

    if (entry.isFile()) {
      const relativePath = relative(root, absolutePath).split(sep).join("/");

      files[relativePath] = new Uint8Array(await readFile(absolutePath));
    }
  }

  return files;
}

async function createZip(sourceDir: string): Promise<Uint8Array> {
  const files = await collectFiles(sourceDir);
  return zipSync(files, { level: 6 });
}

export function defaultWebjamZip(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "default-webjam-zip",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== ZIP_PATH) {
          next();
          return;
        }

        try {
          const sourceDir = join(config.root, SOURCE_DIR);

          const sourceStat = await stat(sourceDir).catch(() => null);

          if (!sourceStat?.isDirectory()) {
            res.statusCode = 404;
            res.end("default-webjam directory not found");
            return;
          }

          const zip = await createZip(sourceDir);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/zip");
          res.setHeader("Content-Length", zip.byteLength);
          res.setHeader("Cache-Control", "no-store");
          res.end(Buffer.from(zip));
        } catch (error) {
          console.error("[default-webjam-zip]", error);

          res.statusCode = 500;
          res.end("Failed to create default-webjam.zip");
        }
      });
    },

    async writeBundle() {
      const sourceDir = join(config.root, SOURCE_DIR);
      const outputFile = join(config.build.outDir, OUTPUT_FILE);

      const sourceStat = await stat(sourceDir).catch(() => null);

      if (!sourceStat?.isDirectory()) {
        this.error(`Missing ${SOURCE_DIR}/ directory`);
      }

      const zip = await createZip(sourceDir);

      await writeFile(outputFile, zip);
    },
  };
}
