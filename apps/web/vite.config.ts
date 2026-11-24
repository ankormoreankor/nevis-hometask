import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // shadcn/ui components import from "@/...".
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  css: {
    modules: {
      // .card-title in CSS becomes styles.cardTitle in TypeScript.
      localsConvention: "camelCaseOnly",
    },
  },
  build: {
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor",
              // The trailing separator keeps "react" from matching react-redux and the
              // other react-* packages, which belong to recharts and follow it.
              test: /node_modules[\\/](react|react-dom|react-router|zod|swr|cn|clsx|use-sync-external-store|scheduler)[\\/]/,
              priority: 2,
            },
            {
              name: "recharts",
              test: /node_modules[\\/]recharts/,
              priority: 1,
            },
            {
              name: "vendor",
              test: /node_modules/,
              priority: 0,
            },
          ],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      // The API runs on its own port and nothing is deployed, so this proxy is
      // how the client reaches it in every environment.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
