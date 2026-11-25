import { Link, useLocation } from "react-router";
import notFoundVideo from "@/assets/not-found.mp4";
import notFoundPoster from "@/assets/not-found-poster.jpg";
import { StatePage } from "@/components/StatePage";

/**
 * The not-found route.
 *
 * One small page for any URL the app does not serve, so a typo gets an answer
 * instead of a blank screen. /dashboard/abc lands here; /dashboard/2025 does
 * not, because that is a valid year with an empty state.
 */
export function NotFound() {
  const { pathname } = useLocation();

  return (
    <StatePage videoSrc={notFoundVideo} poster={notFoundPoster} videoWidth={498} videoHeight={358}>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page {pathname} does not exist.</p>
      <Link to="/" className="inline-block py-1 text-sm underline">
        Back to the dashboard
      </Link>
    </StatePage>
  );
}
