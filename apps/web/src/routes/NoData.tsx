import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { currentFiscalYear, FISCAL_YEAR_MIN } from "@/lib/period";

/**
 * The empty year state.
 *
 * A fiscal year with no data is a state, not an error. The page says which
 * year is empty and gives the user a way to another year and a way back to the
 * dashboard.
 */
export type NoDataProps = {
  fiscalYear: number;
};

export default function NoData({ fiscalYear }: NoDataProps) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");

  const years = Array.from(
    { length: currentFiscalYear() - FISCAL_YEAR_MIN + 1 },
    (_, index) => FISCAL_YEAR_MIN + index,
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft === "") {
      return;
    }

    const next = Number(draft);
    // The select is an action, not a display of the current year, so it resets
    // on every submit and a pick of the year already open pushes nothing.
    setDraft("");
    if (next !== fiscalYear) {
      navigate(`/dashboard/${next}`);
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">No data for fiscal year {fiscalYear}</h1>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="year" className="text-sm font-medium">
            Fiscal year
          </label>
          <select
            id="year"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="" disabled>
              Select a fiscal year
            </option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={draft === ""}
          className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm hover:bg-muted disabled:opacity-50"
        >
          Go
        </button>
      </form>
      <Link to="/" className="text-sm underline">
        Back to the dashboard
      </Link>
    </main>
  );
}
