import { describe, expect, it } from "vitest";
import { at, company2024 } from "@/test/fixtures";
import { ancestorIds, childrenOf, findNode, flattenVisible, hasChildren, initials } from "./tree";

const company = company2024;
const branch1 = at(company.branches, 0);
const branch2 = at(company.branches, 1);
const anna = at(branch1.employees, 0);
const existingClients = at(anna.channels, 0);

describe("childrenOf", () => {
  it("returns the children of each level", () => {
    expect(childrenOf(company)).toHaveLength(3);
    expect(childrenOf(branch1)).toHaveLength(5);
    expect(childrenOf(anna)).toHaveLength(3);
    expect(childrenOf(existingClients)).toEqual([]);
  });

  it("treats a missing child list as no children", () => {
    expect(childrenOf(branch2)).toEqual([]);
  });
});

describe("hasChildren", () => {
  it("is true only where there is something below", () => {
    expect(hasChildren(company)).toBe(true);
    expect(hasChildren(branch1)).toBe(true);
    expect(hasChildren(anna)).toBe(true);
    expect(hasChildren(branch2)).toBe(false);
    expect(hasChildren(existingClients)).toBe(false);
  });
});

describe("findNode", () => {
  it("finds a node by id", () => {
    expect(findNode(company, branch1.id)?.name).toBe("Branch 1");
    expect(findNode(company, existingClients.id)?.name).toBe("Existing clients");
  });

  it("returns null for an unknown id", () => {
    expect(findNode(company, "nope")).toBeNull();
  });
});

describe("ancestorIds", () => {
  it("lists the path down to the parent of the node", () => {
    expect(ancestorIds(company, existingClients.id)).toEqual([company.id, branch1.id, anna.id]);
    expect(ancestorIds(company, anna.id)).toEqual([company.id, branch1.id]);
  });

  it("is empty for the root and for an unknown id", () => {
    expect(ancestorIds(company, company.id)).toEqual([]);
    expect(ancestorIds(company, "nope")).toEqual([]);
  });
});

describe("initials", () => {
  it("takes the first and the last word", () => {
    expect(initials("Anna Blackwood")).toBe("AB");
    expect(initials("Sarah Smith")).toBe("SS");
    expect(initials("Cher")).toBe("C");
    expect(initials("  Anna   Blackwood  ")).toBe("AB");
    expect(initials("")).toBe("");
  });
});

describe("flattenVisible", () => {
  it("shows the root alone when nothing is expanded", () => {
    const rows = flattenVisible(company, new Set());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("company");
    expect(rows[0]?.level).toBe(1);
  });

  it("shows the branches of an expanded company", () => {
    const rows = flattenVisible(company, new Set([company.id]));
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.kind)).toEqual(["company", "branch", "branch", "branch"]);
    expect(rows.map((row) => row.level)).toEqual([1, 2, 2, 2]);
    expect(rows[1]?.posInSet).toBe(1);
    expect(rows[2]?.posInSet).toBe(2);
    expect(rows[3]?.posInSet).toBe(3);
    expect(rows[3]?.setSize).toBe(3);
  });

  it("keeps a branch without employees a branch", () => {
    const rows = flattenVisible(company, new Set([company.id]));
    const row = rows.find((candidate) => candidate.id === branch2.id);
    expect(row?.kind).toBe("branch");
    expect(row?.hasChildren).toBe(false);
  });

  it("carries the level and the sibling counts of an adviser", () => {
    const rows = flattenVisible(company, new Set([company.id, branch1.id]));
    const row = rows.find((candidate) => candidate.id === anna.id);
    expect(row?.kind).toBe("advisor");
    expect(row?.level).toBe(3);
    expect(row?.posInSet).toBe(1);
    expect(row?.setSize).toBe(5);
    expect(row?.hasChildren).toBe(true);
  });

  it("shows the channels of an expanded adviser", () => {
    const rows = flattenVisible(company, new Set([company.id, branch1.id, anna.id]));
    const channels = rows.filter((row) => row.kind === "channel");
    expect(channels).toHaveLength(3);
    expect(channels.every((row) => row.level === 4)).toBe(true);
    expect(channels.every((row) => row.setSize === 3)).toBe(true);
    expect(channels.every((row) => !row.hasChildren)).toBe(true);
  });

  it("does not mutate the tree", () => {
    const before = JSON.stringify(company);
    flattenVisible(company, new Set([company.id, branch1.id, anna.id]));
    expect(JSON.stringify(company)).toBe(before);
  });
});
