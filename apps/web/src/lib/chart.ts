import type { TreeNode } from "@nevis/shared";

/**
 * TASK: the chart mapping, from a node to the data the chart draws
 *
 * Goal
 *   Four pure functions that turn a node into a stacked chart: the series, the
 *   rows per month, the axis domain and the scope title. No React, no
 *   formatting, no state. The brief grades "how the data maps into the chart",
 *   so the mapping is the part that has to be right, and it is the part that
 *   is easiest to test once it is a function instead of a component.
 *
 * Contract
 *   export type ChartSeries = {
 *     key: string
 *     label: string
 *     values: number[]
 *     color: string
 *   }
 *
 *   export type ChartRow = {
 *     month: string
 *     [key: string]: string | number
 *   }
 *
 *   export function toSeries(node: TreeNode): ChartSeries[]
 *   export function toRows(series: ChartSeries[], fiscalYear: number): ChartRow[]
 *   export function toDomain(series: ChartSeries[]): number
 *   export function scopeTitle(node: TreeNode): string
 *
 *   TreeNode from "@nevis/shared". childrenOf from "@/lib/tree".
 *   formatMonthLabel from "@/lib/period".
 *
 * Steps
 *   1. toSeries(node):
 *      - const children = childrenOf(node)
 *      - no children means one series for the node itself:
 *          { key: "s0", label: node.name, values: node.values,
 *            color: "var(--chart-1)" }
 *      - otherwise one series per child, in array order, which is the order
 *        they stack, bottom to top:
 *          { key: `s${i}`, label: child.name, values: child.values,
 *            color: `var(--chart-${i + 1})` }
 *        The values are the child's own twelve numbers, unchanged. No sums, no
 *        corrections, no rounding.
 *      A company with no branches takes the leaf path, so the chart never
 *      assumes three series.
 *   2. toRows(series, fiscalYear):
 *      - twelve rows, one per month.
 *      - month is formatMonthLabel(fiscalYear, i).
 *      - the row carries the month label and one number per series, keyed by
 *        the series key: { month: "Feb 2024", s0: 147, s1: 76, s2: 27 }.
 *      - keyed by position, not by name. Two children can share a name and the
 *        chart still stacks them separately.
 *      - a series with fewer than twelve months contributes nothing for the
 *        missing months. The payload always has twelve, so this is defensive.
 *   3. toDomain(series):
 *      - the stacked maximum: for each month, the sum of that month's numbers
 *        across the series, and then the largest of those twelve sums.
 *      - round up to the next multiple of 100 when the maximum is 100 or more,
 *        and to the next multiple of 10 below that.
 *      - a maximum of 0 stays 0.
 *      - Company gives 400, because its branches stack to 334 in Jul 2024.
 *        Branch 1 gives 300, because its advisers stack to 216 in Aug 2024.
 *        Anna Blackwood gives 40, because her channels stack to 38.
 *      - the domain comes from the stack, not from the node's own values. The
 *        company row says 350 for Aug 2024 and its branches stack to 334, and
 *        the axis has to fit the bars, not the row.
 *   4. scopeTitle(node):
 *      - a company: `${node.name}, by branch`
 *      - a branch: `${node.name}, by adviser`
 *      - an adviser: `${node.name}, by channel`
 *      - a channel, or any other leaf: node.name
 *      - the word follows the kind of the node, not its level, so a branch at
 *        level 2 reads "by adviser" and an adviser at level 3 reads "by
 *        channel".
 *
 * Acceptance
 *   - toSeries(company) has 3 entries labelled Branch 1, Branch 2 and Branch 3,
 *     with the colors var(--chart-1) to var(--chart-3), and their values are
 *     the payload's own arrays.
 *   - toSeries(anna) has 3 entries labelled Existing clients, New organic and
 *     New paid.
 *   - toSeries(branch2) has 1 entry labelled "Branch 2" holding branch2.values.
 *   - toRows(toSeries(company), 2024) has 12 rows, and row 0 is
 *     { month: "Feb 2024", s0: 147, s1: 76, s2: 27 }.
 *   - toRows(toSeries(anna), 2025)[0].month is "Feb 2025".
 *   - toDomain(toSeries(company)) is 400, toDomain(toSeries(branch1)) is 300,
 *     toDomain(toSeries(anna)) is 40.
 *   - scopeTitle(company) is "Company, by branch", scopeTitle(branch1) is
 *     "Branch 1, by adviser", scopeTitle(anna) is "Anna Blackwood, by channel",
 *     scopeTitle(existingClients) is "Existing clients".
 *
 * Edge cases
 *   - A node whose series are all zero gives a domain of 0. The chart renders
 *     an empty plot rather than dividing by it.
 *   - The color index is the position among the series, so it restarts at 1
 *     for every scope. --chart-1 means Branch 1 in the company view and Anna
 *     Blackwood in the Branch 1 view. The scope title carries the meaning, so
 *     the color follows the series rather than the entity.
 *   - The numbers are the payload's numbers. Do not reconcile the mismatches
 *     README.md lists.
 *
 * Tests
 *   vitest for the acceptance lines. No DOM needed.
 *
 * Delete this comment when the code is in place.
 */
export type ChartSeries = {
  key: string;
  label: string;
  values: number[];
  color: string;
};

export type ChartRow = {
  month: string;
  [key: string]: string | number;
};

export function toSeries(_node: TreeNode): ChartSeries[] {
  return [];
}

export function toRows(_series: ChartSeries[], _fiscalYear: number): ChartRow[] {
  return [];
}

export function toDomain(_series: ChartSeries[]): number {
  return 0;
}

export function scopeTitle(_node: TreeNode): string {
  return "";
}
