import { expect, test } from "@playwright/test";

/**
 * The browser suite for the states the dashboard has to survive.
 *
 * The loading, error, empty-year and invalid-year states are the ones a
 * reviewer trusts only when something asserts them. The API has no switch for
 * them on purpose, so the specs drive the states by intercepting the route
 * instead.
 *
 * The base URL is http://localhost:5173 and is set in playwright.config.ts, so
 * page.goto("/dashboard/2024") is enough. The config starts the API and the
 * dev server, so the spec starts neither.
 *
 * The route to intercept is "**\/api/dashboard/**". The client asks for
 * /api/dashboard/<year> and nothing else, so one pattern covers every year.
 *
 * The error state
 *   await page.route("**\/api/dashboard/**", route =>
 *     route.fulfill({
 *       status: 500,
 *       contentType: "application/json",
 *       body: JSON.stringify({ error: "Internal Server Error" }),
 *     }),
 *   )
 *   The page shows the message in a role="alert" element and a button with the
 *   accessible name "Retry". Release the route before clicking Retry, or the
 *   retry is answered with the same 500:
 *     await page.unroute("**\/api/dashboard/**")
 *
 * The loading state
 *   await page.route("**\/api/dashboard/**", async route => {
 *     await new Promise(resolve => setTimeout(resolve, 2000))
 *     await route.continue()
 *   })
 *   The page shows a role="status" element with the accessible name
 *   "Loading" while the request is in flight. The skeletons inside it are
 *   decorative and carry aria-hidden.
 *
 * Requests are counted with page.on("request"). The hook retries a 5xx twice
 * with a growing backoff, so the count is what tells one attempt from three.
 */

test("the api answers the dashboard route", async ({ request }) => {
  const response = await request.get("/api/dashboard/2024");
  expect(response.status()).toBe(200);
});

test("the error state", async ({ page }) => {
  await page.route("**/api/dashboard/**", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Internal Server Error" }),
    }),
  );

  await page.goto("/dashboard/2024");

  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("status 500");
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

  // The route is released before the retry, or the retry is answered with the
  // same 500 and the spec passes for the wrong reason.
  await page.unroute("**/api/dashboard/**");
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByRole("row", { name: "Company" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("the loading state", async ({ page }) => {
  await page.route("**/api/dashboard/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });

  await page.goto("/dashboard/2024");

  const loading = page.getByRole("status", { name: "Loading" });
  await expect(loading).toBeVisible();
  await expect(page.getByRole("row", { name: "Company" })).toHaveCount(0);

  await expect(page.getByRole("row", { name: "Company" })).toBeVisible({ timeout: 15000 });
  await expect(loading).toHaveCount(0);
});

test("the empty year", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/dashboard/")) {
      requests.push(request.url());
    }
  });

  await page.goto("/dashboard/2025");

  await expect(page.getByRole("heading", { name: "No data for fiscal year 2025" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  // The 404 is an empty state, so it is never retried.
  expect(requests).toHaveLength(1);
});

test("the invalid year", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/dashboard/")) {
      requests.push(request.url());
    }
  });

  await page.goto("/dashboard/abc");

  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByText("The page /dashboard/abc does not exist.")).toBeVisible();

  // The year is checked in the route, so the request is never made.
  expect(requests).toHaveLength(0);
});

test("a leading zero is not a year", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/dashboard/")) {
      requests.push(request.url());
    }
  });

  await page.goto("/dashboard/0024");

  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByText("The page /dashboard/0024 does not exist.")).toBeVisible();
  expect(requests).toHaveLength(0);
});

test("a year past 2999 is not a year", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/dashboard/")) {
      requests.push(request.url());
    }
  });

  await page.goto("/dashboard/3000");

  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByText("The page /dashboard/3000 does not exist.")).toBeVisible();
  expect(requests).toHaveLength(0);
});
