import { ChartContainer } from "@/components/ui/chart";

/**
 * TASK: the stacked monthly chart, built on the shadcn Chart component
 *
 * Goal
 *   One stacked bar per month, Feb 2024 to Jan 2025, from the branches prop,
 *   with a keyboard and screen-reader path that does not depend on seeing
 *   colour. The treegrid below holds the same figures and is the accessible
 *   alternative.
 *
 * Contract
 *   export type MonthlyChartProps = {
 *     branches: NodeSummary[]
 *     className?: string
 *   }
 *   export default function MonthlyChart(props: MonthlyChartProps)
 *
 *   NodeSummary and MONTHS come from "@nevis/shared". Primitives come from
 *   "@/components/ui/chart": ChartContainer, ChartTooltip, ChartTooltipContent,
 *   ChartLegend, ChartLegendContent. Recharts pieces come from "recharts".
 *
 * Series
 *   Stack the three branches. Branch values sum to the company row in every
 *   month except May, while the design's channel legend is illustrative:
 *   channels exist under one adviser and reach 27 against a company bar of 350.
 *   So the stack is the `branches` prop, bottom to top in array order, and the
 *   legend names the branches.
 *   The chart is fixed at company level. Expanding a row in the treegrid does
 *   not change it, and the branches arrive with the dashboard response, so the
 *   chart never fetches on its own.
 *   Data rows: { month, branch1, branch2, branch3 }, where branchN is
 *   branches[N-1].values[i]. Month i is MONTHS[i], formatted like the
 *   treegrid. If the array holds fewer than three branches, render what exists.
 *   ChartConfig: key branch1..3, label = the branch name, color
 *   var(--chart-N). Set --chart-1/2/3 in src/index.css to the design palette,
 *   in order #B29DF8, #F4BEB4, #A75E6E. Position decides the colour, so the
 *   palette survives a branch rename.
 *
 * Axes and marks
 *   Y: domain [0, 400], ticks 0/100/200/300/400, no axis line, no tick marks,
 *   horizontal dashed gridlines only (CartesianGrid vertical={false}).
 *   X: month labels with interval="preserveStartEnd" and minTickGap={24}, so
 *   all twelve fit at 1408 and thin out instead of overlapping at 375.
 *   tickLine={false}, axisLine={false}.
 *   Bars: stackId on all three, maxBarSize 88, only the top series gets
 *   radius={[4, 4, 0, 0]}. The design's bars drift from its own table by up to
 *   12 units, so match the treatment and never hardcode a value.
 *   Height 430px at the 1408px design width, full width of its column.
 *
 * Accessibility
 *   Wrap in <figure> with <figcaption>: "Stacked monthly figures by branch,
 *   Feb 2024 to Jan 2025. The same numbers are in the table below." Do not rely
 *   on the caption to name the chart; a label on the wrapping div does not reach
 *   the svg.
 *   Pass accessibilityLayer explicitly on BarChart even though Recharts 3
 *   defaults it on: the README says it is intentional, and the next Recharts
 *   upgrade should not change it silently.
 *   Pass title and desc to BarChart. Recharts renders them as <title> and
 *   <desc> inside the svg, which names the application surface. The chart is
 *   role="application" and keyboard-focusable through accessibilityLayer, so do
 *   not add role="img" or aria-hidden.
 *   Arrow Left and Right step through the months, and Recharts marks the tooltip
 *   aria-live="assertive", so every stop is announced. Keep the tooltip to the
 *   month and one line per branch. ChartTooltipContent does not render a total,
 *   and the table below has the totals, so do not add one.
 *   Reduced motion: gate isAnimationActive on
 *   matchMedia("(prefers-reduced-motion: reduce)"), read in this file. No new
 *   hook file yet.
 *
 * Styling
 *   ChartContainer className="h-[430px] w-full". Legend centred under the plot,
 *   ChartLegendContent with no icon, dot indicators in the tooltip. Tokens from
 *   src/index.css, no hex in this file beyond the three token values above.
 *
 * Acceptance
 *   - Feb 2024 renders three stacked segments whose heights are 147, 76 and 27,
 *     summing to 250, the company value for that month.
 *   - The legend lists the three branch names from the branches prop.
 *   - Tab reaches the chart once; ArrowRight moves the tooltip to Mar 2024 and
 *     the announced text contains the month and three branch names.
 *   - With reduced motion set, no bar animates on mount.
 *   - At 375px the chart fits the column, labels thin out, nothing clips.
 *   - The figcaption states that the table below holds the same figures.
 *
 * Edge cases
 *   - The payload has no zeros, so the top series can carry the rounded corners.
 *     A zero in Branch 3 for a month would show a square edge there; that is
 *     the point to add a custom bar shape rather than pre-build one.
 *   - The fixed 0-400 domain keeps the design's gridlines. If a stacked total
 *     ever exceeds 400 the bar clips, which is the moment to derive the domain
 *     from the maximum instead.
 *   - Reduced motion is a media query, not a state toggle; it must also apply
 *     when the preference changes while the page is open.
 *
 * Tests
 *   none in this file. The chart mapping test covers payload values to segment
 *   heights and the axis maximum.
 *
 * Delete this comment when the code is in place.
 */
export default function MonthlyChart() {
  return (
    <ChartContainer config={{}} className="h-[430px] w-full">
      {null}
    </ChartContainer>
  );
}
