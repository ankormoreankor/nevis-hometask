/**
 * The fiscal calendar, in one file.
 *
 * Everything that knows February is the first month of a fiscal year lives
 * here. The chart axis, the table header, the page heading and the NoData year
 * range all read from this module, so the year in the route is the only input
 * and no component formats a date on its own.
 *
 * The twelve-month table is a literal rather than a loop with a modulo,
 * because reading it should not require arithmetic.
 */

/**
 * The first year the empty-state picker offers, not the first year the route accepts.
 */
export const FISCAL_YEAR_PICKER_MIN = 2000;

/**
 * The fiscal year the dashboard falls back to, because it is the one year the
 * payload covers. The router holds no literal of its own.
 */
export const DEFAULT_FISCAL_YEAR = 2024;

export type FiscalMonth = {
  readonly month: number;
  readonly yearOffset: 0 | 1;
};

/**
 * February first, January last. `yearOffset` is 1 for the January that closes
 * the fiscal year.
 */
export const FISCAL_MONTHS: readonly FiscalMonth[] = [
  { month: 2, yearOffset: 0 },
  { month: 3, yearOffset: 0 },
  { month: 4, yearOffset: 0 },
  { month: 5, yearOffset: 0 },
  { month: 6, yearOffset: 0 },
  { month: 7, yearOffset: 0 },
  { month: 8, yearOffset: 0 },
  { month: 9, yearOffset: 0 },
  { month: 10, yearOffset: 0 },
  { month: 11, yearOffset: 0 },
  { month: 12, yearOffset: 0 },
  { month: 1, yearOffset: 1 },
];

/**
 * The fiscal year the current date falls in. January still belongs to the
 * year before it, because FY2024 ends in Jan 2025.
 */
export function currentFiscalYear(): number {
  const now = new Date();
  return now.getMonth() >= 1 ? now.getFullYear() : now.getFullYear() - 1;
}

function fiscalMonthDate(fiscalYear: number, index: number): Date | null {
  const entry = FISCAL_MONTHS[index];
  if (!entry) {
    return null;
  }

  return new Date(Date.UTC(fiscalYear + entry.yearOffset, entry.month - 1, 1));
}

/**
 * The label of one month of a fiscal year, for example "Feb 2024".
 *
 * The date is built in UTC on both sides. A machine west of Greenwich would
 * otherwise render the previous month. An index outside the twelve months has
 * no label.
 */
export function formatMonthLabel(fiscalYear: number, index: number): string {
  const date = fiscalMonthDate(fiscalYear, index);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * The short label of one month of a fiscal year, for example "Feb" and "Jan".
 *
 * The date is built in UTC on both sides. An index outside the twelve months
 * has no label.
 */
export function formatMonthShort(fiscalYear: number, index: number): string {
  const date = fiscalMonthDate(fiscalYear, index);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

/**
 * The span of a fiscal year, for example "Feb 2024 to Jan 2025".
 */
export function formatPeriod(fiscalYear: number): string {
  return `${formatMonthLabel(fiscalYear, 0)} to ${formatMonthLabel(fiscalYear, 11)}`;
}
