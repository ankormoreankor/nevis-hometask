import type { Company, TreeNode } from "@nevis/shared";

/**
 * TASK: tree helpers
 *
 * Goal
 *   The pure functions both components need: which children a node has, where a
 *   node sits, which ancestors must be open for it to be visible, the rows the
 *   table actually draws, and the initials on an adviser row. No React, no
 *   fetching, no state.
 *
 * Contract
 *   export function childrenOf(node: TreeNode): TreeNode[]
 *   export function hasChildren(node: TreeNode): boolean
 *   export function findNode(root: Company, id: string): TreeNode | null
 *   export function ancestorIds(root: Company, id: string): string[]
 *   export function initials(name: string): string
 *
 *   export type FlatRow = {
 *     id: string
 *     name: string
 *     node: TreeNode
 *     level: number
 *     kind: "company" | "branch" | "advisor" | "channel"
 *     posInSet: number
 *     setSize: number
 *     hasChildren: boolean
 *     isExpanded: boolean
 *   }
 *
 *   export function flattenVisible(root: Company, expanded: ReadonlySet<string>): FlatRow[]
 *
 *   Company, TreeNode from "@nevis/shared".
 *
 * Steps
 *   1. childrenOf switches on the level. The union does not share the child key,
 *      so narrow with "branches" in node for the company, "employees" in node
 *      for a branch, "channels" in node for an adviser. A channel has no child
 *      key and returns []. Every child key is optional, so an absent key and an
 *      undefined value both mean no children: return node.branches ?? [], not
 *      node.branches, because the `in` check does not narrow away undefined.
 *   2. hasChildren is childrenOf(node).length > 0. Absent and empty are the same
 *      thing here: the UI draws a leaf.
 *   3. findNode walks depth-first from the company, comparing id, and returns
 *      the first match. Carry a Set of visited ids so a malformed payload cannot
 *      loop. Return null when nothing matches, so the caller can fall back
 *      instead of guessing.
 *   4. ancestorIds returns the ids on the path from the company down to the
 *      parent of the target, root first, excluding the target itself. Empty when
 *      the target is the company or is not in the tree.
 *   5. initials returns the first letter of the first and last word of a name,
 *      uppercased: "Anna Blackwood" is "AB", "Sarah Smith" is "SS", "Cher" is
 *      "C". One word gives one letter. An empty or blank name gives "". Split on
 *      whitespace, drop the empty parts, take parts[0][0] and the last part's
 *      first letter. The adviser circle in the treegrid is decorative and this
 *      is the only thing that produces its letters.
 *
 *   ancestorIds is what makes a deep link work. When ?node= points at an
 *   adviser, the company and the branch must be open or the row is invisible.
 *   The target itself is never included, so selecting a collapsed branch does
 *   not expand it as a side effect.
 *
 *   6. flattenVisible(root, expanded) walks the tree depth-first from the root,
 *      in array order, and returns the rows the table draws.
 *      - the root is always in the list, at level 1.
 *      - a node's children are in the list only when the node is expanded. The
 *        set decides it, so the component owns the starting state.
 *      - level is one more than the parent's level.
 *      - posInSet is the 1-based position among the siblings and setSize is how
 *        many siblings there are. They count the whole sibling group, not the
 *        rows that happen to be on screen.
 *      - kind comes from the parent, not from the keys on the node: the root is
 *        a company, a child of a company is a branch, a child of a branch is an
 *        adviser, a child of an adviser is a channel. Branch 2 has no
 *        employees key at all, so a test on the keys would call it a channel.
 *      - hasChildren is childrenOf(node).length > 0, and isExpanded is
 *        expanded.has(node.id).
 *      - the tree is not mutated.
 *
 * Acceptance
 *   - childrenOf(company) has 3 entries, childrenOf(Branch 1) has 5,
 *     childrenOf(Anna Blackwood) has 3, childrenOf(a channel) is [].
 *   - childrenOf on a company without branches is [].
 *   - hasChildren is true for the company, Branch 1 and Anna Blackwood, false
 *     for Branch 2, Branch 3, the four other advisers and every channel.
 *   - findNode(company, branchId) returns the branch; findNode(company, "nope")
 *     returns null.
 *   - ancestorIds(company, channelId) is [companyId, branch1Id, annaId].
 *   - ancestorIds(company, companyId) is [].
 *   - initials("Anna Blackwood") is "AB", initials("Sarah Smith") is "SS",
 *     initials("Cher") is "C", initials("") is "".
 *   - flattenVisible(company, new Set([companyId])) has 4 rows: the company at
 *     level 1, then Branch 1, Branch 2 and Branch 3 at level 2 with posInSet 1,
 *     2 and 3 and setSize 3.
 *   - flattenVisible(company, new Set()) has 1 row.
 *   - With the company and Branch 1 expanded, Anna Blackwood is at level 3,
 *     kind "advisor", posInSet 1, setSize 5.
 *   - With Anna expanded, her three channels are at level 4, kind "channel",
 *     setSize 3, and none of them has children.
 *   - Branch 2 is kind "branch" with hasChildren false.
 *
 * Edge cases
 *   - ids are unique in this payload. Do not rely on it: the visited set and the
 *     first-match rule keep a duplicated id from looping.
 *   - The functions never mutate the tree. The expansion set and the selection
 *     live in the components.
 *
 * Tests
 *   vitest for initials, the four cases above and flattenVisible. The other
 *   four are covered through the treegrid and the page.
 *
 * Delete this comment when the code is in place.
 */
export function childrenOf(_node: TreeNode): TreeNode[] {
  return [];
}

export function hasChildren(_node: TreeNode): boolean {
  return false;
}

export function findNode(_root: Company, _id: string): TreeNode | null {
  return null;
}

export function ancestorIds(_root: Company, _id: string): string[] {
  return [];
}

// Placeholder. Replace with the initials rule described above.
export function initials(_name: string): string {
  return "";
}

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

export function flattenVisible(_root: Company, _expanded: ReadonlySet<string>): FlatRow[] {
  return [];
}
