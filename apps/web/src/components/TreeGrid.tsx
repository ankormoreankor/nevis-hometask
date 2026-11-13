import { Table } from "@/components/ui/table";

/**
 * TASK: the month table as an accessible treegrid
 *
 * Goal
 *   Render the company > branch > adviser > channel tree as one table with
 *   twelve month columns, expanding one level at a time. Keyboard operation and
 *   the hierarchy announcement are graded by the brief, so the ARIA layer is
 *   part of the contract, not a polish pass.
 *
 * Contract
 *   export type TreeGridProps = {
 *     company: Company
 *     caption?: string
 *     className?: string
 *   }
 *   export default function TreeGrid(props: TreeGridProps)
 *
 *   Company, Branch, Advisor, Channel and MONTHS come from "@nevis/shared".
 *   Use shadcn Table primitives from "@/components/ui/table"; its container
 *   already scrolls horizontally, which is what 375px needs.
 *
 * Markup
 *   <table role="treegrid" aria-label={caption}>, default caption
 *   "Monthly figures by branch, adviser and acquisition channel".
 *   Header row: a visually hidden "Name" in the first th, then the twelve
 *   month labels from MONTHS. Format with Intl.DateTimeFormat, month: "short",
 *   year: "numeric", timeZone: "UTC", so MONTHS[i] reads "Feb 2024".
 *   Every body row: role="row", aria-level 1-4, aria-posinset and aria-setsize
 *   relative to its siblings, and aria-expanded only when the row has children.
 *   Cells: role="gridcell". Month cells hold values[i] unchanged, right-aligned,
 *   tabular figures. No totals column and no derived sums: the payload's own
 *   inconsistencies are documented in the README, not averaged away in the UI.
 *
 * Rows
 *   Level 1 company, 2 branch, 3 adviser, 4 channel.
 *   A branch with no employees and an adviser with no channels is a leaf: no
 *   chevron, no aria-expanded, no invented empty level. Branches 2 and 3 in the
 *   payload are leaves, and so is every adviser except Anna Blackwood.
 *   Visible rows are a depth-first walk over expanded nodes only. Company starts
 *   expanded, everything else collapsed. Expansion state is a Set of node ids
 *   held in this file; no URL state and no controlled prop in this pass.
 *
 * Chevron
 *   A <button type="button" tabIndex={-1}> in the first cell, accessible name
 *   "Expand {name}" or "Collapse {name}". Pointer-only: aria-expanded lives on
 *   the row, never on the button. Hit area at least 32x32px, icon 16px, so the
 *   row height and the visual stay as designed.
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
 *                child; leaf does nothing.
 *   ArrowLeft    expanded parent collapses; otherwise moves to the parent row.
 *   Home / End   first / last visible row.
 *   Enter/Space  toggle the focused row when it has children.
 *   Roving tabindex: exactly one row has tabIndex={0}, every other -1.
 *   Focus stays on the parent after expanding. Collapsing a row that contains
 *   focus moves focus to that row. Rows are removed from the DOM on collapse,
 *   so move focus before the state update or it lands on <body>.
 *
 * Styling
 *   shadcn Table adjusted to design/table.png (node 1:2901, collapsed 0:1492,
 *   branch open 0:1498, adviser open 0:1450): 56px rows, no vertical rules, one
 *   1px rule between rows, name column about 296px at 1408 width, month columns
 *   share the rest and right-align their header and values. Tokens from
 *   src/index.css only, no hex in this file.
 *
 * Acceptance
 *   - The table renders 13 columns and the company row, expanded, with three
 *     branch rows at aria-level 2.
 *   - Expanding Branch 1 inserts five adviser rows at aria-level 3 between it
 *     and Branch 2, and sets aria-expanded="true" on the branch row.
 *   - Expanding Anna Blackwood inserts three channel rows at aria-level 4, with
 *     no chevron and no avatar.
 *   - ArrowDown from the company row reaches Branch 1, not an invisible child.
 *   - ArrowLeft on an adviser row focuses Branch 1; ArrowLeft on Branch 1
 *     collapses it and keeps focus there.
 *   - Tab from the last focused row leaves the table in one press.
 *   - The DOM has exactly one row with tabindex="0" at any time.
 *   - Nothing overflows the viewport at 375px; the table scrolls sideways.
 *
 * Edge cases
 *   - A branch without an employees key must not render a chevron, and neither
 *     must an adviser without channels.
 *   - A collapsed row still announces aria-expanded="false"; a leaf must not
 *     carry the attribute at all.
 *   - Re-collapsing a branch while focus sits inside one of its advisers is the
 *     case that loses focus in most implementations.
 *
 * Tests
 *   none in this file. The Playwright suite covers expand and collapse by
 *   keyboard, aria-expanded transitions, focus return on collapse, and the
 *   branch without employees.
 *
 * Delete this comment when the code is in place.
 */
export default function TreeGrid() {
  return <Table />;
}
