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
  server: {
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
});
