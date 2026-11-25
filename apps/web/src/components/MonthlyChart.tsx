import type { TreeNode } from "@nevis/shared";
import { cn } from "cn";
import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartPlot, type ChartPlotData } from "@/components/ChartPlot";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { axisTicks, chartDescription, toDomain, toRows, toSeries, toTopSeries } from "@/lib/chart";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useMonthHover } from "@/lib/useMonthHover";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * The stacked monthly chart, built on the shadcn Chart component.
 *
 * It stacks the selected node's immediate children with a single series for
 * a leaf. The keyboard and screen-reader path does not depend on seeing colour;
 * the treegrid below holds the same figures and is the accessible alternative.
 *
 * The mapping from a node to chart data lives in "@/lib/chart", not in this
 * file. This component renders what that module returns.
 */

export type MonthlyChartProps = {
  node: TreeNode;
  fiscalYear: number;
  labelledById: string;
  className?: string;
};

export default function MonthlyChart({
  node,
  fiscalYear,
  labelledById,
  className,
}: MonthlyChartProps) {
  const [announcement, setAnnouncement] = useState("");
  const series = useMemo(() => toSeries(node), [node]);
  const rows = useMemo(() => toRows(series, fiscalYear), [series, fiscalYear]);
  const domain = useMemo(() => toDomain(series), [series]);
  const tops = useMemo(() => toTopSeries(series), [series]);
  const reducedMotion = useReducedMotion();
  // 639 is Tailwind's sm (640) minus one, so the CSS breakpoint and the media query hook agree.
  const narrow = useMediaQuery("(max-width: 639px)");

  const { surface, ticks, handleFocus, handleBlur, handleKeyDown } = useMonthHover({
    rowCount: rows.length,
    narrow,
  });

  const config = useMemo<ChartConfig>(() => {
    const next: ChartConfig = {};
    for (const item of series) {
      next[item.key] = { label: item.label, color: item.color };
    }
    return next;
  }, [series]);

  const axisMax = Math.max(domain, 1);
  const yTicks = useMemo(() => axisTicks(domain), [domain]);
  const description = useMemo(
    () => chartDescription(series, fiscalYear, node.name),
    [series, fiscalYear, node.name],
  );
  const plotData = useMemo<ChartPlotData>(
    () => ({ rows, series, tops, axisMax, yTicks, description }),
    [rows, series, tops, axisMax, yTicks, description],
  );

  return (
    <ChartFrame series={series} labelledById={labelledById} className={className}>
      {(plotClassName) => (
        <>
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
          </p>
          <ChartContainer
            config={config}
            className={cn(
              plotClassName,
              "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-2 [&_g:focus]:outline-none",
            )}
            tabIndex={0}
            role="application"
            aria-labelledby={labelledById}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          >
            <ChartPlot
              data={plotData}
              scopeKey={`${node.id}-${fiscalYear}`}
              surface={surface}
              ticks={ticks}
              narrow={narrow}
              reducedMotion={reducedMotion}
              onAnnounce={setAnnouncement}
            />
          </ChartContainer>
        </>
      )}
    </ChartFrame>
  );
}
