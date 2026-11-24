import { defineConfig, devices } from "@playwright/test";

/**
 * The browser test setup.
 *
 * The unit suite under src covers the pure modules. This suite covers what a
 * browser owns: the keyboard model on the treegrid, the hierarchy reaching
 * assistive technology, the selection moving the chart, and the loading, error,
 * empty-year and invalid-year states.
 *
 * It has to cover at least:
 *   - ArrowRight expands a collapsed row, ArrowLeft collapses it and otherwise
 *     moves to the parent row, Enter and Space select, Home and End reach the
 *     ends of the visible rows.
 *   - Exactly one row carries tabindex="0", and exactly one carries
 *     aria-selected="true".
 *   - aria-expanded flips on the row, never on the chevron button.
 *   - A deep link to a channel opens the path to it and selects the channel.
 *   - The chart title follows the selected node.
 *   - The error state: the route is intercepted and answered with a 500, the
 *     message shows with a Retry button, and Retry refetches.
 *   - The loading state: the route is intercepted and delayed, so the skeleton
 *     is on screen before the data lands.
 *   - Nothing overflows the viewport at 375px.
 *   - Small screen layout at 375px: horizontal bar chart with 12 month labels,
 *     minimum 24px row spacing, wrapped legend outside the plot, sticky name
 *     column on the treegrid with capped width and truncated names, and short month labels.
 *
 * The two servers are started from the repo root, so the suite runs against
 * the same setup a reviewer uses: Vite on 5173 proxying /api to the API on
 * 3000.
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
