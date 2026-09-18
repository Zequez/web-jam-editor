import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import uno from "unocss/vite";

export default defineConfig({
  plugins: [svelte(), uno()],
  define: {
    "process.env": {},
    "process.versions": {
      node: "20.0.0",
    },
  },
});
