import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "src/mock"),
  publicDir: resolve(__dirname, "public"),
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    host: "localhost",
    port: 5174,
  },
  build: {
    outDir: resolve(__dirname, "dist-mock"),
  },
});
