import { isFiscalYear } from "@nevis/shared";
import { useId } from "react";
import { useParams, useSearchParams } from "react-router";
import MonthlyChart from "@/components/MonthlyChart";
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

/**
 * The dashboard page.
 *
 * The screen for one fiscal year: the chart above, the treegrid below, and the
 * selection that connects them. The page owns the route param, the URL, the
 * first-paint states and the announcement of a scope change.
 *
 * The order of the branches is part of the contract. SWR can hold an error
 * and no data at the same time, and a background retry sets the loading flag
 * back to true while nothing is cached, so a skeleton checked first would
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
    <main className={styles.shell}>
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
    </main>
  );
}

function LoadingState() {
  const showSkeletons = useDelayedFlag(true, 200);

  return (
    <main className={styles.shell}>
      <div role="status" aria-label="Loading">
        {/* The skeletons hold the space the chart and the table will take, so
            nothing jumps when the data lands. They carry no information. */}
        {showSkeletons ? (
          <div aria-hidden="true" className="flex flex-col gap-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[430px] w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function Dashboard() {
  const { year } = useParams();
  const [params, setParams] = useSearchParams();
  const scopeLabelId = `chart-scope-${useId().replace(/:/g, "")}`;

  const isValidYear = year !== undefined && isFiscalYear(year);
  const fiscalYear = Number(year);

  // A year the route already rejected never reaches the server. The request
  // would only earn a 400.
  const { company, error, mutate } = useDashboard(isValidYear ? (year ?? "") : "");

  if (!isValidYear) {
    return <NotFound />;
  }

  // A 404 is an empty state, not a failure.
  if (isNotFound(error)) {
    return <NoData fiscalYear={fiscalYear} />;
  }

  if (!company) {
    if (error) {
      return <ErrorState error={error} onRetry={() => void mutate()} />;
    }
    return <LoadingState />;
  }

  const selected = findNode(company, params.get("node") ?? "") ?? company;
  const path = pathTo(company, selected.id);
  const trailPath = path.length > 0 ? path : [company];

  const onSelect = (id: string) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (id === company.id) {
          next.delete("node");
        } else {
          next.set("node", id);
        }
        return next;
      },
      // A replace, not a push, so Back leaves the dashboard instead of
      // walking through the selections.
      { replace: true },
    );
  };

  // The scope title is "Name, by adviser". The live region says it in a
  // sentence, so a screen reader announces the change and not the fragment.
  const [scopeName, breakdown] = scopeTitle(selected).split(", by ");
  const announcement = breakdown
    ? `Showing ${scopeName}, broken down by ${breakdown}.`
    : `Showing ${scopeName}.`;

  const status = statusOf(error);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Clients</h1>
        <p className={styles.period}>{formatPeriod(fiscalYear)}</p>
      </header>

      {error ? (
        <div className={styles.notice}>
          <p role="status">
            The data could not be refreshed
            {status === undefined ? "." : `, the server answered with status ${status}.`}
          </p>
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-muted"
            onClick={() => void mutate()}
          >
            Retry
          </button>
        </div>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className={styles.chartGroup}>
        <ScopeTrail path={trailPath} labelId={scopeLabelId} onSelect={onSelect} />
        <div className={`${styles.card} ${styles.chartCard}`}>
          <MonthlyChart node={selected} fiscalYear={fiscalYear} labelledById={scopeLabelId} />
        </div>
      </div>

      <div className={`${styles.card} ${styles.tableCard}`}>
        <TreeGrid
          // The grid keeps its own expansion and its own focus, so a new fiscal
          // year starts from a clean grid. The selection is not the key: the URL
          // changes on every selection, and a remount would drop the focus.
          key={fiscalYear}
          company={company}
          selectedId={selected.id}
          fiscalYear={fiscalYear}
          onSelect={onSelect}
        />
      </div>
    </main>
  );
}
