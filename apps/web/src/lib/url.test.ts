import { describe, expect, it } from "vitest";
import { at, company2024 } from "@/test/fixtures";
import { nextParams, resolveSelected } from "./url";

const company = company2024;
const branch1 = at(company.branches, 0);
const anna = at(branch1.employees, 0);
const existingClients = at(anna.channels, 0);

describe("resolveSelected", () => {
  it("returns the company when no id is provided", () => {
    expect(resolveSelected(company, null)).toBe(company);
    expect(resolveSelected(company, "")).toBe(company);
  });

  it("returns the company when the id is unknown", () => {
    expect(resolveSelected(company, "unknown-id")).toBe(company);
  });

  it("returns the matching node when the id is known", () => {
    expect(resolveSelected(company, branch1.id)).toBe(branch1);
    expect(resolveSelected(company, anna.id)).toBe(anna);
    expect(resolveSelected(company, existingClients.id)).toBe(existingClients);
  });
});

describe("nextParams", () => {
  it("deletes node when the id equals the company id", () => {
    const previous = new URLSearchParams(`node=${branch1.id}`);
    const next = nextParams(previous, company.id, company.id);

    expect(next.has("node")).toBe(false);
    expect(next.toString()).toBe("");
  });

  it("sets node when the id differs from the company id", () => {
    const previous = new URLSearchParams();
    const next = nextParams(previous, anna.id, company.id);

    expect(next.get("node")).toBe(anna.id);
  });

  it("preserves other query parameters without mutating the input", () => {
    const previous = new URLSearchParams(`foo=bar&node=${branch1.id}&tab=overview`);

    const cleared = nextParams(previous, company.id, company.id);
    expect(cleared.get("foo")).toBe("bar");
    expect(cleared.get("tab")).toBe("overview");
    expect(cleared.has("node")).toBe(false);

    const updated = nextParams(previous, existingClients.id, company.id);
    expect(updated.get("foo")).toBe("bar");
    expect(updated.get("tab")).toBe("overview");
    expect(updated.get("node")).toBe(existingClients.id);

    expect(previous.get("node")).toBe(branch1.id);
  });
});
