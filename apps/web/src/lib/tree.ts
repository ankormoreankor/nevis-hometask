import type { Company, TreeNode } from "@nevis/shared";

/**
 * Tree helpers.
 *
 * The pure functions both components need: which children a node has, where a
 * node sits, which ancestors must be open for it to be visible, the rows the
 * table actually draws, and the initials on an adviser row. No React, no
 * fetching, no state.
 */

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
};

/**
 * The children of a node, in the order they are stacked and drawn.
 *
 * The union does not share a child key, so the level is read from the keys the
 * node carries. Every child key is optional, and an absent key and an
 * undefined value both mean no children.
 */
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

/**
 * Whether a node has anything below it. Absent and empty are the same thing
 * here: the UI draws a leaf.
 */
export function hasChildren(node: TreeNode): boolean {
  return childrenOf(node).length > 0;
}

/**
 * The node with this id, or null. The first match wins, and a visited set
 * keeps a malformed payload from looping.
 */
export function findNode(root: Company, id: string): TreeNode | null {
  const visited = new Set<string>();

  const walk = (node: TreeNode): TreeNode | null => {
    if (visited.has(node.id)) {
      return null;
    }
    visited.add(node.id);

    if (node.id === id) {
      return node;
    }

    for (const child of childrenOf(node)) {
      const found = walk(child);
      if (found) {
        return found;
      }
    }

    return null;
  };

  return walk(root);
}

/**
 * The ids on the path from the company down to the parent of the target, root
 * first, excluding the target itself.
 *
 * This is what makes a deep link work: when the selection points at an
 * adviser, the company and the branch have to be open or the row is invisible.
 * The target is never included, so selecting a collapsed branch does not
 * expand it as a side effect.
 */
export function ancestorIds(root: Company, id: string): string[] {
  const visited = new Set<string>();
  const path: string[] = [];

  const walk = (node: TreeNode): boolean => {
    if (visited.has(node.id)) {
      return false;
    }
    visited.add(node.id);

    if (node.id === id) {
      return true;
    }

    path.push(node.id);
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

/**
 * The nodes on the path from the company down to and including the target,
 * root first.
 *
 * An unknown id returns an empty array.
 */
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

/**
 * The first letter of the first and last word of a name, uppercased.
 *
 * "Anna Blackwood" is "AB", "Sarah Smith" is "SS", "Cher" is "C". One word
 * gives one letter, an empty name gives none. The adviser circle in the
 * treegrid is decorative and this is the only thing that produces its letters.
 */
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

/**
 * The rows the table draws, in document order.
 *
 * A node's children are in the list only when the node is expanded, so the
 * set decides it and the component owns the starting state. The kind of a row
 * comes from the parent, not from the keys on the node: a branch without an
 * employees key is still a branch, and a test on the keys would call it a
 * channel.
 */
export function flattenVisible(root: Company, expanded: ReadonlySet<string>): FlatRow[] {
  const rows: FlatRow[] = [];

  const walk = (
    node: TreeNode,
    level: number,
    kind: FlatRow["kind"],
    posInSet: number,
    setSize: number,
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
    });

    if (!isExpanded) {
      return;
    }

    const childKind: FlatRow["kind"] =
      kind === "company" ? "branch" : kind === "branch" ? "advisor" : "channel";

    children.forEach((child, index) => {
      walk(child, level + 1, childKind, index + 1, children.length);
    });
  };

  walk(root, 1, "company", 1, 1);

  return rows;
}
