import { defineConfig, devices } from "@playwright/test";

/**
 * Browser suite for the treegrid keyboard model, accessibility tree, chart
 * selection and loading, error, empty-year and invalid-year states.
 *
 * Each spec's assertions live in its own file under ./e2e.
 *
 * The two servers start from the repo root: Vite on 5173 proxying /api to the
 * API on 3000.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev:api",
      cwd: "../..",
      url: "http://localhost:3000/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run dev:web",
      cwd: "../..",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
