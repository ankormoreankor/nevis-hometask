import type { TreeNode } from "@nevis/shared";
import { formatMonthLabel, formatPeriod } from "@/lib/period";
import { childrenOf } from "@/lib/tree";

/**
 * The chart mapping, from a node to the data the chart draws.
 *
 * Four pure functions that turn a node into a stacked chart: the series, the
 * rows per month, the axis domain and the scope title. No React, no
 * formatting, no state.
 *
 * The brief grades how the data maps into the chart, so the mapping is the
 * part that has to be right, and it is the part that is easiest to test once
 * it is a function instead of a component.
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

const MONTH_COUNT = 12;

/**
 * The series of a node, in the order they stack, bottom to top.
 *
 * A node with children stacks them, and a leaf is one series of its own. The
 * values are the payload's own twelve numbers: no sums, no corrections, no
 * rounding. A company with no branches takes the leaf path, so the chart
 * never assumes three series.
 *
 * The colour follows the position in the stack, not the entity, so a rename
 * does not reshuffle the palette. The scope title carries the meaning.
 */
export function toSeries(node: TreeNode): ChartSeries[] {
  const children = childrenOf(node);

  if (children.length === 0) {
    return [{ key: "s0", label: node.name, values: node.values, color: "var(--chart-1)" }];
  }

  return children.map((child, index) => ({
    key: `s${index}`,
    label: child.name,
    values: child.values,
    color: `var(--chart-${index + 1})`,
  }));
}

/**
 * One row per month, keyed by the position of the series.
 *
 * Two children can share a name and the chart still stacks them separately.
 * A series with fewer than twelve months contributes nothing for the missing
 * ones; the payload always has twelve, so that is defensive.
 */
export function toRows(series: ChartSeries[], fiscalYear: number): ChartRow[] {
  const rows: ChartRow[] = [];

  for (let index = 0; index < MONTH_COUNT; index += 1) {
    const row: ChartRow = { month: formatMonthLabel(fiscalYear, index) };

    for (const item of series) {
      const value = item.values[index];
      if (value !== undefined) {
        row[item.key] = value;
      }
    }

    rows.push(row);
  }

  return rows;
}

/**
 * The axis maximum: the largest stacked month, rounded up.
 *
 * The domain comes from the stack, not from the node's own values. At May
 * 2024 the company row says 301 and its branches stack to 279, and the axis
 * has to fit the bars.
 *
 * The company stacks to 350 at Aug 2024 and at Jan 2025, which rounds to 400.
 * Branch 1 stacks its advisers to 216 at Aug 2024, which rounds to 300. Anna
 * Blackwood stacks her channels to 38 at Jan 2025, which rounds to 40.
 */
export function toDomain(series: ChartSeries[]): number {
  let maximum = 0;

  for (let index = 0; index < MONTH_COUNT; index += 1) {
    let total = 0;
    for (const item of series) {
      total += item.values[index] ?? 0;
    }
    if (total > maximum) {
      maximum = total;
    }
  }

  if (maximum === 0) {
    return 0;
  }

  const step = maximum >= 100 ? 100 : 10;

  return Math.ceil(maximum / step) * step;
}

/**
 * The title above the plot, naming the node and what it is broken down by.
 *
 * The word follows the kind of the node, not its level, so a branch reads "by
 * adviser" and an adviser reads "by channel". A leaf has nothing below it and
 * is named on its own.
 */
export function scopeTitle(node: TreeNode): string {
  if (childrenOf(node).length === 0) {
    return node.name;
  }

  if ("branches" in node) {
    return `${node.name}, by branch`;
  }
  if ("employees" in node) {
    return `${node.name}, by adviser`;
  }
  if ("channels" in node) {
    return `${node.name}, by channel`;
  }

  return node.name;
}

/**
 * The key of the series that tops each month in the stack.
 *
 * Recharts draws nothing for a zero, so the last series in stack order is not
 * always the visible top, and the chart asks this helper which segment tops
 * each month so only the topmost visible segment gets rounded top corners.
 * Negative values never take the top, and a month where every series is zero
 * returns null.
 */
export function toTopSeries(series: ChartSeries[]): (string | null)[] {
  const tops: (string | null)[] = [];

  for (let monthIndex = 0; monthIndex < MONTH_COUNT; monthIndex += 1) {
    let topKey: string | null = null;
    for (const item of series) {
      const value = item.values[monthIndex];
      if (value !== undefined && value > 0) {
        topKey = item.key;
      }
    }
    tops.push(topKey);
  }

  return tops;
}

/**
 * The ticks for the chart axis.
 *
 * Every hundred above a hundred, every ten below it. Domain <= 0 returns [0].
 */
export function axisTicks(domain: number): number[] {
  if (domain <= 0) {
    return [0];
  }
  const step = domain >= 100 ? 100 : 10;
  const values: number[] = [];
  for (let value = 0; value <= domain; value += step) {
    values.push(value);
  }
  return values;
}

/**
 * An accessible description for the chart figure naming the scope and series split.
 */
export function chartDescription(
  series: ChartSeries[],
  fiscalYear: number,
  fallbackName = "",
): string {
  const period = formatPeriod(fiscalYear);
  if (series.length === 1) {
    return `Bar per month for ${period}, showing ${series[0]?.label ?? fallbackName}.`;
  }
  return `Stacked bar per month for ${period}, split by ${series
    .map((item) => item.label)
    .join(", ")}.`;
}
