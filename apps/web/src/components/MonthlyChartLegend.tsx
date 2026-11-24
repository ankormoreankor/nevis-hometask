import { cn } from "cn";
import type { ChartSeries } from "@/lib/chart";

export type MonthlyChartLegendProps = {
  series: ChartSeries[];
  className?: string;
};

export function MonthlyChartLegend({ series, className }: MonthlyChartLegendProps) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground",
        className,
      )}
    >
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
  );
}
