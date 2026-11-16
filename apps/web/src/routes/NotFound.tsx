/**
 * TASK: the not-found route
 *
 * Goal
 *   One small page for any URL the app does not serve, so a typo gets an answer
 *   instead of a blank screen. /dashboard/abc lands here; /dashboard/2025 does
 *   not, because that is a valid year with an empty state.
 *
 * Contract
 *   export default function NotFound()
 *
 *   useLocation from "react-router" for the path, Link from "react-router" for
 *   the way out.
 *
 * Markup
 *   <h1>Page not found</h1>
 *   <p>The page {pathname} does not exist.</p>
 *   <Link to="/">Back to the dashboard</Link>
 *
 *   Plain text, no exclamation, no apology. The path comes from
 *   useLocation().pathname so a mistyped year is visible; do not echo
 *   search params or a full URL, which can carry anything.
 *
 * Acceptance
 *   - /dashboard/abc renders "Page not found" and the path.
 *   - /anything renders the same page.
 *   - The link goes to "/", which redirects to /dashboard/2024.
 *   - 375px: fits without scrolling.
 *
 * Edge cases
 *   - A path with characters that look like markup is rendered as text, never as
 *     HTML. React escapes it; do not use dangerouslySetInnerHTML.
 *
 * Tests
 *   Playwright: one assertion that /dashboard/abc renders the heading.
 *
 * Delete this comment when the code is in place.
 */
export default function NotFound() {
  return null;
}
