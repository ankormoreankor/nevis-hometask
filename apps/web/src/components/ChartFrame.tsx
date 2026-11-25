import { cn } from "cn";
import { MonthlyChartLegend } from "@/components/MonthlyChartLegend";
import type { ChartSeries } from "@/lib/chart";

// Chart and placeholder share this box, so the swap causes no layout shift.

const PLOT_AREA_CLASS = "h-[440px] sm:h-[390px] w-full";

export type ChartFrameProps = {
  series: ChartSeries[];
  labelledById: string;
  className?: string;
  children: (plotClassName: string) => React.ReactNode;
};

export function ChartFrame({ series, labelledById, className, children }: ChartFrameProps) {
  return (
    <figure className={cn("m-0 flex flex-col gap-4", className)} aria-labelledby={labelledById}>
      {children(PLOT_AREA_CLASS)}
      <MonthlyChartLegend series={series} />
    </figure>
  );
}
