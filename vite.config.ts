import { defineConfig, type Plugin } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import uno from "unocss/vite";

const previewServiceWorkerPath = "/__preview/service-worker.js";
const previewRefreshClientPath = "/__preview/refresh-client.js";
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

function previewServiceWorker(): Plugin {
  return {
    name: "preview-service-worker",
    configureServer(server) {
      server.middlewares.use(previewServiceWorkerPath, async (_request, response) => {
        try {
          const transformed = await server.transformRequest(
            "/src/preview-service-worker.ts",
          );
          if (!transformed) throw new Error("Preview Service Worker source was not found.");
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/javascript");
          response.end(transformed.code);
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          response.statusCode = 500;
          response.end("Unable to load preview Service Worker.");
        }
      });
      server.middlewares.use(previewRefreshClientPath, async (_request, response) => {
        try {
          const transformed = await server.transformRequest(
            "/src/preview-refresh-client.ts",
          );
          if (!transformed) throw new Error("Preview refresh client source was not found.");
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/javascript");
          response.end(transformed.code);
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          response.statusCode = 500;
          response.end("Unable to load preview refresh client.");
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), uno(), previewServiceWorker()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(projectRoot, "index.html"),
        "preview-service-worker": resolve(
          projectRoot,
          "src/preview-service-worker.ts",
        ),
        "preview-refresh-client": resolve(
          projectRoot,
          "src/preview-refresh-client.ts",
        ),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "preview-service-worker"
            ? "__preview/service-worker.js"
            : chunk.name === "preview-refresh-client"
              ? "__preview/refresh-client.js"
            : "assets/[name]-[hash].js",
      },
    },
  },
  define: {
    "process.env": {},
    "process.versions": {
      node: "20.0.0",
    },
  },
});
