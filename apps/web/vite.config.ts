import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // shadcn/ui components import from "@/...".
      "@": path.resolve(__dirname, "./src"),
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
      // The API runs on its own port in development. In production Express
      // serves both, so this proxy never applies there.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
