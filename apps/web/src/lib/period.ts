// First year the picker offers, not the first year the route accepts.
export const FISCAL_YEAR_PICKER_MIN = 2000;

export const DEFAULT_FISCAL_YEAR = 2024;

export type FiscalMonth = {
  readonly month: number;
  readonly yearOffset: 0 | 1;
};

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

// January still belongs to the fiscal year that ends in it.
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

// Dates are built in UTC on both sides, because a machine west of Greenwich
// would otherwise render the previous month.
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

export function formatPeriod(fiscalYear: number): string {
  return `${formatMonthLabel(fiscalYear, 0)} to ${formatMonthLabel(fiscalYear, 11)}`;
}
