/**
 * TASK: the route table
 *
 * Goal
 *   One screen, keyed by fiscal year, with incomplete URLs redirecting to the
 *   default year and a catch-all for everything else.
 *
 * Contract
 *   export const router = createBrowserRouter([...])
 *
 *     "/"                  loader returns redirect("/dashboard/2024").
 *     "/dashboard"         loader returns redirect("/dashboard/2024").
 *     "/dashboard/:year"   element <Dashboard /> from "./routes/Dashboard".
 *     "*"                  element <NotFound /> from "./routes/NotFound".
 *
 *   DEFAULT_FISCAL_YEAR comes from "./lib/period" once it exists; until then the
 *   redirect can hold the literal 2024 and the task says to move it.
 *
 *   main.tsx renders <RouterProvider router={router} /> inside StrictMode and
 *   drops the direct <App /> render. App.tsx and App.module.css are the old
 *   placeholder; fold whatever shell you need into the page and delete them.
 *
 * Redirects
 *   Both loaders redirect with `replace`, so Back leaves the app instead of
 *   bouncing between the two paths. The redirect is on an incomplete URL only.
 *   A valid four-digit year never redirects, even a year with no data: that
 *   renders the empty state on /dashboard/2025 and the URL stays put. Silently
 *   sending someone to 2024 would hide the fact that they asked for 2025.
 *
 *   One hop on first load. "/" goes straight to "/dashboard/2024"; do not route
 *   "/" through "/dashboard" first, which would cost two history entries or two
 *   redirects.
 *
 * The year is a path segment, not a query parameter
 *   It selects a different resource and it can be absent from the URL entirely,
 *   so /dashboard/2024 is the honest shape. The selected node stays in ?node=,
 *   because that is a view of the same payload. Rule: path = different resource,
 *   query = different view.
 *
 *   /dashboard/abc is not found, not a redirect. A typo is a typo, and hiding it
 *   teaches the user the wrong URL.
 *
 * Acceptance
 *   - / lands on /dashboard/2024 in one history entry.
 *   - /dashboard lands on /dashboard/2024 in one history entry.
 *   - Back from /dashboard/2024 leaves the app and does not return to either
 *     redirect.
 *   - /dashboard/2025 renders the page (the page shows the empty state).
 *   - /dashboard/abc renders NotFound.
 *   - /anything-else renders NotFound.
 *   - /dashboard/2024 renders the page; no empty first paint on the redirect.
 *
 * Edge cases
 *   - A render-time <Navigate replace /> also works. A loader redirect runs
 *     before render, so it avoids the flash.
 *   - Do not mount the dashboard at "/" as well. Two URLs for one screen makes
 *     the redirect pointless and doubles the links that can go stale.
 *   - Do not add "/dashboard/:nodeId". A node is view state, not a resource.
 *
 * Tests
 *   none here. The redirects and the not-found route are covered with the page
 *   tests.
 *
 * Delete this comment when the code is in place.
 */
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([]);
