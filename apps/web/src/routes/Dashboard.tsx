import { useParams, useSearchParams } from "react-router";
import { useDashboard } from "@/lib/api";
import { isNotFound } from "@/lib/http";
import NoData from "./NoData";

/**
 * TASK: the dashboard page
 *
 * Goal
 *   The screen for one fiscal year: the chart above, the treegrid below, and the
 *   selection that connects them. The page owns the route param, the URL, the
 *   first-paint states and the announcement of a scope change.
 *
 * Contract
 *   export default function Dashboard()
 *
 *   const { year } = useParams()
 *   if year is not four digits -> render <NotFound /> from "./NotFound". Do not
 *     redirect a typo to 2024; the router task states why.
 *   const fiscalYear = Number(year)
 *
 *   const [params, setParams] = useSearchParams()
 *   const nodeParam = params.get("node")
 *   const simulate = params.get("simulate") === "slow" || params.get("simulate") === "error"
 *     ? params.get("simulate")
 *     : undefined
 *
 *   const { company, error, isLoading, mutate } = useDashboard(fiscalYear, simulate)
 *
 *   If error has status 404 -> render <NoData fiscalYear={fiscalYear} />. A 404
 *   is an empty state, not a failure. Every other error goes through the error
 *   branch below. Read the status off the Error the fetcher throws.
 *
 *   const selected = company
 *     ? (findNode(company, nodeParam ?? "") ?? company)
 *     : null
 *
 *   onSelect(id):
 *     setParams(prev => { copy prev; id === company.id ? delete node : set node = id; return next },
 *               { replace: true })
 *     Keep simulate and keep the year: the year is the path, so it survives
 *     already. A replace, not a push, so Back leaves the dashboard instead of
 *     walking through selections. A year change is a real navigation and uses
 *     push; it happens through the NoData form or the address bar.
 *
 *   Heading: "Book of business" or the node name, with the period from
 *   formatPeriod(fiscalYear) ("Feb 2024 to Jan 2025") beside it. The heading is
 *   the only place the period is stated; the chart's scope title stays about the
 *   breakdown.
 *
 *   States
 *     isLoading  a skeleton that reserves the chart at 430px and the table
 *                header plus four rows, so nothing jumps when data lands.
 *                Skeleton from "@/components/ui/skeleton", the shadcn one, so
 *                the pulse comes from the tokens rather than a hand-rolled
 *                animation.
 *     error      one message, the status if the error carries one, and a Retry
 *                button calling mutate(). Do not replace a page that already has
 *                data with an error screen; show the message above the stale
 *                content.
 *     data       <MonthlyChart node={selected} fiscalYear={fiscalYear} /> above
 *                <TreeGrid company={company} selectedId={selected.id}
 *                          fiscalYear={fiscalYear} onSelect={onSelect} />
 *
 *   The page knows nothing below the branches: no per-level loading, no per-row
 *   errors. Everything is in the one response for the year.
 *
 *   Live region: a visually hidden <p aria-live="polite"> carrying the current
 *   scope, e.g. "Showing Branch 1, broken down by adviser". Selecting a row
 *   remaps the chart silently otherwise, and the chart is the only place the
 *   change is visible.
 *
 *   Add Dashboard.module.css next to this file. The page shell is the only place
 *   CSS modules are still used: heading, max width, vertical rhythm. The two
 *   components own their insides.
 *
 * Acceptance
 *   - Cold load of /dashboard/2024: both skeletons, then the chart for the
 *     company and the company row with three branches.
 *   - /dashboard/2024?simulate=slow keeps the skeleton, then renders.
 *   - /dashboard/2024?simulate=error renders the message and a Retry that
 *     refetches.
 *   - /dashboard/2025 renders the NoData page, not an error page.
 *   - /dashboard/abc renders NotFound.
 *   - Clicking Branch 1 puts ?node=<id> in the URL with replace, remaps the
 *     chart, and leaves the table's expansion alone.
 *   - Clicking the company row removes ?node=.
 *   - /dashboard/2024?node=<branch 1 id> renders with the company expanded,
 *     Branch 1 selected, and the chart broken down by adviser. Branch 1 stays
 *     collapsed: a deep link opens the path to the selected node, not the node
 *     itself. The TreeGrid contract decides that, and this item has to agree
 *     with it.
 *   - /dashboard/2024?node=nope renders the company view. No error, no crash.
 *   - The heading shows "Feb 2024 to Jan 2025" on /dashboard/2024 and
 *     "Feb 2025 to Jan 2026" on /dashboard/2025's empty state, if it shows a
 *     period at all.
 *   - The live region text changes with every selection.
 *   - Focus stays on the clicked row after the URL change.
 *   - Selecting rows does not refetch: one request per page load per year.
 *   - 375px: the page does not scroll sideways; the table does.
 *
 * Edge cases
 *   - SWR can hold data and an error at once after a failed revalidation. Render
 *     the data and the message; a blank error page loses what the user had.
 *   - The simulate param belongs in the key, so switching it does not overwrite
 *     the normal cache entry. It also has to survive a selection change.
 *   - The selected id is a view parameter, not a route. It lives in the query
 *     string, so a bogus value can fall back to the company instead of needing a
 *     not-found page.
 *   - A year switch unmounts nothing: the same Dashboard instance gets a new
 *     param. The SWR key changes, so the request happens; the skeleton shows only
 *     if that year has no cached entry.
 *
 * Tests
 *   none here. Playwright covers the states, the empty year, the invalid year,
 *   the selection remap, the deep link, the focus assertion and the request
 *   count.
 *
 * Delete this comment when the code is in place.
 */
export default function Dashboard() {
  const { year } = useParams();
  const fiscalYear = Number(year);

  const [params] = useSearchParams();
  const simulateRaw =
    params.get("simulate") === "slow" || params.get("simulate") === "error"
      ? params.get("simulate")
      : undefined;
  const simulate = simulateRaw === "slow" || simulateRaw === "error" ? simulateRaw : undefined;

  const { company, error, isLoading } = useDashboard(fiscalYear, simulate);

  console.log("🚀 ~ Dashboard ~ data, error, isLoading:", company, error, isLoading);
  console.dir(error);
  if (isNotFound(error)) {
    return <NoData fiscalYear={fiscalYear} />;
  }

  return null;
}
