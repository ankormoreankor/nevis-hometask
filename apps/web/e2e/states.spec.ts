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

test("the empty year video and pause control", async ({ page }) => {
  await page.goto("/dashboard/2025");

  const video = page.locator("video");
  await expect(video).toBeVisible();
  expect(await video.evaluate((el: HTMLVideoElement) => el.muted && el.loop)).toBe(true);

  const pauseButton = page.getByRole("button", { name: "Pause animation" });
  await expect(pauseButton).toBeVisible();

  await pauseButton.click();
  await expect(page.getByRole("button", { name: "Play animation" })).toBeVisible();
});

test("the empty year does not overflow horizontally at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/dashboard/2025");
  await expect(page.getByRole("heading", { name: "No data for fiscal year 2025" })).toBeVisible();

  const pageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(pageOverflow).toBe(0);
});

test("the invalid year video and pause control", async ({ page }) => {
  await page.goto("/dashboard/abc");

  const video = page.locator("video");
  await expect(video).toBeVisible();
  expect(await video.evaluate((el: HTMLVideoElement) => el.muted && el.loop)).toBe(true);

  const pauseButton = page.getByRole("button", { name: "Pause animation" });
  await expect(pauseButton).toBeVisible();

  await pauseButton.click();
  await expect(page.getByRole("button", { name: "Play animation" })).toBeVisible();
});

test("the invalid year does not overflow horizontally at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/dashboard/abc");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();

  const pageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(pageOverflow).toBe(0);
});

test("the empty year honours prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dashboard/2025");

  await expect(page.getByRole("button", { name: "Play animation" })).toBeVisible();
  const isPaused = await page.locator("video").evaluate((el: HTMLVideoElement) => el.paused);
  expect(isPaused).toBe(true);
});

test("the empty year select has an accessible name and shows the placeholder", async ({ page }) => {
  await page.goto("/dashboard/2025");

  const select = page.getByLabel("Fiscal year");
  await expect(select).toBeVisible();
  await expect(select).toHaveValue("");
  await expect(select.locator("option:checked")).toHaveText("Select a fiscal year");
  const textAlign = await select.evaluate((el) => window.getComputedStyle(el).textAlign);
  expect(textAlign).toBe("left");
});

test("the empty year select centres its value", async ({ page }) => {
  await page.goto("/dashboard/2025");

  const supports = await page.evaluate(() => CSS.supports("appearance", "base-select"));
  test.skip(!supports, "the browser does not render a customizable select");

  const select = page.getByLabel("Fiscal year");
  await expect(select).toBeVisible();

  // The closed control is a flex box. Without centring, the selected content
  // stretches to the full height and the line of text sits at the top.
  await expect(select).toHaveCSS("align-items", "center");
});

test("the empty year select has a stable width", async ({ page }) => {
  await page.goto("/dashboard/2025");

  const select = page.getByLabel("Fiscal year");
  await expect(select).toBeVisible();

  const widthBefore = await select.evaluate((el) => el.getBoundingClientRect().width);
  await page.evaluate(() => document.fonts.ready);
  const widthAfter = await select.evaluate((el) => el.getBoundingClientRect().width);

  expect(Math.abs(widthAfter - widthBefore)).toBeLessThan(1);
  expect(widthAfter).toBeCloseTo(224, 0);
});

test("the page does not shift horizontally when the font loads", async ({ page }) => {
  await page.goto("/dashboard/2025");

  const heading = page.getByRole("heading", { name: "No data for fiscal year 2025" });
  await expect(heading).toBeVisible();

  const boxBefore = await heading.boundingBox();
  expect(boxBefore).not.toBeNull();

  await page.evaluate(() => document.fonts.ready);

  const boxAfter = await heading.boundingBox();
  expect(boxAfter).not.toBeNull();

  if (boxBefore && boxAfter) {
    expect(Math.abs(boxAfter.x - boxBefore.x)).toBeLessThanOrEqual(2);
  }
});

test("the empty year shows no skeleton once on screen", async ({ page }) => {
  await page.goto("/dashboard/2025");

  await expect(page.getByRole("heading", { name: "No data for fiscal year 2025" })).toBeVisible();
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
});

test("the loading state shows skeletons after delay and cleans them up on resolution", async ({
  page,
}) => {
  await page.route("**/api/dashboard/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });

  await page.goto("/dashboard/2024");

  const skeletons = page.locator('[data-slot="skeleton"]');
  await expect(skeletons.first()).toBeVisible();
  expect(await skeletons.count()).toBeGreaterThan(0);

  await expect(page.getByRole("row", { name: "Company" })).toBeVisible({ timeout: 15000 });
  await expect(skeletons).toHaveCount(0);
});
