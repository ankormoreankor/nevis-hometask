/**
 * TASK: the dashboard page
 *
 * Goal
 *   The only screen: the chart above, the treegrid below, and the first-paint
 *   states owned here.
 *
 * Contract
 *   export default function Dashboard()
 *
 *   const simulate = read from useSearchParams(): "slow", "error" or undefined.
 *   Pass it to useDashboard and to TreeGrid; do not read the router inside the
 *   data hooks.
 *
 *   const { dashboard, error, isLoading, mutate } = useDashboard(simulate)
 *
 *   States
 *     isLoading  a skeleton that reserves the chart at 430px and the table
 *                header plus four rows, so nothing jumps when data lands.
 *     error      one message, the status if the error carries one, and a Retry
 *                button calling mutate(). Do not replace a page that already has
 *                data with an error screen; show the message above the stale
 *                content.
 *     data       <MonthlyChart branches={dashboard.branches} /> above
 *                <TreeGrid company={dashboard.company}
 *                          branches={dashboard.branches}
 *                          simulate={simulate} />.
 *
 *   Per-level loading and errors belong to TreeGrid. This page knows nothing
 *   below the branches.
 *
 *   Add Dashboard.module.css next to this file. The page shell is the only place
 *   CSS modules are still used: heading, max width, vertical rhythm. The two
 *   components own their insides.
 *
 * Acceptance
 *   - Cold cache: both skeletons, then the chart and the company row with three
 *     branches.
 *   - /dashboard?simulate=slow keeps the skeleton, then renders.
 *   - /dashboard?simulate=error renders the message and a Retry that refetches.
 *   - 375px: the page does not scroll sideways; the table does.
 *   - Expanding a branch does not re-render the chart or refetch the dashboard.
 *
 * Edge cases
 *   - SWR can hold data and an error at once after a failed revalidation. Render
 *     the data and the message; a blank error page loses what the user had.
 *   - The simulate param belongs in the key, so switching it does not overwrite
 *     the normal cache entry.
 *
 * Tests
 *   none here. Playwright covers the three states.
 *
 * Delete this comment when the code is in place.
 */
export default function Dashboard() {
  return null;
}
