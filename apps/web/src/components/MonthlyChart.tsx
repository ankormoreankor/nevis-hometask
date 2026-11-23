import type { TreeNode } from "@nevis/shared";
import { cn } from "cn";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, type TickItem, useXAxisTicks, XAxis, YAxis } from "recharts";
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

function XAxisTicksBridge({ ticksRef }: { ticksRef: React.RefObject<ReadonlyArray<TickItem>> }) {
  const xAxisTicks = useXAxisTicks();
  useEffect(() => {
    if (xAxisTicks) {
      ticksRef.current = xAxisTicks;
    }
  }, [xAxisTicks, ticksRef]);

  return null;
}

export default function MonthlyChart({ node, fiscalYear, className }: MonthlyChartProps) {
  const [announcement, setAnnouncement] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const series = useMemo(() => toSeries(node), [node]);
  const rows = useMemo(() => toRows(series, fiscalYear), [series, fiscalYear]);
  const domain = useMemo(() => toDomain(series), [series]);
  const title = useMemo(() => scopeTitle(node), [node]);
  const reducedMotion = usePrefersReducedMotion();

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
            clientX: rect.left + retryPoint.coordinate,
            clientY: rect.top + rect.height / 2,
          }),
        );
      });
      return;
    }
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        clientX: rect.left + point.coordinate,
        clientY: rect.top + rect.height / 2,
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
    if (event.key === "ArrowRight") {
      nextIndex = Math.min(activeIndex + 1, rows.length - 1);
    } else if (event.key === "ArrowLeft") {
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
      <ChartContainer
        config={config}
        className="h-[430px] w-full focus-visible:outline-hidden"
        tabIndex={0}
        role="application"
        aria-labelledby={titleId}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        <BarChart
          ref={surface}
          accessibilityLayer={false}
          throttleDelay={0}
          data={rows}
          title={title}
          desc={description}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <XAxisTicksBridge ticksRef={ticks} />
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
            ticks={yTicks}
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
          {/*
            Scope identity is in the key to force Bar remounting across node and year changes.
            Recharts interpolates rectangles by array index rather than by month. Zero-value
            filtering omits zero-height rectangles, so different scopes produce different
            array lengths and cause horizontal sliding when previous rectangles are reused.
            Remounting resets the Recharts rectangle cache so columns animate vertically from baseline.
          */}
          {series.map((item, index) => (
            <Bar
              key={`${node.id}-${fiscalYear}-${item.key}`}
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
