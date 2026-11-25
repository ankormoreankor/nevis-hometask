import type { TreeNode } from "@nevis/shared";
import { formatMonthLabel, formatPeriod } from "@/lib/period";
import { childrenOf } from "@/lib/tree";

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

// The colour follows the position in the stack, not the entity.
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

// The axis comes from the stack, and at May 2024 the company row says 301
// while its branches stack to 279.
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

export type ScopeBreakdown = "branch" | "adviser" | "channel";

export function scopeBreakdown(node: TreeNode): ScopeBreakdown | null {
  if (childrenOf(node).length === 0) {
    return null;
  }

  if ("branches" in node) {
    return "branch";
  }
  if ("employees" in node) {
    return "adviser";
  }
  if ("channels" in node) {
    return "channel";
  }

  return null;
}

export function scopeTitle(node: TreeNode): string {
  const breakdown = scopeBreakdown(node);
  return breakdown ? `${node.name}, by ${breakdown}` : node.name;
}

// Recharts draws nothing for a zero, so the last series is not always the
// visible top.
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
