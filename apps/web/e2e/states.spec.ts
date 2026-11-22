/**
 * TASK: the browser specs for the states the dashboard has to survive
 *
 * Goal
 *   The loading, error, empty-year and invalid-year states are the ones a
 *   reviewer trusts only when something asserts them. The API has no switch
 *   for them on purpose, so the specs drive the states by intercepting the
 *   route instead.
 *
 * Contract
 *   import { expect, test } from "@playwright/test"
 *
 *   The base URL is http://localhost:5173 and is set in playwright.config.ts,
 *   so page.goto("/dashboard/2024") is enough. The config starts the API and
 *   the dev server, so the spec starts neither.
 *
 *   The route to intercept is "/api/dashboard/**". The pattern starts with a
 *   slash, so Playwright resolves it against the base URL and it matches
 *   /api/dashboard/<year> on the dev server. The client asks for that path and
 *   nothing else, so one pattern covers every year.
 *
 *   The error state
 *     await page.route("/api/dashboard/**", route =>
 *       route.fulfill({
 *         status: 500,
 *         contentType: "application/json",
 *         body: JSON.stringify({ error: "Internal Server Error" }),
 *       }),
 *     )
 *     The page renders a role="alert" region with the message, the status and
 *     a button with the accessible name "Retry". Release the route before
 *     clicking Retry, or the retry is answered with the same 500:
 *     await page.unroute("/api/dashboard/**")
 *
 *   The loading state
 *     await page.route("/api/dashboard/**", async route => {
 *       await new Promise(resolve => setTimeout(resolve, 2000))
 *       await route.continue()
 *     })
 *     The page renders a role="status" region with the accessible name
 *     "Loading" while the request is in flight. The skeletons inside it hold
 *     the space the chart and the table will take and are decorative, so the
 *     region is the thing to wait on:
 *     page.getByRole("status", { name: "Loading" })
 *
 *   Requests are counted with page.on("request"). The hook retries a 5xx twice
 *   with a growing backoff, so the count is what tells one attempt from three.
 *
 * Acceptance
 *   - A 500 shows role="alert" carrying the message and the status, and a
 *     button named "Retry".
 *   - Clicking Retry after the route is released shows the treegrid and the
 *     alert is gone.
 *   - A delayed response shows role="status" named "Loading" first and the
 *     treegrid after it.
 *   - /dashboard/2025 shows the empty year, not an error.
 *   - /dashboard/abc shows the not-found page.
 *
 * Edge cases
 *   - The 404 for /dashboard/2025 is an empty state, so it is never retried.
 *     The request count for that page is one.
 *   - The alert can come back while a retry is in flight. Assert that the
 *     message stays visible, not that the request count is one.
 *   - unroute before clicking Retry, or the retry is answered with the same
 *     500 and the spec passes for the wrong reason.
 *   - The status text is "The server answered with status 500." for a 500 and
 *     "The request did not reach the server." for a dropped connection.
 *
 * Tests
 *   none here. This file is the test.
 *
 * Delete this comment when the code is in place.
 */
import { expect, test } from "@playwright/test";

test("the api answers the dashboard route", async ({ request }) => {
  const response = await request.get("/api/dashboard/2024");
  expect(response.status()).toBe(200);
});

test.fixme("the error state", async () => {
  // the assertions belong here
});

test.fixme("the loading state", async () => {
  // the assertions belong here
});

test.fixme("the empty year", async () => {
  // the assertions belong here
});

test.fixme("the invalid year", async () => {
  // the assertions belong here
});
