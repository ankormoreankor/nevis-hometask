import type { TreeNode } from "@nevis/shared";
import { cn } from "cn";
import { useEffect, useId, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  type ChartRow,
  type ChartSeries,
  scopeTitle,
  toDomain,
  toRows,
  toSeries,
} from "@/lib/chart";
import { formatPeriod } from "@/lib/period";

/**
 * The stacked monthly chart, built on the shadcn Chart component.
 *
 * One stacked bar per month across the fiscal year in the route, for the
 * selected node, with a keyboard and screen-reader path that does not depend
 * on seeing colour. The treegrid below holds the same figures and is the
 * accessible alternative.
 *
 * The mapping from a node to chart data lives in "@/lib/chart", not in this
 * file. This component renders what that module returns.
 */

export type MonthlyChartProps = {
  node: TreeNode;
  fiscalYear: number;
  className?: string;
};

const STACK_ID = "book";

/**
 * Whether the reader asked for less movement. Recharts animates the bars on
 * mount by default, and the preference is read here rather than in a hook file
 * of its own.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

type MonthlyChartTooltipProps = React.ComponentProps<typeof ChartTooltipContent> & {
  series: ChartSeries[];
  onAnnounce: (text: string) => void;
};

function MonthlyChartTooltip({
  active,
  payload,
  label,
  series,
  onAnnounce,
  ...props
}: MonthlyChartTooltipProps) {
  useEffect(() => {
    return () => {
      onAnnounce("");
    };
  }, [onAnnounce]);

  useEffect(() => {
    if (!active || !payload?.length) {
      return;
    }
    const row = payload[0]?.payload as ChartRow | undefined;
    if (!row) {
      return;
    }
    const month = label ?? row.month;
    const parts = [month];
    for (const item of series) {
      const value = row[item.key];
      if (value !== undefined) {
        parts.push(`${item.label} ${value}`);
      }
    }
    onAnnounce(`${parts.join(". ")}.`);
  }, [active, payload, label, series, onAnnounce]);

  return <ChartTooltipContent active={active} payload={payload} label={label} {...props} />;
}

export default function MonthlyChart({ node, fiscalYear, className }: MonthlyChartProps) {
  const [announcement, setAnnouncement] = useState("");
  const series = useMemo(() => toSeries(node), [node]);
  const rows = useMemo(() => toRows(series, fiscalYear), [series, fiscalYear]);
  const domain = useMemo(() => toDomain(series), [series]);
  const title = useMemo(() => scopeTitle(node), [node]);
  const reducedMotion = usePrefersReducedMotion();

  const config = useMemo<ChartConfig>(() => {
    const next: ChartConfig = {};
    for (const item of series) {
      next[item.key] = { label: item.label, color: item.color };
    }
    return next;
  }, [series]);

  // The axis is drawn from the stack, so a drilled scope is not read against
  // the company scale. The ticks are every hundred above a hundred, every ten
  // below it, and the maximum is never zero, so the plot has a range to draw.
  const axisMax = Math.max(domain, 1);
  const ticks = useMemo(() => {
    if (domain <= 0) {
      return [0];
    }
    const step = domain >= 100 ? 100 : 10;
    const values: number[] = [];
    for (let value = 0; value <= domain; value += step) {
      values.push(value);
    }
    return values;
  }, [domain]);

  const description = useMemo(() => {
    const period = formatPeriod(fiscalYear);
    if (series.length === 1) {
      return `Bar per month for ${period}, showing ${series[0]?.label ?? node.name}.`;
    }
    return `Stacked bar per month for ${period}, split by ${series
      .map((item) => item.label)
      .join(", ")}.`;
  }, [series, fiscalYear, node.name]);

  // The figure is named by the scope title alone. The caption carries the
  // period as well, and a name that read "Company, by branch, Feb 2024 to
  // Jan 2025, the same numbers are in the table below" says less than the
  // title does.
  const titleId = `chart-title-${useId().replace(/:/g, "")}`;

  return (
    <figure className={cn("m-0 flex flex-col gap-4", className)} aria-labelledby={titleId}>
      <figcaption className="flex flex-col gap-1">
        <h2 id={titleId} className="text-base leading-none font-medium">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {formatPeriod(fiscalYear)}. The same numbers are in the table below.
        </p>
      </figcaption>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
      <ChartContainer config={config} className="h-[430px] w-full">
        <BarChart
          accessibilityLayer
          data={rows}
          title={title}
          desc={description}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#ccc" strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            interval="preserveStartEnd"
            minTickGap={24}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, axisMax]}
            ticks={ticks}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={
              <MonthlyChartTooltip series={series} onAnnounce={setAnnouncement} indicator="dot" />
            }
          />
          {series.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stackId={STACK_ID}
              fill={`var(--color-${item.key})`}
              maxBarSize={88}
              radius={index === series.length - 1 ? [4, 4, 0, 0] : undefined}
              isAnimationActive={!reducedMotion}
            />
          ))}
          <ChartLegend
            verticalAlign="bottom"
            align="center"
            content={<ChartLegendContent hideIcon />}
          />
        </BarChart>
      </ChartContainer>
    </figure>
  );
}
