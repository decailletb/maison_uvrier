import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { scenesPlugin } from "./scripts/vite-scenes-plugin.ts";

export default defineConfig({
  plugins: [react(), scenesPlugin()],
  // CC0 assets (git-ignored, restored by `npm run assets:fetch`) are served at the site root.
  publicDir: "assets",
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173, strictPort: true },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
