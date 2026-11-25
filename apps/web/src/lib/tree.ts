import type { Company, TreeNode } from "@nevis/shared";

export type FlatRow = {
  id: string;
  name: string;
  node: TreeNode;
  level: number;
  kind: "company" | "branch" | "advisor" | "channel";
  posInSet: number;
  setSize: number;
  hasChildren: boolean;
  isExpanded: boolean;
  parentId: string | null;
};

// The union shares no child key, so the level is read from the keys the node
// carries.
export function childrenOf(node: TreeNode): TreeNode[] {
  if ("branches" in node) {
    return node.branches ?? [];
  }
  if ("employees" in node) {
    return node.employees ?? [];
  }
  if ("channels" in node) {
    return node.channels ?? [];
  }
  return [];
}

export function hasChildren(node: TreeNode): boolean {
  return childrenOf(node).length > 0;
}

export function findNode(root: Company, id: string): TreeNode | null {
  return pathTo(root, id).at(-1) ?? null;
}

// A deep link opens the ancestors, never the target itself.
export function ancestorIds(root: Company, id: string): string[] {
  return pathTo(root, id)
    .slice(0, -1)
    .map((node) => node.id);
}

// Cycle-safe, and an unknown id gives an empty path.
export function pathTo(root: Company, id: string): TreeNode[] {
  const visited = new Set<string>();
  const path: TreeNode[] = [];

  const walk = (node: TreeNode): boolean => {
    if (visited.has(node.id)) {
      return false;
    }
    visited.add(node.id);

    path.push(node);
    if (node.id === id) {
      return true;
    }

    for (const child of childrenOf(node)) {
      if (walk(child)) {
        return true;
      }
    }
    path.pop();

    return false;
  };

  return walk(root) ? path : [];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) {
    return "";
  }

  if (parts.length === 1) {
    return (first[0] ?? "").toUpperCase();
  }

  const last = parts[parts.length - 1];

  return `${first[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

// The kind comes from the parent, so a branch without employees is still a
// branch.
export function flattenVisible(root: Company, expanded: ReadonlySet<string>): FlatRow[] {
  const rows: FlatRow[] = [];

  const walk = (
    node: TreeNode,
    level: number,
    kind: FlatRow["kind"],
    posInSet: number,
    setSize: number,
    parentId: string | null,
  ): void => {
    const children = childrenOf(node);
    const isExpanded = expanded.has(node.id);

    rows.push({
      id: node.id,
      name: node.name,
      node,
      level,
      kind,
      posInSet,
      setSize,
      hasChildren: children.length > 0,
      isExpanded,
      parentId,
    });

    if (!isExpanded) {
      return;
    }

    const childKind: FlatRow["kind"] =
      kind === "company" ? "branch" : kind === "branch" ? "advisor" : "channel";

    children.forEach((child, index) => {
      walk(child, level + 1, childKind, index + 1, children.length, node.id);
    });
  };

  walk(root, 1, "company", 1, 1, null);

  return rows;
}
