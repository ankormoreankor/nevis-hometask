/**
 * TASK: the dashboard page
 *
 * Goal
 *   The only screen: the chart above, the treegrid below, and the selection that
 *   connects them. The page owns the URL, the first-paint states and the
 *   announcement of a scope change.
 *
 * Contract
 *   export default function Dashboard()
 *
 *   const [params, setParams] = useSearchParams()
 *   const nodeParam = params.get("node")
 *   const simulate = params.get("simulate") === "slow" || params.get("simulate") === "error"
 *     ? params.get("simulate")
 *     : undefined
 *
 *   const { company, error, isLoading, mutate } = useDashboard(simulate)
 *   const selected = company
 *     ? (findNode(company, nodeParam ?? "") ?? company)
 *     : null
 *
 *   onSelect(id):
 *     setParams(prev => { copy prev; id === company.id ? delete node : set node = id; return next },
 *               { replace: true })
 *     Keep simulate. A replace, not a push, so Back leaves the dashboard
 *     instead of walking through selections.
 *
 *   States
 *     isLoading  a skeleton that reserves the chart at 430px and the table
 *                header plus four rows, so nothing jumps when data lands.
 *     error      one message, the status if the error carries one, and a Retry
 *                button calling mutate(). Do not replace a page that already has
 *                data with an error screen; show the message above the stale
 *                content.
 *     data       <MonthlyChart node={selected} /> above
 *                <TreeGrid company={company} selectedId={selected.id}
 *                          onSelect={onSelect} />
 *
 *   The page knows nothing below the branches: no per-level loading, no per-row
 *   errors. Everything is in the one response.
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
 *   - Cold load: both skeletons, then the chart for the company and the company
 *     row with three branches.
 *   - /dashboard?simulate=slow keeps the skeleton, then renders.
 *   - /dashboard?simulate=error renders the message and a Retry that refetches.
 *   - Clicking Branch 1 puts ?node=<id> in the URL with replace, remaps the
 *     chart, and leaves the table's expansion alone.
 *   - Clicking the company row removes ?node=.
 *   - /dashboard?node=<branch 1 id> renders with the company and Branch 1
 *     expanded, Branch 1 selected, and the chart broken down by adviser.
 *   - /dashboard?node=nope renders the company view. No error, no crash.
 *   - The live region text changes with every selection.
 *   - Focus stays on the clicked row after the URL change.
 *   - Selecting rows does not refetch: one request per page load.
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
 *
 * Tests
 *   none here. Playwright covers the three states, the selection remap, the deep
 *   link, the focus assertion and the request count.
 *
 * Delete this comment when the code is in place.
 */
export default function Dashboard() {
  return null;
}
