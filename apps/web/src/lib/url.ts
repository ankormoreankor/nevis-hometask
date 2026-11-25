import type { Company, TreeNode } from "@nevis/shared";
import { findNode } from "@/lib/tree";

/**
 * URL query-parameter helpers for the selected node.
 */

export function resolveSelected(company: Company, nodeId: string | null): TreeNode {
  if (!nodeId) {
    return company;
  }
  return findNode(company, nodeId) ?? company;
}

export function nextParams(
  previous: URLSearchParams,
  id: string,
  companyId: string,
): URLSearchParams {
  const next = new URLSearchParams(previous);
  if (id === companyId) {
    next.delete("node");
  } else {
    next.set("node", id);
  }
  return next;
}
