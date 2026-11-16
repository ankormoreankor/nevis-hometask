/**
 * TASK: the client data layer
 *
 * Goal
 *   One request for the whole tree, parsed into the shared type. SWR's cache is
 *   the store. There is no React context for data and no second hook, because
 *   nothing is fetched per level.
 *
 * Contract
 *   export type Simulate = "slow" | "error"
 *
 *   export function useDashboard(simulate?: Simulate): {
 *     company: Company | undefined
 *     error: unknown
 *     isLoading: boolean
 *     isValidating: boolean
 *     mutate: () => Promise<Company | undefined>
 *   }
 *
 *   Key: "/api/dashboard", plus "?simulate=slow" or "?simulate=error" when set.
 *   The simulated key is separate from the real one, so an error demo does not
 *   poison the cache entry the normal view uses.
 *
 *   The fetcher parses the body with companySchema from "@nevis/shared". A
 *   non-2xx response throws an Error carrying the status and the body text, so
 *   the page can show what happened.
 *
 * Options
 *   revalidateIfStale: false    the payload is a snapshot of a fixed period.
 *                               Re-mounting the page should not refetch it.
 *   revalidateOnFocus: false    tabbing back does not refetch.
 *   shouldRetryOnError: false   ?simulate=error settles instead of backing off.
 *
 *   isLoading is true only when the key has no cached entry, which is what
 *   drives the page skeleton. isValidating is true during any request; use it
 *   for a quiet indicator, never for the skeleton.
 *
 *   No SWRConfig in production: pass the fetcher and the options here. Tests
 *   wrap the component in SWRConfig with provider: () => new Map(), or the cache
 *   leaks between tests.
 *
 * Acceptance
 *   - One page load produces exactly one GET /api/dashboard.
 *   - Selecting rows, expanding rows and navigating between ?node= values
 *     produce no further requests.
 *   - ?simulate=error surfaces as error, and isLoading goes false.
 *   - Two components calling useDashboard() produce one request.
 *
 * Edge cases
 *   - simulate comes from the page's search params and is passed in. This file
 *     does not read the router.
 *   - The cache is module-level and survives route changes, not reloads. A
 *     persisted cache is out of scope.
 *   - An unknown simulate value is not passed down. The page validates it, so
 *     the key stays predictable.
 *
 * Tests
 *   none in this file. The hook is covered through the page and the Playwright
 *   request count.
 *
 * Delete this comment when the code is in place.
 */
export {};
