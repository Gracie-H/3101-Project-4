import { defineConfig } from "vite";

export default defineConfig({
  root: "client",
  server: {
    host: true,
    strictPort: false,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
