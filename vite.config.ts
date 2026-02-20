import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    fs: {
      strict: false,
      allow: [
        path.resolve(import.meta.dirname),
        path.resolve(import.meta.dirname, "client"),
        path.resolve(import.meta.dirname, "shared"),
        path.resolve(import.meta.dirname, "node_modules"),
      ],
    },
  },
  optimizeDeps: {
    include: [
      "@tanstack/react-query",
      "react",
      "react-dom",
      "wouter",
    ],
  },
});
