import { defineConfig, type Plugin } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import uno from "unocss/vite";
import { visualizer } from "rollup-plugin-visualizer";

const previewServiceWorkerPath = "/preview__/service-worker.js";
const previewRefreshClientPath = "/preview__/refresh-client.js";
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

function previewServiceWorker(): Plugin {
  return {
    name: "service-worker",
    configureServer(server) {
      server.middlewares.use(
        previewServiceWorkerPath,
        async (_request, response) => {
          try {
            const transformed = await server.transformRequest(
              "/src/lib/preview-virtual-server/service-worker.ts",
            );
            if (!transformed)
              throw new Error("Preview Service Worker source was not found.");
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/javascript");
            response.end(transformed.code);
          } catch (error) {
            server.ssrFixStacktrace(error as Error);
            response.statusCode = 500;
            response.end("Unable to load preview Service Worker.");
          }
        },
      );
      server.middlewares.use(
        previewRefreshClientPath,
        async (_request, response) => {
          try {
            const transformed = await server.transformRequest(
              "/src/lib/preview-virtual-server/refresh-client.ts",
            );
            if (!transformed)
              throw new Error("Preview refresh client source was not found.");
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/javascript");
            response.end(transformed.code);
          } catch (error) {
            server.ssrFixStacktrace(error as Error);
            response.statusCode = 500;
            response.end("Unable to load preview refresh client.");
          }
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [
    svelte(),
    uno(),
    previewServiceWorker(),
    visualizer({
      filename: "bundle-analysis.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap",
    }),
  ],
  resolve: {
    alias: {
      "@/lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@/stores": fileURLToPath(new URL("./src/stores", import.meta.url)),
      "@/components": fileURLToPath(
        new URL("./src/components", import.meta.url),
      ),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(projectRoot, "index.html"),
        "service-worker": resolve(
          projectRoot,
          "src/lib/preview-virtual-server/service-worker.ts",
        ),
        "refresh-client": resolve(
          projectRoot,
          "src/lib/preview-virtual-server/refresh-client.ts",
        ),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "service-worker"
            ? "preview__/service-worker.js"
            : chunk.name === "refresh-client"
              ? "preview__/refresh-client.js"
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
