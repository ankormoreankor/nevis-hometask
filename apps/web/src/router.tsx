/**
 * TASK: the route table
 *
 * Goal
 *   One screen at a named URL, with the root path redirecting to it.
 *
 * Contract
 *   export const router = createBrowserRouter([...])
 *
 *     "/"           loader returns redirect("/dashboard"). The redirect replaces
 *                   the history entry, so Back leaves the app instead of
 *                   bouncing between the two paths.
 *     "/dashboard"  element <Dashboard /> from "./routes/Dashboard".
 *
 *   main.tsx renders <RouterProvider router={router} /> inside StrictMode and
 *   drops the direct <App /> render. App.tsx and App.module.css are the old
 *   placeholder; fold whatever shell you need into the page and delete them.
 *
 * Acceptance
 *   - / lands on /dashboard in one history entry.
 *   - Back from /dashboard leaves the app and does not return to /.
 *   - /dashboard renders the page; no empty first paint on the redirect.
 *
 * Edge cases
 *   - A render-time <Navigate replace /> also works. A loader redirect runs
 *     before render, so it avoids the flash.
 *   - Do not mount the dashboard at "/" as well. Two URLs for one screen makes
 *     the redirect pointless and doubles the links that can go stale.
 *   - The selected node is a query parameter on /dashboard, not a route. Do not
 *     add "/dashboard/:nodeId": a path segment promises a page that renders from
 *     a cold load and obliges a not-found state, while ?node= can fall back to
 *     the company view. Two routes for one screen would also split the links.
 *
 * Tests
 *   none here. The redirect is covered with the page tests.
 *
 * Delete this comment when the code is in place.
 */
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([]);
