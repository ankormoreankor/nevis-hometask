/**
 * TASK: the client data layer
 *
 * Goal
 *   One hook per request, keyed by the request path, so the treegrid can fetch
 *   one level at a time and keep what it fetched after a row collapses. SWR's
 *   cache is the store. There is no React context for data.
 *
 * Contract
 *   export type Simulate = "slow" | "error"
 *
 *   export function useDashboard(simulate?: Simulate): {
 *     dashboard: DashboardResponse | undefined
 *     error: unknown
 *     isLoading: boolean
 *     isValidating: boolean
 *     mutate: () => Promise<DashboardResponse | undefined>
 *   }
 *
 *   export function useChildren(id: string | null, simulate?: Simulate): {
 *     children: NodeSummary[] | undefined
 *     error: unknown
 *     isLoading: boolean
 *     isValidating: boolean
 *     retry: () => void
 *   }
 *
 *   Keys
 *     dashboard   "/api/dashboard" plus "?simulate=slow" when set
 *     children    `/api/nodes/${id}/children` plus the same suffix, or null
 *                 while the row is closed. A null key suspends the request and
 *                 keeps the hook mounted.
 *
 *   fetcher parses the body with dashboardResponseSchema or
 *   childrenResponseSchema from "@nevis/shared". A non-2xx response throws an
 *   Error carrying the status and the body text, so the error state is readable.
 *
 * Options, the same for both hooks
 *   revalidateIfStale: false    a collapsed row reopens from cache with no
 *                               request. The payload is a snapshot of a fixed
 *                               period, so a refetch buys nothing.
 *   revalidateOnFocus: false    tabbing back does not refetch.
 *   shouldRetryOnError: false   ?simulate=error settles instead of backing off.
 *
 *   isLoading is true only when the key has no cached entry, which is what
 *   drives the skeleton. isValidating is true during any request; use it for a
 *   quiet indicator, never for the skeleton.
 *
 *   The simulated key is separate from the real one, so an error demo does not
 *   poison the cache entry the normal view uses.
 *
 *   No SWRConfig in production: pass the fetcher and the options per hook. Tests
 *   wrap the component in SWRConfig with provider: () => new Map(), or the cache
 *   leaks between tests.
 *
 * Acceptance
 *   - Expanding Branch 1 requests /api/nodes/<id>/children once.
 *   - Collapsing and re-expanding it renders the same rows with no request.
 *   - A 404 or ?simulate=error surfaces as error, and isLoading goes false.
 *   - Two components calling useDashboard() produce one request.
 *   - The company row never calls useChildren: its branches arrive with the
 *     dashboard response.
 *
 * Edge cases
 *   - id null must not fetch. Never build the key as "/api/nodes/null/children".
 *   - The cache is module-level and survives route changes, not reloads. A
 *     persisted cache is out of scope.
 *   - simulate is read from the page's search params and passed down. The hooks
 *     do not read the router.
 *
 * Tests
 *   none in this file. The hook is covered through the page and the Playwright
 *   request count.
 *
 * Delete this comment when the code is in place.
 */
export {};
