import { isFiscalYear } from "@nevis/shared";
import { describe, expect, it, vi } from "vitest";
import {
  currentFiscalYear,
  DEFAULT_FISCAL_YEAR,
  FISCAL_MONTHS,
  FISCAL_YEAR_PICKER_MIN,
  formatMonthLabel,
  formatPeriod,
} from "./period";

describe("formatMonthLabel", () => {
  it("labels the fiscal year from February", () => {
    expect(formatMonthLabel(2024, 0)).toBe("Feb 2024");
    expect(formatMonthLabel(2024, 11)).toBe("Jan 2025");
    expect(formatMonthLabel(2025, 0)).toBe("Feb 2025");
  });

  it("has no label outside the twelve months", () => {
    expect(formatMonthLabel(2024, 12)).toBe("");
    expect(formatMonthLabel(2024, -1)).toBe("");
  });
});

describe("formatPeriod", () => {
  it("spans February to January", () => {
    expect(formatPeriod(2024)).toBe("Feb 2024 to Jan 2025");
    expect(formatPeriod(2025)).toBe("Feb 2025 to Jan 2026");
  });
});

describe("FISCAL_MONTHS", () => {
  it("holds every month once, February first and January last", () => {
    expect(FISCAL_MONTHS).toHaveLength(12);
    expect(FISCAL_MONTHS[0]?.month).toBe(2);
    expect(FISCAL_MONTHS[11]?.month).toBe(1);
    expect(FISCAL_MONTHS[11]?.yearOffset).toBe(1);

    const months = FISCAL_MONTHS.map((entry) => entry.month).sort((a, b) => a - b);
    expect(months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe("currentFiscalYear", () => {
  it("is still the previous calendar year in January", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
    expect(currentFiscalYear()).toBe(2024);

    vi.setSystemTime(new Date("2025-02-15T12:00:00Z"));
    expect(currentFiscalYear()).toBe(2025);

    vi.useRealTimers();
  });
});

describe("isFiscalYear", () => {
  it("takes four digits", () => {
    expect(isFiscalYear("2024")).toBe(true);
    expect(isFiscalYear("1000")).toBe(true);
    expect(isFiscalYear("9999")).toBe(true);
    expect(isFiscalYear("0024")).toBe(false);
    expect(isFiscalYear("0999")).toBe(false);
    expect(isFiscalYear("0000")).toBe(false);
    expect(isFiscalYear("999")).toBe(false);
    expect(isFiscalYear("20245")).toBe(false);
    expect(isFiscalYear("abc")).toBe(false);
    expect(isFiscalYear("")).toBe(false);
  });
});

describe("the constants", () => {
  it("point at the one year the payload covers", () => {
    expect(DEFAULT_FISCAL_YEAR).toBe(2024);
    expect(FISCAL_YEAR_PICKER_MIN).toBe(2000);
  });
});
