/**
 * TASK: the client data layer
 *
 * Goal
 *   One request for one fiscal year, parsed into the shared type. SWR's cache is
 *   the store. There is no React context for data and no second hook, because
 *   nothing is fetched per level.
 *
 * Contract
 *   export type Simulate = "slow" | "error"
 *
 *   export function useDashboard(year: number, simulate?: Simulate): {
 *     company: Company | undefined
 *     error: unknown
 *     isLoading: boolean
 *     isValidating: boolean
 *     mutate: () => Promise<Company | undefined>
 *   }
 *
 *   Key: `/api/dashboard/${year}`, plus "?simulate=slow" or "?simulate=error"
 *   when set. A different year is a different resource, so it gets its own key
 *   and its own request. The simulated key is separate again, so an error demo
 *   does not poison the cache entry the normal view uses.
 *
 *   The fetcher parses the body with companySchema from "@nevis/shared". A
 *   non-2xx response throws an Error carrying the status and the body text, so
 *   the page can tell a 404 from a 500. The page renders 404 as the empty state,
 *   not as an error, so the status has to survive.
 *
 * Options
 *   revalidateIfStale: false    a fiscal year's payload is a fixed snapshot.
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
 *   - One page load of /dashboard/2024 produces exactly one
 *     GET /api/dashboard/2024.
 *   - Switching to /dashboard/2025 produces one GET /api/dashboard/2025 and
 *     leaves the 2024 entry cached.
 *   - Selecting rows and expanding rows produce no further requests.
 *   - ?simulate=error surfaces as error, and isLoading goes false.
 *   - A 404 surfaces as error with status 404 so the page can branch.
 *
 * Edge cases
 *   - year comes from the route and simulate from the search params; both are
 *     passed in. This file does not read the router.
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
