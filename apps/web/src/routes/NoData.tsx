import { useState } from "react";
import { Link, useNavigate } from "react-router";
import noDataPoster from "@/assets/no-data-poster.jpg";
import kevinVideo from "@/assets/the-office-kevin-malone.mp4";
import StatePage from "@/components/StatePage";
import { currentFiscalYear, FISCAL_YEAR_PICKER_MIN } from "@/lib/period";

/**
 * The empty year state.
 *
 * A fiscal year with no data is a state and not an error. The page says which
 * year is empty and gives the user a way to another year and a way back to the
 * dashboard.
 */
export type NoDataProps = {
  fiscalYear: number;
};

function YearPickerForm({ fiscalYear }: { fiscalYear: number }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");

  const years = Array.from(
    { length: currentFiscalYear() - FISCAL_YEAR_PICKER_MIN + 1 },
    (_, index) => FISCAL_YEAR_PICKER_MIN + index,
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft === "") {
      return;
    }

    const next = Number(draft);
    // The select is an action and not a display of the current year, so it resets
    // on every submit and a pick of the year already open pushes nothing.
    setDraft("");
    if (next !== fiscalYear) {
      navigate(`/dashboard/${next}`);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center justify-center gap-3">
      <label htmlFor="year" className="sr-only">
        Fiscal year
      </label>
      <div className="relative">
        <select
          id="year"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-9 w-56 appearance-none rounded-md border border-border bg-background pl-3 pr-9 text-left text-sm"
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
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <button
        type="submit"
        disabled={draft === ""}
        className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm enabled:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        Go
      </button>
    </form>
  );
}

export default function NoData({ fiscalYear }: NoDataProps) {
  return (
    <StatePage videoSrc={kevinVideo} poster={noDataPoster} videoWidth={640} videoHeight={360}>
      <h1 className="text-2xl font-semibold">No data for fiscal year {fiscalYear}</h1>
      <YearPickerForm fiscalYear={fiscalYear} />
      <Link to="/" className="text-sm underline">
        Back to the dashboard
      </Link>
    </StatePage>
  );
}
