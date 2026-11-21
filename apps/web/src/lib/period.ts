/**
 * TASK: the fiscal calendar, in one file
 *
 * Goal
 *   Everything that knows February is the first month of a fiscal year lives
 *   here. The chart axis, the table header, the page heading and the NoData year
 *   range all read from this module, so the year in the route is the only input
 *   and no component formats a date on its own.
 *
 * Contract
 *   export const FISCAL_YEAR_MIN = 2000
 *     The first fiscal year the NoData picker offers. Business rule, not a data
 *     fact: the picker lists valid years, not years that have rows.
 *
 *   export const DEFAULT_FISCAL_YEAR = 2024
 *     The fiscal year the dashboard falls back to, because it is the one year
 *     the payload covers. The router holds the literal 2024 in both redirects
 *     until this module lands, and then imports it from here. One name for the
 *     fallback beats the same literal in two places.
 *
 *   export const FISCAL_MONTHS: readonly { month: number; yearOffset: 0 | 1 }[]
 *     Twelve entries, February first. `month` is 1-12, `yearOffset` is 0 for
 *     Feb-Dec of the route year and 1 for January of the next one.
 *
 *   export function currentFiscalYear(): number
 *   export function formatMonthLabel(fiscalYear: number, index: number): string
 *   export function formatPeriod(fiscalYear: number): string
 *
 * Steps
 *   1. FISCAL_MONTHS is a literal table: { month: 2, yearOffset: 0 } through
 *      { month: 12, yearOffset: 0 }, then { month: 1, yearOffset: 1 }. Do not
 *      derive it with a loop and modulo: the table is twelve lines, and reading
 *      it should not require arithmetic.
 *   2. currentFiscalYear():
 *        const now = new Date();
 *        return now.getMonth() >= 1 ? now.getFullYear() : now.getFullYear() - 1;
 *      getMonth() is 0-based, so January is 0. In January 2025 the current
 *      fiscal year is still 2024, because FY2024 ends in Jan 2025.
 *   3. formatMonthLabel builds a UTC date:
 *        new Date(Date.UTC(fiscalYear + offset, month - 1, 1))
 *      then formats it with Intl.DateTimeFormat("en", { month: "short",
 *      year: "numeric", timeZone: "UTC" }). UTC on both sides, or a machine west
 *      of Greenwich renders the previous month. Index 0 of FY2024 reads
 *      "Feb 2024"; index 11 reads "Jan 2025".
 *   4. formatPeriod returns `"Feb 2024 to Jan 2025"` for 2024, using
 *      formatMonthLabel(fiscalYear, 0) and formatMonthLabel(fiscalYear, 11).
 *      Plain "to", no dash: the writing rules forbid em dashes in UI copy.
 *   5. DEFAULT_FISCAL_YEAR is 2024. When it exists, the two redirects in
 *      router.tsx import it instead of holding the literal. That is the last
 *      piece of the routing work.
 *
 *   Why a table and not the ISO month strings we had before: the wire carries
 *   twelve bare numbers, and which twelve depends on the year in the route. The
 *   labels cannot be constants, because the year inside them is not.
 *
 *   Why the year is not in the query string: the fiscal year selects a different
 *   payload, so it is a path segment (/dashboard/2024). The node selection is a
 *   view of the same payload, so it is a query parameter. See README decisions.
 *
 * Acceptance
 *   - formatMonthLabel(2024, 0) === "Feb 2024", formatMonthLabel(2024, 11) ===
 *     "Jan 2025", formatMonthLabel(2025, 0) === "Feb 2025".
 *   - formatPeriod(2024) === "Feb 2024 to Jan 2025".
 *   - FISCAL_MONTHS has 12 entries; every month 1-12 appears exactly once.
 *   - DEFAULT_FISCAL_YEAR is 2024.
 *   - currentFiscalYear() in January returns the previous calendar year.
 *   - No component outside this file calls Intl.DateTimeFormat for a month
 *     label.
 *
 * Edge cases
 *   - An index outside 0-11 has no entry. Return "" rather than throwing, or
 *     type the parameter as a union if you prefer the compiler to catch it.
 *   - A year below FISCAL_YEAR_MIN is still formattable; this module does not
 *     police the range. The NoData picker owns the range.
 *
 * Tests
 *   vitest for the four acceptance lines above. No DOM needed.
 *
 * Delete this comment when the code is in place.
 */
export const FISCAL_YEAR_MIN = 2000;

// Placeholder. Replace with the table and the formatters described above; these
// return empty strings so the module compiles before the components land.
export function currentFiscalYear(): number {
  return FISCAL_YEAR_MIN;
}

export function formatMonthLabel(_fiscalYear: number, _index: number): string {
  return "";
}

export function formatPeriod(_fiscalYear: number): string {
  return "";
}
