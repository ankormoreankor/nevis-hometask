import type { TreeNode } from "@nevis/shared";
import { cn } from "cn";
import { useMemo } from "react";
import { MonthlyChartLegend } from "@/components/MonthlyChartLegend";
import { Skeleton } from "@/components/ui/skeleton";
import { toSeries } from "@/lib/chart";

export type MonthlyChartPlaceholderProps = {
  node: TreeNode;
  labelledById: string;
  className?: string;
};

export function MonthlyChartPlaceholder({
  node,
  labelledById,
  className,
}: MonthlyChartPlaceholderProps) {
  const series = useMemo(() => toSeries(node), [node]);

  return (
    <figure className={cn("m-0 flex flex-col gap-4", className)} aria-labelledby={labelledById}>
      <Skeleton aria-hidden="true" className="h-[440px] sm:h-[390px] w-full" />
      <MonthlyChartLegend series={series} />
    </figure>
  );
}
