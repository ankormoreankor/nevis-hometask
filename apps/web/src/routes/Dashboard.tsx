import { type Company, isFiscalYear, type TreeNode } from "@nevis/shared";
import { lazy, Suspense, useId } from "react";
import { useParams, useSearchParams } from "react-router";
import { MonthlyChartPlaceholder } from "@/components/MonthlyChartPlaceholder";
import ScopeTrail from "@/components/ScopeTrail";
import TreeGrid from "@/components/TreeGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/lib/api";
import { scopeTitle } from "@/lib/chart";
import { isNotFound, isResponseError, statusOf } from "@/lib/http";
import { formatPeriod } from "@/lib/period";
import { findNode, pathTo } from "@/lib/tree";
import { useDelayedFlag } from "@/lib/useDelayedFlag";
import styles from "./Dashboard.module.css";
import NoData from "./NoData";
import NotFound from "./NotFound";

const MonthlyChart = lazy(() => import("@/components/MonthlyChart"));

/**
 * The dashboard page.
 *
 * The page owns the route param, the URL, the first-paint states and the
 * announcement of a scope change.
 *
 * The order of the branches is part of the contract because SWR can hold an
 * error and no data at the same time, and a background retry sets the loading
 * flag back to true while nothing is cached, so a skeleton checked first would
 * replace the error message on every retry.
 */

function errorMessage(error: unknown): string {
  if (isResponseError(error)) {
    return "The server answered with a body the dashboard could not read.";
  }
  const status = statusOf(error);
  if (status === undefined) {
    return "The request did not reach the server.";
  }
  return `The server answered with status ${status}.`;
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <>
      <div role="alert" className={styles.notice}>
        <p>The dashboard could not be loaded.</p>
        <p>{errorMessage(error)}</p>
      </div>
      <button
        type="button"
        className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
        onClick={onRetry}
      >
        Retry
      </button>
    </>
  );
}

function PageHeader({ fiscalYear }: { fiscalYear: number }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.heading}>Clients</h1>
      <p className={styles.period}>{formatPeriod(fiscalYear)}</p>
    </header>
  );
}

function LoadingState() {
  const showSkeletons = useDelayedFlag(true, 200);

  return (
    <div role="status" aria-label="Loading">
      {showSkeletons ? (
        <div aria-hidden="true" className="flex flex-col gap-6">
          <Skeleton className="h-[500px] sm:h-[430px] w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : null}
    </div>
  );
}

function RefreshNotice({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const status = statusOf(error);

  return (
    <div className={styles.notice}>
      <p role="status">
        The data could not be refreshed
        {status === undefined ? "." : `, the server answered with status ${status}.`}
      </p>
      <button
        type="button"
        className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}

function RefreshNoticeArea({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (!error) {
    return null;
  }
  return <RefreshNotice error={error} onRetry={onRetry} />;
}

function resolveSelected(company: Company, nodeId: string | null): TreeNode {
  if (!nodeId) {
    return company;
  }
  return findNode(company, nodeId) ?? company;
}

function resolveTrail(company: Company, selected: TreeNode): TreeNode[] {
  const path = pathTo(company, selected.id);
  return path.length > 0 ? path : [company];
}

function nextParams(previous: URLSearchParams, id: string, companyId: string): URLSearchParams {
  const next = new URLSearchParams(previous);
  if (id === companyId) {
    next.delete("node");
  } else {
    next.set("node", id);
  }
  return next;
}

function useNodeSelection(company: Company | undefined) {
  const [params, setParams] = useSearchParams();

  const selected = company ? resolveSelected(company, params.get("node")) : undefined;
  const trailPath = company && selected ? resolveTrail(company, selected) : [];

  const onSelect = (id: string) => {
    if (!company) {
      return;
    }
    // A replace, not a push, so Back leaves the dashboard instead of
    // walking through the selections.
    setParams((prev) => nextParams(prev, id, company.id), { replace: true });
  };

  return { selected, trailPath, onSelect };
}

function formatAnnouncement(selectedNode: TreeNode) {
  const [scopeName, breakdown] = scopeTitle(selectedNode).split(", by ");
  return breakdown ? `Showing ${scopeName}, broken down by ${breakdown}.` : `Showing ${scopeName}.`;
}

function resolveRouteYear(year: string | undefined) {
  if (!year || !isFiscalYear(year)) {
    return { isValid: false, yearParam: "", fiscalYear: 0 };
  }
  return { isValid: true, yearParam: year, fiscalYear: Number(year) };
}

function DashboardWaiting({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }
  return <LoadingState />;
}

function resolveRouteView(isValid: boolean, error: unknown, fiscalYear: number) {
  if (!isValid) {
    return <NotFound />;
  }
  if (isNotFound(error)) {
    return <NoData fiscalYear={fiscalYear} />;
  }
  return null;
}

function resolveDashboardData(company: Company | undefined, selected: TreeNode | undefined) {
  return company && selected ? { company, selected } : null;
}

export default function Dashboard() {
  const { year } = useParams();
  const scopeLabelId = `chart-scope-${useId().replace(/:/g, "")}`;
  const { isValid, yearParam, fiscalYear } = resolveRouteYear(year);

  const { company, error, mutate } = useDashboard(yearParam);
  const { selected, trailPath, onSelect } = useNodeSelection(company);

  const routeView = resolveRouteView(isValid, error, fiscalYear);
  if (routeView) {
    return routeView;
  }

  const ready = resolveDashboardData(company, selected);

  return (
    <main className={styles.shell}>
      <PageHeader fiscalYear={fiscalYear} />

      {ready ? (
        <>
          <RefreshNoticeArea error={error} onRetry={() => void mutate()} />
          <p aria-live="polite" className="sr-only">
            {formatAnnouncement(ready.selected)}
          </p>

          <div className={styles.chartGroup}>
            <ScopeTrail path={trailPath} labelId={scopeLabelId} onSelect={onSelect} />
            <div className={`${styles.card} ${styles.chartCard}`}>
              <Suspense
                fallback={
                  <MonthlyChartPlaceholder node={ready.selected} labelledById={scopeLabelId} />
                }
              >
                <MonthlyChart
                  node={ready.selected}
                  fiscalYear={fiscalYear}
                  labelledById={scopeLabelId}
                />
              </Suspense>
            </div>
          </div>

          <div className={`${styles.card} ${styles.tableCard}`}>
            {/* The treegrid keeps its own expansion and its own focus so a new fiscal
                year starts from a clean grid. The selection is not the key because the
                URL changes on every selection, and a remount would drop the focus. */}
            <TreeGrid
              key={fiscalYear}
              company={ready.company}
              selectedId={ready.selected.id}
              fiscalYear={fiscalYear}
              onSelect={onSelect}
            />
          </div>
        </>
      ) : (
        <DashboardWaiting error={error} onRetry={() => void mutate()} />
      )}
    </main>
  );
}
