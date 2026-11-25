import { useEffect } from "react";
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
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartRow, ChartSeries } from "@/lib/chart";

// Must render inside ChartContainer for tooltip context and --color-* variables.

const STACK_ID = "book";

function TicksBridge({
  ticksRef,
  narrow,
}: {
  ticksRef: React.RefObject<ReadonlyArray<TickItem>>;
  narrow: boolean;
}) {
  const xAxisTicks = useXAxisTicks();
  const yAxisTicks = useYAxisTicks();

  // Hands tick coordinates up so the hook can drive the tooltip by position.
  useEffect(() => {
    const candidates = narrow ? [yAxisTicks, xAxisTicks] : [xAxisTicks, yAxisTicks];
    const match = candidates.find((ticks) => ticks && ticks.length > 0);
    if (match) {
      ticksRef.current = match;
    }
  }, [narrow, xAxisTicks, yAxisTicks, ticksRef]);

  return null;
}

type MonthlyChartTooltipProps = React.ComponentProps<typeof ChartTooltipContent> & {
  series: ChartSeries[];
  onAnnounce: (text: string) => void;
};

function seriesPart(row: ChartRow, item: ChartSeries): string | null {
  const value = row[item.key];
  return value !== undefined ? `${item.label} ${value}` : null;
}

function resolveTooltipMonth(label: React.ReactNode, fallback: string): string {
  return typeof label === "string" && label ? label : fallback;
}

function resolveTooltipRow(payload: readonly unknown[]): ChartRow | undefined {
  if (payload.length === 0) {
    return undefined;
  }
  // SAFETY: Recharts hands the custom tooltip the row object it was given, and ChartPlot is the
  // only producer of those rows.
  const item = payload[0] as { payload?: unknown } | undefined;
  // SAFETY: ChartPlot is the only producer of the row objects passed into Recharts.
  return item ? (item.payload as ChartRow | undefined) : undefined;
}

function formatTooltipText(
  label: React.ReactNode,
  payload: readonly unknown[],
  series: ChartSeries[],
): string {
  const row = resolveTooltipRow(payload);
  if (!row) {
    return "";
  }
  const month = resolveTooltipMonth(label, row.month);
  const parts: string[] = [];
  for (const item of series) {
    const part = seriesPart(row, item);
    if (part !== null) {
      parts.push(part);
    }
  }
  return `${[month, ...parts].join(". ")}.`;
}

function hasTooltipPayload(active?: boolean, payload?: readonly unknown[]): boolean {
  return Boolean(active && payload && payload.length > 0);
}

function announceTooltip(
  active: boolean | undefined,
  payload: readonly unknown[] | undefined,
  label: React.ReactNode,
  series: ChartSeries[],
  onAnnounce: (text: string) => void,
) {
  if (!hasTooltipPayload(active, payload)) {
    onAnnounce("");
    return;
  }
  const text = formatTooltipText(label, payload ?? [], series);
  onAnnounce(text);
}

function MonthlyChartTooltip({
  active,
  payload,
  label,
  series,
  onAnnounce,
}: MonthlyChartTooltipProps) {
  // Clears the live region when the tooltip unmounts.
  useEffect(() => {
    return () => {
      onAnnounce("");
    };
  }, [onAnnounce]);

  // Live region reads whatever the tooltip shows.
  useEffect(() => {
    announceTooltip(active, payload, label, series, onAnnounce);
  }, [active, payload, label, series, onAnnounce]);

  if (!active || !payload?.length) {
    return null;
  }

  return <ChartTooltipContent active={active} payload={payload} label={label} indicator="dot" />;
}

function ChartAxes({
  narrow,
  axisMax,
  yTicks,
}: {
  narrow: boolean;
  axisMax: number;
  yTicks: number[];
}) {
  if (narrow) {
    return (
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
          // Tick wraps "Feb" over "2024", so width fits the wider line.
          width={40}
          interval={0}
          tickLine={false}
          axisLine={false}
        />
      </>
    );
  }

  return (
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
  );
}

function computeRadius(isTop: boolean, narrow: boolean): [number, number, number, number] | 0 {
  if (!isTop) {
    return 0;
  }
  return narrow ? [0, 4, 4, 0] : [4, 4, 0, 0];
}

function ChartBars({
  series,
  tops,
  scopeKey,
  narrow,
  reducedMotion,
}: {
  series: ChartSeries[];
  tops: (string | null)[];
  scopeKey: string;
  narrow: boolean;
  reducedMotion: boolean;
}) {
  // Scope and year are in the key so a new scope grows from the baseline.
  // Radius uses toTopSeries per month because Recharts draws nothing for zero.
  return series.map((item) => (
    <Bar
      key={`${scopeKey}-${item.key}`}
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
          radius={computeRadius(tops[rect.originalDataIndex] === item.key, narrow)}
        />
      )}
    />
  ));
}

export type ChartPlotData = {
  rows: ChartRow[];
  series: ChartSeries[];
  tops: (string | null)[];
  axisMax: number;
  yTicks: number[];
  description: string;
};

export type ChartPlotProps = {
  data: ChartPlotData;
  scopeKey: string;
  surface: React.RefObject<SVGSVGElement | null>;
  ticks: React.RefObject<ReadonlyArray<TickItem>>;
  narrow: boolean;
  reducedMotion: boolean;
  onAnnounce: (text: string) => void;
};

export function ChartPlot({
  data: { rows, series, tops, axisMax, yTicks, description },
  scopeKey,
  surface,
  ticks,
  narrow,
  reducedMotion,
  onAnnounce,
}: ChartPlotProps) {
  return (
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
      <CartesianGrid vertical={narrow} horizontal={!narrow} stroke="#ccc" strokeDasharray="3 3" />
      <ChartAxes narrow={narrow} axisMax={axisMax} yTicks={yTicks} />
      <ChartTooltip
        cursor={{ fill: "var(--muted)" }}
        content={<MonthlyChartTooltip series={series} onAnnounce={onAnnounce} />}
      />
      <ChartBars
        series={series}
        tops={tops}
        scopeKey={scopeKey}
        narrow={narrow}
        reducedMotion={reducedMotion}
      />
    </BarChart>
  );
}
