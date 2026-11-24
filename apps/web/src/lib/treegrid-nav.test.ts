import { describe, expect, it } from "vitest";
import type { FlatRow } from "@/lib/tree";
import { keyAction } from "./treegrid-nav";

function makeRow(overrides: Partial<FlatRow>): FlatRow {
  return {
    id: "row-1",
    name: "Row 1",
    node: { id: "row-1", name: "Row 1", values: [] },
    level: 1,
    kind: "company",
    posInSet: 1,
    setSize: 1,
    hasChildren: false,
    isExpanded: false,
    parentId: null,
    ...overrides,
  };
}

describe("keyAction", () => {
  const root = makeRow({ id: "root", name: "Company", hasChildren: true, isExpanded: true });
  const branch1 = makeRow({
    id: "b1",
    name: "Branch 1",
    level: 2,
    hasChildren: true,
    isExpanded: false,
    parentId: "root",
  });
  const branch2 = makeRow({
    id: "b2",
    name: "Branch 2",
    level: 2,
    hasChildren: false,
    isExpanded: false,
    parentId: "root",
  });
  const rows = [root, branch1, branch2];

  it("handles ArrowDown", () => {
    expect(keyAction(rows, root, "ArrowDown")).toEqual({ kind: "focus", id: "b1" });
    expect(keyAction(rows, branch1, "ArrowDown")).toEqual({ kind: "focus", id: "b2" });
    expect(keyAction(rows, branch2, "ArrowDown")).toBeNull();
  });

  it("handles ArrowUp", () => {
    expect(keyAction(rows, branch2, "ArrowUp")).toEqual({ kind: "focus", id: "b1" });
    expect(keyAction(rows, branch1, "ArrowUp")).toEqual({ kind: "focus", id: "root" });
    expect(keyAction(rows, root, "ArrowUp")).toBeNull();
  });

  it("handles ArrowRight to expand collapsed parent", () => {
    expect(keyAction(rows, branch1, "ArrowRight")).toEqual({ kind: "toggle", id: "b1" });
  });

  it("handles ArrowRight to move into first child when expanded", () => {
    const child = makeRow({ id: "c1", name: "Child", level: 3, parentId: "b1" });
    const expandedBranch = { ...branch1, isExpanded: true };
    const expandedRows = [root, expandedBranch, child, branch2];

    expect(keyAction(expandedRows, expandedBranch, "ArrowRight")).toEqual({
      kind: "focus",
      id: "c1",
    });
  });

  it("returns null on ArrowRight for leaves", () => {
    expect(keyAction(rows, branch2, "ArrowRight")).toBeNull();
  });

  it("handles ArrowLeft to collapse expanded parent", () => {
    expect(keyAction(rows, root, "ArrowLeft")).toEqual({ kind: "toggle", id: "root" });
  });

  it("handles ArrowLeft to move to parent on collapsed or leaf row", () => {
    expect(keyAction(rows, branch1, "ArrowLeft")).toEqual({ kind: "focus", id: "root" });
    expect(keyAction(rows, branch2, "ArrowLeft")).toEqual({ kind: "focus", id: "root" });
  });

  it("returns null on ArrowLeft for root when collapsed", () => {
    const collapsedRoot = { ...root, isExpanded: false };
    expect(keyAction([collapsedRoot], collapsedRoot, "ArrowLeft")).toBeNull();
  });

  it("handles Home and End", () => {
    expect(keyAction(rows, branch1, "Home")).toEqual({ kind: "focus", id: "root" });
    expect(keyAction(rows, branch1, "End")).toEqual({ kind: "focus", id: "b2" });
  });

  it("handles Enter and Space", () => {
    expect(keyAction(rows, branch1, "Enter")).toEqual({ kind: "select", id: "b1" });
    expect(keyAction(rows, branch1, " ")).toEqual({ kind: "select", id: "b1" });
  });

  it("returns null for unknown keys or missing row", () => {
    expect(keyAction(rows, branch1, "Tab")).toBeNull();
    expect(keyAction(rows, makeRow({ id: "unknown" }), "ArrowDown")).toBeNull();
  });
});
