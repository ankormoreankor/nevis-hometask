import { Table } from "@/components/ui/table";

/**
 * TASK: the month table as an accessible treegrid, one level at a time
 *
 * Goal
 *   Render the company > branch > adviser > channel tree as one table with
 *   twelve month columns. The first paint holds the company and its branches;
 *   deeper levels load when a row opens. Keyboard operation and the hierarchy
 *   announcement are graded by the brief, so the ARIA layer is part of the
 *   contract, not a polish pass.
 *
 * Contract
 *   export type TreeGridProps = {
 *     company: NodeSummary
 *     branches: NodeSummary[]
 *     simulate?: Simulate
 *     caption?: string
 *     className?: string
 *   }
 *   export default function TreeGrid(props: TreeGridProps)
 *
 *   NodeSummary, MONTHS from "@nevis/shared". Simulate and useChildren from
 *   "@/lib/api". shadcn Table primitives from "@/components/ui/table"; its
 *   container already scrolls horizontally, which is what 375px needs.
 *
 * Data
 *   The root row is `company` and its children are the `branches` prop. The root
 *   never fetches: its level arrived with the dashboard response.
 *   Every deeper row is a TreeRow component that calls
 *   useChildren(expanded ? node.id : null, simulate). Only expanded rows
 *   subscribe, and each node has its own cache key, so two open branches hold
 *   two independent requests and two independent error states.
 *   hasChildren decides the chevron. A leaf gets no chevron, no aria-expanded
 *   and no request. Channels are always leaves.
 *
 * Markup
 *   <table role="treegrid" aria-label={caption}>, default caption
 *   "Monthly figures by branch, adviser and acquisition channel".
 *   Header row: a visually hidden "Name" in the first th, then the twelve month
 *   labels from MONTHS, formatted with Intl.DateTimeFormat, month: "short",
 *   year: "numeric", timeZone: "UTC", so MONTHS[i] reads "Feb 2024".
 *   Body rows: role="row", aria-level 1-4, aria-posinset and aria-setsize
 *   relative to the siblings currently loaded, aria-expanded only on rows with
 *   children. Cells: role="gridcell". Month cells hold values[i] unchanged,
 *   right-aligned, tabular figures. No totals column and no derived sums.
 *
 * Expansion
 *   Expansion is a Set of node ids in this file. No URL state, no controlled
 *   prop. Company starts expanded, everything else collapsed.
 *   Toggling open sets aria-expanded="true" and aria-busy="true" on the row and
 *   renders one placeholder row directly beneath it: 13 cells, a skeleton bar in
 *   the first, aria-hidden="true" on the row so assistive tech does not read
 *   empty cells. The chevron stays mounted and becomes a spinner; do not swap
 *   the button element, or focus dies.
 *   The skeleton shows only when isLoading is true, meaning the key has no
 *   cache. On a re-expand the cached children render immediately.
 *   A failed request sets aria-expanded back to "false", removes the placeholder
 *   and renders the message inside the row's name cell, after the name. The row
 *   keeps the single focus model: Enter retries, and a Retry button in the cell
 *   is pointer-only with tabIndex={-1}. No second tab stop, no error child row
 *   that would need a level and a position in the sibling set.
 *
 * Cache
 *   Children live in SWR, not in React state. Collapsing unmounts the rows and
 *   leaves the cache entry alone, so re-expanding is instant and sends no
 *   request. Do not copy children into useState: that is a second cache to
 *   invalidate.
 *
 * Chevron
 *   A <button type="button" tabIndex={-1}> in the first cell, accessible name
 *   "Expand {name}" or "Collapse {name}". Pointer-only: aria-expanded lives on
 *   the row, never on the button. Hit area at least 32x32px, icon 16px.
 *   Adviser rows also show a 24px circular avatar before the name. The payload
 *   has no image field, so the avatar is initials on a token background, empty
 *   alt because the name is adjacent, no layout shift. Branch and company rows
 *   have no avatar, channel rows have neither avatar nor chevron.
 *
 * Keyboard, APG treegrid, rows-first model
 *   Tab          enters at the focused row, then leaves the grid.
 *   ArrowDown    next visible row.
 *   ArrowUp      previous visible row.
 *   ArrowRight   collapsed parent expands; expanded parent moves to its first
 *                loaded child; leaf does nothing.
 *   ArrowLeft    expanded parent collapses; otherwise moves to the parent row.
 *   Home / End   first / last visible row.
 *   Enter/Space  toggle the focused row when it has children; on an error row,
 *                retry.
 *   Roving tabindex: exactly one row has tabIndex={0}, every other -1.
 *   Focus stays on the parent after expanding. Collapsing a row that contains
 *   focus moves focus to that row before the children leave the DOM.
 *   Rows are keyed by node id, never by index, or an insert remounts the row and
 *   drops focus.
 *
 * Styling
 *   shadcn Table adjusted to design/table.png (node 1:2901, collapsed 0:1492,
 *   branch open 0:1498, adviser open 0:1450): 56px rows, no vertical rules, one
 *   1px rule between rows, name column about 296px at 1408 width, month columns
 *   share the rest and right-align their header and values. Tokens from
 *   src/index.css only, no hex in this file.
 *
 * Acceptance
 *   - First render: company row expanded, three branch rows at aria-level 2.
 *   - Expanding Branch 1 shows the skeleton row, then five adviser rows at
 *     aria-level 3, and one request to /api/nodes/<id>/children.
 *   - Collapsing and re-expanding Branch 1 renders the same rows with no second
 *     request.
 *   - Expanding Anna Blackwood shows three channel rows at aria-level 4, with no
 *     chevron and no avatar.
 *   - Two branches open at once keep separate loading and error states.
 *   - A 404 on one branch shows the message in that row; the rest of the table
 *     still works.
 *   - ArrowDown from the company row reaches Branch 1, not a hidden child.
 *   - ArrowLeft on an adviser row focuses Branch 1; ArrowLeft on Branch 1
 *     collapses it and keeps focus there.
 *   - The DOM has exactly one row with tabindex="0" at any time.
 *   - Nothing overflows the viewport at 375px; the table scrolls sideways.
 *
 * Edge cases
 *   - A branch without employees and an advisor without channels is a leaf:
 *     hasChildren false, no chevron, no request.
 *   - Collapsing the company and expanding it again uses the branches prop. No
 *     request, because the root level is not fetched.
 *   - A slow request that resolves after the row was collapsed must not reopen
 *     it. The expansion state is the source of truth.
 *
 * Tests
 *   none in this file. Playwright covers keyboard expand and collapse,
 *   aria-expanded transitions, focus after insertion, the skeleton row, the
 *   error retry in the row, and the request count on re-expand.
 *
 * Delete this comment when the code is in place.
 */
export default function TreeGrid() {
  return <Table />;
}
