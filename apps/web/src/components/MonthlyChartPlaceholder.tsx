import type { TreeNode } from "@nevis/shared";
import { useMemo } from "react";
import { ChartFrame } from "@/components/ChartFrame";
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
    <ChartFrame series={series} labelledById={labelledById} className={className}>
      {(plotClassName) => <Skeleton aria-hidden="true" className={plotClassName} />}
    </ChartFrame>
  );
}
