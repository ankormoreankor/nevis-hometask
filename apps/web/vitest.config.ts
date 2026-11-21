import { defineConfig } from "vitest/config";

/**
 * The unit test setup for the web workspace.
 *
 * The pure modules under src/lib are the ones the brief names as tests: the
 * fiscal calendar, the tree helpers and the chart mapping. They need no DOM,
 * so the environment is node and the suite stays fast.
 *
 * The browser suite lives in e2e and runs on Playwright.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
