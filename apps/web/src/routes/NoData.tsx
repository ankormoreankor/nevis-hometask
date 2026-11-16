/**
 * TASK: the empty year state
 *
 * Goal
 *   A fiscal year with no data is a state, not an error. The page says which
 *   year is empty and gives the user a way to another year and a way back to the
 *   dashboard. It is reachable by typing a URL or by picking a year here; the
 *   design has no year control on the dashboard.
 *
 * Contract
 *   export type NoDataProps = {
 *     fiscalYear: number
 *   }
 *   export default function NoData(props: NoDataProps)
 *
 *   FISCAL_YEAR_MIN, currentFiscalYear from "@/lib/period". useNavigate from
 *   "react-router".
 *
 * Markup
 *   <h1>No data for fiscal year {fiscalYear}</h1>. The year comes from the
 *   route param passed in, not from the error body. The heading is the only
 *   place that states where the user is, because the select never shows the
 *   current year.
 *
 *   Below it, a <form> with:
 *     <label htmlFor="year">Fiscal year</label>
 *     <select id="year" ...>
 *       <option value="" disabled>Select a fiscal year</option>
 *       {years.map(y => <option key={y} value={y}>{y}</option>)}
 *     </select>
 *     <button type="submit" disabled={draft === ""}>Go</button>
 *   and below the form, a plain <Link to="/">Back to the dashboard</Link>.
 *
 *   The form element gives Enter-to-submit for free. Do not navigate on the
 *   select's change event: a closed native select fires change on arrow keys in
 *   Chrome and Firefox, so a keyboard user would navigate on the first Down
 *   press, before hearing the options. The Go button makes the choice explicit.
 *
 * The range
 *   2000 to currentFiscalYear(), ascending. These are valid fiscal years, not
 *   years that have rows. A year with no rows gets a correct 404 and this page,
 *   so the picker never has to know what the API holds. Do not ask the API for
 *   the list: that would be a third contract for one number.
 *
 * The select always shows the placeholder
 *   The value is local state, initialised to "". It is never seeded from
 *   fiscalYear, because this is an action ("go to a year"), not a status display
 *   of the current one. The heading shows the current year. Two consequences:
 *   no out-of-range matching problem when the URL names a year above the range,
 *   and no draft to reconcile with the route.
 *
 * Submit
 *   On submit: navigate(`/dashboard/${draft}`) with { replace: false }, so a year
 *   change is a real navigation and Back returns to the previous year. Then set
 *   the draft back to "". The component stays mounted across /dashboard/2025 ->
 *   /dashboard/2023, so without the reset the next empty page would show the
 *   previous pick, which contradicts the always-placeholder rule.
 *   If draft equals fiscalYear, skip the navigation and still reset the draft.
 *   Picking 2025 while on 2025 must not push a duplicate history entry.
 *
 * Why a link, not a Back button
 *   Whether the previous history entry is in-app is not detectable. history.length
 *   counts other sites' entries, and document.referrer is often stripped. A link
 *   to "/" always works, and "/" redirects to /dashboard/2024.
 *
 * Acceptance
 *   - /dashboard/2025 renders "No data for fiscal year 2025".
 *   - The select shows "Select a fiscal year" and Go is disabled.
 *   - Choosing 2024 enables Go; submitting navigates to /dashboard/2024.
 *   - Submitting 2025 while on /dashboard/2025 pushes no history entry and
 *     resets the select to the placeholder.
 *   - The select resets to the placeholder on every submit, including when the
 *     navigation moves to another empty year.
 *   - Enter in the select submits the form.
 *   - The link to "/" works from the keyboard.
 *   - 375px: heading, form and link fit without horizontal scrolling.
 *
 * Edge cases
 *   - currentFiscalYear() is 2024 in January 2025. The range ends there, not at
 *     the calendar year.
 *   - An option list of 25+ years is long but not unusable in a native select.
 *     No custom listbox.
 *   - The placeholder is disabled, not hidden. Support for hiding one option is
 *     patchy, and a disabled option can still be the displayed one.
 *
 * Tests
 *   Playwright: the empty heading, the disabled Go, the navigation on submit, the
 *   no-op submit on the same year, and the reset to the placeholder.
 *
 * Delete this comment when the code is in place.
 */
export type NoDataProps = {
  fiscalYear: number;
};

export default function NoData(_props: NoDataProps) {
  return null;
}
