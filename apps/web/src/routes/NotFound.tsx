import { Link, useLocation } from "react-router";

/**
 * The not-found route.
 *
 * One small page for any URL the app does not serve, so a typo gets an answer
 * instead of a blank screen. /dashboard/abc lands here; /dashboard/2025 does
 * not, because that is a valid year with an empty state.
 */
export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page {pathname} does not exist.</p>
      <Link to="/" className="text-sm underline">
        Back to the dashboard
      </Link>
    </main>
  );
}
