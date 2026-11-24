import type { TreeNode } from "@nevis/shared";
import { cn } from "cn";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  Rectangle,
  type TickItem,
  useXAxisTicks,
  useYAxisTicks,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  type ChartRow,
  type ChartSeries,
  toDomain,
  toRows,
  toSeries,
  toTopSeries,
} from "@/lib/chart";
import { formatPeriod } from "@/lib/period";
import { useMediaQuery } from "@/lib/useMediaQuery";

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
  labelledById: string;
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
      onAnnounce("");
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

function TicksBridge({
  ticksRef,
  narrow,
}: {
  ticksRef: React.RefObject<ReadonlyArray<TickItem>>;
  narrow: boolean;
}) {
  const xAxisTicks = useXAxisTicks();
  const yAxisTicks = useYAxisTicks();
  useEffect(() => {
    const activeTicks = narrow ? yAxisTicks : xAxisTicks;
    if (activeTicks && activeTicks.length > 0) {
      ticksRef.current = activeTicks;
    } else if (xAxisTicks && xAxisTicks.length > 0) {
      ticksRef.current = xAxisTicks;
    } else if (yAxisTicks && yAxisTicks.length > 0) {
      ticksRef.current = yAxisTicks;
    }
  }, [narrow, xAxisTicks, yAxisTicks, ticksRef]);

  return null;
}

export default function MonthlyChart({
  node,
  fiscalYear,
  labelledById,
  className,
}: MonthlyChartProps) {
  const [announcement, setAnnouncement] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const series = useMemo(() => toSeries(node), [node]);
  const rows = useMemo(() => toRows(series, fiscalYear), [series, fiscalYear]);
  const domain = useMemo(() => toDomain(series), [series]);
  const tops = useMemo(() => toTopSeries(series), [series]);
  const reducedMotion = usePrefersReducedMotion();

  // 639 is Tailwind's sm (640) minus one, so the CSS breakpoints and the hook agree.
  const narrow = useMediaQuery("(max-width: 639px)");

  const surface = useRef<SVGSVGElement | null>(null);
  const ticks = useRef<ReadonlyArray<TickItem>>([]);
  const retryRef = useRef<number | null>(null);

  function showMonth(index: number | null) {
    if (retryRef.current !== null) {
      cancelAnimationFrame(retryRef.current);
      retryRef.current = null;
    }
    const svg = surface.current;
    if (!svg) return;
    if (index === null) {
      svg.dispatchEvent(
        new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }),
      );
      return;
    }
    const point = ticks.current[index];
    if (!point) {
      retryRef.current = requestAnimationFrame(() => {
        retryRef.current = null;
        const retryPoint = ticks.current[index];
        const currentSvg = surface.current;
        if (!retryPoint || !currentSvg) return;
        const rect = currentSvg.getBoundingClientRect();
        currentSvg.dispatchEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            clientX: narrow ? rect.left + rect.width / 2 : rect.left + retryPoint.coordinate,
            clientY: narrow ? rect.top + retryPoint.coordinate : rect.top + rect.height / 2,
          }),
        );
      });
      return;
    }
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        clientX: narrow ? rect.left + rect.width / 2 : rect.left + point.coordinate,
        clientY: narrow ? rect.top + point.coordinate : rect.top + rect.height / 2,
      }),
    );
  }

  useEffect(() => {
    return () => {
      if (retryRef.current !== null) {
        cancelAnimationFrame(retryRef.current);
      }
    };
  }, []);

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    setActiveIndex(0);
    showMonth(0);
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    setActiveIndex(null);
    showMonth(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (activeIndex === null) {
      return;
    }
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = Math.min(activeIndex + 1, rows.length - 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = Math.max(activeIndex - 1, 0);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = rows.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveIndex(nextIndex);
      showMonth(nextIndex);
    }
  };

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
  const yTicks = useMemo(() => {
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

  return (
    <figure className={cn("m-0 flex flex-col gap-4", className)} aria-labelledby={labelledById}>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
      {/*
        Recharts puts tabindex="-1" on its z-index layer, a bar click focuses it,
        and the browser outlines the group around the plot.
      */}
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
        <BarChart
          ref={surface}
          accessibilityLayer={false}
          throttleDelay={0}
          layout={narrow ? "vertical" : "horizontal"}
          data={rows}
          desc={description}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <TicksBridge ticksRef={ticks} narrow={narrow} />
          <CartesianGrid
            vertical={narrow}
            horizontal={!narrow}
            stroke="#ccc"
            strokeDasharray="3 3"
          />
          {narrow ? (
            <>
              <XAxis
                type="number"
                domain={[0, axisMax]}
                ticks={yTicks}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="month"
                // The tick label wraps to "Feb" over "2024", so the axis only
                // has to fit the wider of the two.
                width={40}
                interval={0}
                tickLine={false}
                axisLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="month"
                interval="preserveStartEnd"
                minTickGap={24}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, axisMax]}
                ticks={yTicks}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={44}
              />
            </>
          )}
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={
              <MonthlyChartTooltip series={series} onAnnounce={setAnnouncement} indicator="dot" />
            }
          />
          {/*
            Scope identity is in the key to force Bar remounting across node and year changes.
            A custom shape means Recharts no longer filters zero-height rectangles, so the
            interpolated arrays stay the same length, but remounting is still what makes a new
            scope grow from the baseline instead of sliding sideways.

            The radius is chosen per rectangle and per month via toTopSeries: the segment that
            tops a column changes from month to month and Recharts draws no rectangle for a zero,
            so a radius fixed on the last series would leave those columns square. Rendering
            Rectangle inside the shape prop keeps the top corners rounded throughout the grow
            animation without clipping.
          */}
          {series.map((item) => (
            <Bar
              key={`${node.id}-${fiscalYear}-${item.key}`}
              dataKey={item.key}
              name={item.label}
              stackId={STACK_ID}
              fill={`var(--color-${item.key})`}
              maxBarSize={narrow ? 20 : 88}
              isAnimationActive={!reducedMotion}
              shape={(rect: BarShapeProps) => (
                <Rectangle
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={`var(--color-${item.key})`}
                  radius={
                    tops[rect.originalDataIndex] === item.key
                      ? narrow
                        ? [0, 4, 4, 0]
                        : [4, 4, 0, 0]
                      : 0
                  }
                />
              )}
            />
          ))}
        </BarChart>
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
