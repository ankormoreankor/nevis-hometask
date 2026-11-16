import { Table } from "@/components/ui/table";
import type { Company } from "@nevis/shared";

/**
 * TASK: the month table as an accessible treegrid
 *
 * Goal
 *   Render the company > branch > adviser > channel tree as one table with
 *   twelve month columns. The whole tree is a prop, so expansion is pure local
 *   state. A row click selects the node and the chart above remaps to it.
 *   Keyboard operation and the hierarchy announcement are graded by the brief,
 *   so the ARIA layer is part of the contract, not a polish pass.
 *
 * Contract
 *   export type TreeGridProps = {
 *     company: Company
 *     selectedId: string
 *     onSelect: (id: string) => void
 *     caption?: string
 *     className?: string
 *   }
 *   export default function TreeGrid(props: TreeGridProps)
 *
 *   Company, MONTHS from "@nevis/shared". childrenOf, hasChildren, ancestorIds
 *   from "@/lib/tree". shadcn Table primitives from "@/components/ui/table";
 *   its container already scrolls horizontally, which is what 375px needs.
 *
 * Data
 *   Everything arrives in the `company` prop. This component fetches nothing and
 *   has no loading or error state of its own. A node with children gets a
 *   chevron, aria-expanded and a child level. A leaf gets none of the three.
 *
 * Markup
 *   <table role="treegrid" aria-label={caption}>, default caption
 *   "Monthly figures by branch, adviser and acquisition channel".
 *   Header row: a visually hidden "Name" in the first th, then the twelve month
 *   labels from MONTHS, formatted with Intl.DateTimeFormat, month: "short",
 *   year: "numeric", timeZone: "UTC", so MONTHS[i] reads "Feb 2024".
 *   Body rows: role="row", aria-level 1-4, aria-posinset and aria-setsize
 *   relative to the siblings currently loaded, aria-expanded only on rows with
 *   children, aria-selected on every row. Cells: role="gridcell". Month cells
 *   hold values[i] unchanged, right-aligned, tabular figures. No totals column
 *   and no derived sums.
 *
 * Selection
 *   A click anywhere on the row calls onSelect(node.id). The selected row gets
 *   aria-selected="true" and a token background. Clicking the selected row again
 *   is a no-op, not a deselect: the chart always has a scope.
 *   Selection and expansion are separate gestures. A row click never expands,
 *   and a chevron click never selects.
 *
 * Expansion
 *   A Set of node ids in this file. The company starts expanded, everything else
 *   collapsed. Toggled by the chevron and by a double-click on the row.
 *   When selectedId changes, every id in ancestorIds(company, selectedId) joins
 *   the set; the selected node itself is never added. That covers a deep link
 *   and Back without making a row click expand anything.
 *   Collapsing never mutates the tree and never touches the selection.
 *
 * Chevron
 *   A <button type="button" tabIndex={-1}> in the first cell, accessible name
 *   "Expand {name}" or "Collapse {name}". Pointer-only: aria-expanded lives on
 *   the row, never on the button. Hit area at least 32x32px, icon 16px. Call
 *   stopPropagation on its click, or the row click also selects.
 *   Adviser rows also show a 24px circular avatar before the name. The payload
 *   has no image field, so the avatar is initials on a token background, empty
 *   alt because the name is adjacent, no layout shift. Branch and company rows
 *   have no avatar, channel rows have neither avatar nor chevron.
 *
 * Keyboard, APG treegrid, rows-first model
 *   Tab          enters at the tab stop, then leaves the grid.
 *   ArrowDown    next visible row.
 *   ArrowUp      previous visible row.
 *   ArrowRight   collapsed parent expands; expanded parent moves to its first
 *                child; leaf does nothing.
 *   ArrowLeft    expanded parent collapses; otherwise moves to the parent row.
 *   Home / End   first / last visible row.
 *   Enter/Space  selects the focused row. That is the row's default action, so
 *                it replaces the old "toggle expansion" binding. Expansion from
 *                the keyboard is Right and Left.
 *   Double-click selects and toggles expansion. Pointer convenience only; every
 *   keyboard path exists without it.
 *   Roving tabindex: exactly one row has tabIndex={0}, every other -1. On load
 *   the tab stop is the selected row, so Tab lands where the URL points;
 *   otherwise it is the company row.
 *   Focus stays on the parent after expanding. Collapsing a row that contains
 *   focus moves focus to that row before the children leave the DOM.
 *   Rows are keyed by node id, never by index, or an insert remounts the row and
 *   drops focus. Do not key the grid itself on selectedId: the URL changes on
 *   every selection, and a remount would drop focus to the body.
 *
 * Deviation from APG, state it in the README
 *   Cells are not focusable, only rows. APG says a treegrid whose cells cannot
 *   be focused should be a tree view, and a treeview with columns is only
 *   advised when the columns fit without horizontal scrolling. Ours scroll at
 *   375px, so this is a deliberate simplification, not a spec-compliant choice.
 *
 * Styling
 *   shadcn Table adjusted to design/table.png (node 1:2901, collapsed 0:1492,
 *   branch open 0:1498, adviser open 0:1450): 56px rows, no vertical rules, one
 *   1px rule between rows, name column about 296px at 1408 width, month columns
 *   share the rest and right-align their header and values. The selected row
 *   needs a background that survives both themes. Tokens from src/index.css
 *   only, no hex in this file.
 *
 * Acceptance
 *   - First render: company row expanded and selected, three branch rows at
 *     aria-level 2.
 *   - Clicking Branch 1 calls onSelect once and does not expand it.
 *   - Clicking the chevron on Branch 1 expands it and leaves the selection
 *     alone. Double-clicking the row does both.
 *   - Expanding Anna Blackwood shows three channel rows at aria-level 4, with no
 *     chevron and no avatar.
 *   - Exactly one row carries aria-selected="true" at any time.
 *   - ArrowDown from the company row reaches Branch 1, not a hidden child.
 *   - ArrowLeft on an adviser row focuses Branch 1; ArrowLeft on Branch 1
 *     collapses it and keeps focus there.
 *   - Enter on Branch 1 selects it and leaves aria-expanded unchanged.
 *   - The DOM has exactly one row with tabindex="0" at any time.
 *   - A deep link to a channel renders the company, Branch 1 and Anna expanded,
 *     the channel row selected, and the channel itself collapsed.
 *   - Nothing overflows the viewport at 375px; the table scrolls sideways.
 *
 * Edge cases
 *   - A branch without employees and an adviser without channels is a leaf:
 *     hasChildren false, no chevron, no aria-expanded. It can still be selected.
 *   - Collapsing the company while a descendant is selected leaves the selection
 *     in place and the row hidden. Re-expanding shows it still selected. Do not
 *     clear the selection on collapse.
 *   - A selected id that is not in the tree cannot reach this component: the
 *     page falls back to the company before rendering.
 *
 * Tests
 *   none in this file. Playwright covers keyboard expand and collapse,
 *   aria-expanded transitions, focus after insertion, aria-selected moving with
 *   the selection, the deep link, and focus surviving a row click.
 *
 * Delete this comment when the code is in place.
 */
export type TreeGridProps = {
  company: Company;
  selectedId: string;
  onSelect: (id: string) => void;
  caption?: string;
  className?: string;
};

export default function TreeGrid(_props: TreeGridProps) {
  return <Table />;
}
