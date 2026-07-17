import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project sites are served from https://<user>.github.io/<repo>/
// rather than the domain root, so the base path has to match the repo name.
// The build workflow sets VITE_BASE_PATH to "/<repo-name>/" automatically;
// for local dev it just falls back to "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
  build: {
    outDir: "dist",
  },
});
