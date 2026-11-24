import type { TreeNode } from "@nevis/shared";
import { cn } from "cn";
import { useMemo, useState } from "react";
import { ChartPlot } from "@/components/ChartPlot";
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

  return (
    <figure className={cn("m-0 flex flex-col gap-4", className)} aria-labelledby={labelledById}>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
      <ChartContainer
        config={config}
        className="h-[440px] sm:h-[390px] w-full focus:outline-hidden [&_g:focus]:outline-none"
        tabIndex={0}
        role="application"
        aria-labelledby={labelledById}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        <ChartPlot
          surface={surface}
          ticks={ticks}
          narrow={narrow}
          rows={rows}
          description={description}
          axisMax={axisMax}
          yTicks={yTicks}
          series={series}
          tops={tops}
          nodeId={node.id}
          fiscalYear={fiscalYear}
          reducedMotion={reducedMotion}
          onAnnounce={setAnnouncement}
        />
      </ChartContainer>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {series.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
