/**
 * TASK: the browser specs for the treegrid keyboard model and the selection
 *
 * Goal
 *   The brief grades the keyboard model, the hierarchy reaching assistive
 *   technology and the selection that remaps the chart. Those belong in a
 *   browser, where the focus ring and the accessibility tree are real.
 *
 * Contract
 *   import { expect, test } from "@playwright/test"
 *
 *   The base URL is http://localhost:5173 and is set in playwright.config.ts,
 *   so page.goto("/dashboard/2024") is enough. The config starts the API and
 *   the dev server, so the spec starts neither.
 *
 *   The table is a <table role="treegrid" aria-label="Monthly figures by branch,
 *   adviser and acquisition channel">. Its rows carry role="row", aria-level
 *   from 1 to 4, aria-posinset and aria-setsize, aria-expanded on the rows
 *   that have children and aria-selected on every row. Exactly one row has
 *   tabindex="0" at a time.
 *
 *   The rows are addressed by their text: the company row reads "Company", the
 *   branch rows read "Branch 1", "Branch 2" and "Branch 3", the adviser rows
 *   read the adviser names, and a channel row reads the channel name.
 *
 *   The chevron is a button with the accessible name "Expand {name}" or
 *   "Collapse {name}". It is not a focus target, so the specs click it by name
 *   and never tab to it.
 *
 *   The rows are reached with the keyboard, so focus the grid first:
 *   await page.getByRole("row", { name: "Company" }).focus()
 *
 *   The chart title is the figcaption of the figure above the table.
 *   scopeTitle(node) reads "Company, by branch", "Branch 1, by adviser" and
 *   "Anna Blackwood, by channel".
 *
 * Acceptance
 *   - The first render shows the company row expanded and selected, and three
 *     branch rows at aria-level 2.
 *   - ArrowRight on a collapsed parent expands it, ArrowRight on an expanded
 *     parent moves to its first child, and ArrowLeft on an expanded parent
 *     collapses it and keeps the focus there.
 *   - ArrowLeft on an adviser row focuses Branch 1.
 *   - Enter on Branch 1 selects it and leaves aria-expanded alone.
 *   - Exactly one row carries aria-selected="true" and exactly one carries
 *     tabindex="0".
 *   - Clicking Branch 1 puts ?node=<id> in the URL and the chart title reads
 *     "Branch 1, by adviser".
 *   - A deep link to a channel opens the company, Branch 1 and Anna Blackwood,
 *     and the channel row is selected.
 *   - At 375px the page does not scroll sideways and the table does.
 *
 * Edge cases
 *   - Focus stays on the row that was toggled, so assert on the focused element
 *     after the key press rather than on the number of rows.
 *   - Rows are keyed by node id, so an insert must not drop the focus.
 *   - The 375px check is on the page, not on the table: the table is allowed to
 *     scroll sideways inside its own container.
 *
 * Tests
 *   none here. This file is the test.
 *
 * Delete this comment when the code is in place.
 */
import { expect, test } from "@playwright/test";

test("the dashboard route resolves", async ({ page }) => {
  await page.goto("/dashboard/2024");
  await expect(page).toHaveURL(/\/dashboard\/2024$/);
});

test.fixme("the treegrid renders the tree", async () => {
  // the assertions belong here
});

test.fixme("the keyboard model", async () => {
  // the assertions belong here
});

test.fixme("the selection remaps the chart", async () => {
  // the assertions belong here
});

test.fixme("the deep link opens the path", async () => {
  // the assertions belong here
});

test.fixme("nothing overflows at 375px", async () => {
  // the assertions belong here
});
