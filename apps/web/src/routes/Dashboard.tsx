/**
 * TASK: Add third branch to error copy for unreadable bodies and move Retry button outside refresh status region
 *
 * Goal
 *   Render the dashboard page for a fiscal year with chart, treegrid, selection handling,
 *   and error/loading states.
 *
 * Contract
 *   - Props: none (page route component for /dashboard/:year).
 *   - Error copy branching:
 *     - If isResponseError(error): "The server answered with a body the dashboard could not read."
 *     - If statusOf(error) === undefined: "The request did not reach the server."
 *     - Else: "The server answered with status ${status}."
 *   - ErrorState props: `{ error: unknown; onRetry: () => void }`.
 *     Renders `{errorMessage(error)}` inside role="alert". Button is outside role="alert".
 *   - Call site at line 91: `<ErrorState error={error} onRetry={() => void mutate()} />`.
 *   - Refresh notice:
 *     Move role="status" from the wrapper div onto the <p> element so the Retry button is
 *     outside the live region.
 *     statusOf stays imported because the refresh notice uses it.
 *   - Ordering constraint:
 *     The error and no company branch comes before the skeleton branch, because SWR sets
 *     isLoading back to true on a background retry when nothing is cached.
 *
 * Changes
 *   1. The error copy is wrong for an unreadable body. ErrorState takes status, and lines 33-35
 *      print "The request did not reach the server." whenever status is undefined. That is also
 *      true for the ResponseError the fetcher throws for a body that is not JSON or a body that
 *      does not match the contract, and for those the request did reach the server and the
 *      server answered. The page needs a third branch.
 *      - Import `isResponseError` from "@/lib/http" alongside `isNotFound` and `statusOf`.
 *      - Add helper above ErrorState:
 *        function errorMessage(error: unknown): string {
 *          if (isResponseError(error)) return "The server answered with a body the dashboard could not read.";
 *          const status = statusOf(error);
 *          if (status === undefined) return "The request did not reach the server.";
 *          return `The server answered with status ${status}.`;
 *        }
 *      - ErrorState takes `{ error, onRetry }: { error: unknown; onRetry: () => void }` and
 *        renders `{errorMessage(error)}` in place of the current ternary.
 *      - Call site at line 91 becomes `<ErrorState error={error} onRetry={() => void mutate()} />`.
 *      - `statusOf` stays imported: the refresh notice at line 122 still uses it.
 *   2. The refresh notice at lines 133-147 puts the Retry button inside the role="status" region.
 *      The first-paint ErrorState keeps its button outside the alert on purpose, so the refresh
 *      notice should match. Move role="status" from the wrapper div at line 134 onto the <p> at
 *      line 135. The announcement stays and the button leaves the live region.
 *
 * Acceptance
 *   - When body is unreadable, ErrorState renders "The server answered with a body the dashboard could not read."
 *   - When request failed without reaching server, ErrorState renders "The request did not reach the server."
 *   - When server answered with status code, ErrorState renders "The server answered with status ${status}."
 *   - Refresh notice puts role="status" on the <p>, with Retry button outside the live region.
 *
 * Edge cases
 *   - SWR background retry when cache is empty sets isLoading to true, so error check must
 *     precede loading check.
 *
 * Tests
 *   apps/web/e2e/states.spec.ts
 *
 * Delete this comment when the code is in place.
 */

import { useParams, useSearchParams } from "react-router";
import MonthlyChart from "@/components/MonthlyChart";
import TreeGrid from "@/components/TreeGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/lib/api";
import { scopeTitle } from "@/lib/chart";
import { isNotFound, statusOf } from "@/lib/http";
import { formatPeriod, isFiscalYear } from "@/lib/period";
import { findNode } from "@/lib/tree";
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

function ErrorState({ status, onRetry }: { status?: number; onRetry: () => void }) {
  return (
    <main className={styles.shell}>
      <div role="alert" className={styles.notice}>
        <p>The dashboard could not be loaded.</p>
        <p>
          {status === undefined
            ? "The request did not reach the server."
            : `The server answered with status ${status}.`}
        </p>
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
  return (
    <main className={styles.shell}>
      <div role="status" aria-label="Loading">
        {/* The skeletons hold the space the chart and the table will take, so
            nothing jumps when the data lands. They carry no information. */}
        <div aria-hidden="true" className="flex flex-col gap-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[430px] w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </main>
  );
}

export default function Dashboard() {
  const { year } = useParams();
  const [params, setParams] = useSearchParams();

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
      return <ErrorState status={statusOf(error)} onRetry={() => void mutate()} />;
    }
    return <LoadingState />;
  }

  const selected = findNode(company, params.get("node") ?? "") ?? company;

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
        <h1 className={styles.heading}>
          {selected.id === company.id ? "Book of business" : selected.name}
        </h1>
        <p className={styles.period}>{formatPeriod(fiscalYear)}</p>
      </header>

      {error ? (
        <div className={styles.notice} role="status">
          <p>
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

      <MonthlyChart node={selected} fiscalYear={fiscalYear} />

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
    </main>
  );
}
