import { describe, expect, it } from "vitest";
import { at, company2024 } from "@/test/fixtures";
import {
  axisTicks,
  chartDescription,
  scopeTitle,
  toDomain,
  toRows,
  toSeries,
  toTopSeries,
} from "./chart";

const company = company2024;
const branch1 = at(company.branches, 0);
const branch2 = at(company.branches, 1);
const anna = at(branch1.employees, 0);
const existingClients = at(anna.channels, 0);

describe("toSeries", () => {
  it("stacks the branches of the company", () => {
    const series = toSeries(company);
    expect(series).toHaveLength(3);
    expect(series.map((item) => item.label)).toEqual(["Branch 1", "Branch 2", "Branch 3"]);
    expect(series.map((item) => item.key)).toEqual(["s0", "s1", "s2"]);
    expect(series.map((item) => item.color)).toEqual([
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
    ]);
    expect(series[0]?.values).toEqual(branch1.values);
  });

  it("stacks the channels of an adviser", () => {
    const series = toSeries(anna);
    expect(series).toHaveLength(3);
    expect(series.map((item) => item.label)).toEqual([
      "Existing clients",
      "New organic",
      "New paid",
    ]);
    expect(series[0]?.values).toEqual(existingClients.values);
  });

  it("gives a leaf one series of its own", () => {
    const series = toSeries(branch2);
    expect(series).toHaveLength(1);
    expect(series[0]?.label).toBe("Branch 2");
    expect(series[0]?.values).toEqual(branch2.values);
    expect(series[0]?.color).toBe("var(--chart-1)");
  });

  it("takes the colour from the position in the stack, not from the entity", () => {
    expect(toSeries(anna)[0]?.color).toBe("var(--chart-1)");
  });
});

describe("toRows", () => {
  it("makes a row per month, keyed by position", () => {
    const rows = toRows(toSeries(company), 2024);
    expect(rows).toHaveLength(12);
    expect(rows[0]).toEqual({ month: "Feb 2024", s0: 147, s1: 76, s2: 27 });
    expect(rows[11]?.month).toBe("Jan 2025");
  });

  it("moves the labels with the year in the route", () => {
    expect(toRows(toSeries(anna), 2025)[0]?.month).toBe("Feb 2025");
    expect(toRows(toSeries(anna), 2025)[11]?.month).toBe("Jan 2026");
  });
});

describe("toDomain", () => {
  it("fits the stack, rounded up to the next hundred or ten", () => {
    expect(toDomain(toSeries(company))).toBe(400);
    expect(toDomain(toSeries(branch1))).toBe(300);
    expect(toDomain(toSeries(anna))).toBe(40);
  });

  it("takes the stack and not the row of the node itself", () => {
    // May 2024: the company row says 301, its branches stack to 279.
    const rows = toRows(toSeries(company), 2024);
    expect(rows[3]).toEqual({ month: "May 2024", s0: 156, s1: 87, s2: 36 });
    expect(rows[3]?.s0).toBe(156);
  });

  it("stays at zero when there is nothing to draw", () => {
    const empty = [
      {
        key: "s0",
        label: "Empty",
        values: Array.from({ length: 12 }, () => 0),
        color: "var(--chart-1)",
      },
    ];
    expect(toDomain(empty)).toBe(0);
  });
});

describe("scopeTitle", () => {
  it("names the breakdown of the scope", () => {
    expect(scopeTitle(company)).toBe("Company, by branch");
    expect(scopeTitle(branch1)).toBe("Branch 1, by adviser");
    expect(scopeTitle(anna)).toBe("Anna Blackwood, by channel");
  });

  it("stops at a leaf", () => {
    expect(scopeTitle(existingClients)).toBe("Existing clients");
    expect(scopeTitle(branch2)).toBe("Branch 2");
  });
});

describe("toTopSeries", () => {
  it("stacks the branches of the company where the top series is non-zero in every month", () => {
    expect(toTopSeries(toSeries(company))).toEqual([
      "s2",
      "s2",
      "s2",
      "s2",
      "s2",
      "s2",
      "s2",
      "s2",
      "s2",
      "s2",
      "s2",
      "s2",
    ]);
  });

  it("selects the topmost non-zero channel under Anna Blackwood across zero months", () => {
    expect(toTopSeries(toSeries(anna))).toEqual([
      "s0",
      "s1",
      "s2",
      "s2",
      "s2",
      "s2",
      "s1",
      "s2",
      "s2",
      "s2",
      "s2",
      "s2",
    ]);
  });

  it("gives a leaf its own key in every month", () => {
    expect(toTopSeries(toSeries(branch2))).toEqual([
      "s0",
      "s0",
      "s0",
      "s0",
      "s0",
      "s0",
      "s0",
      "s0",
      "s0",
      "s0",
      "s0",
      "s0",
    ]);
  });

  it("gives null for a month where every series is zero", () => {
    const zeroMonth = [
      {
        key: "s0",
        label: "Zero",
        values: [0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        color: "var(--chart-1)",
      },
      {
        key: "s1",
        label: "Zero2",
        values: [0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        color: "var(--chart-2)",
      },
    ];
    const tops = toTopSeries(zeroMonth);
    expect(tops[0]).toBeNull();
    expect(tops[1]).toBe("s1");
  });
});

describe("axisTicks", () => {
  it("returns [0] for domain <= 0", () => {
    expect(axisTicks(0)).toEqual([0]);
    expect(axisTicks(-10)).toEqual([0]);
  });

  it("steps by 10 for domain < 100", () => {
    expect(axisTicks(40)).toEqual([0, 10, 20, 30, 40]);
  });

  it("steps by 100 for domain >= 100", () => {
    expect(axisTicks(300)).toEqual([0, 100, 200, 300]);
    expect(axisTicks(400)).toEqual([0, 100, 200, 300, 400]);
  });
});

describe("chartDescription", () => {
  it("describes single series leaf", () => {
    const series = toSeries(branch2);
    expect(chartDescription(series, 2024, branch2.name)).toBe(
      "Bar per month for Feb 2024 to Jan 2025, showing Branch 2.",
    );
  });

  it("describes multiple series split", () => {
    const series = toSeries(company);
    expect(chartDescription(series, 2024, company.name)).toBe(
      "Stacked bar per month for Feb 2024 to Jan 2025, split by Branch 1, Branch 2, Branch 3.",
    );
  });
});
