import type { FlatRow } from "@/lib/tree";

export type KeyAction =
  | { kind: "focus"; id: string }
  | { kind: "toggle"; id: string }
  | { kind: "select"; id: string };

function arrowRightAction(row: FlatRow, next?: FlatRow): KeyAction | null {
  if (!row.hasChildren) {
    return null;
  }
  if (!row.isExpanded) {
    return { kind: "toggle", id: row.id };
  }
  if (next && next.level === row.level + 1) {
    return { kind: "focus", id: next.id };
  }
  return null;
}

function arrowLeftAction(row: FlatRow): KeyAction | null {
  if (row.hasChildren && row.isExpanded) {
    return { kind: "toggle", id: row.id };
  }
  if (row.parentId) {
    return { kind: "focus", id: row.parentId };
  }
  return null;
}

type KeyHandler = (rows: readonly FlatRow[], row: FlatRow, index: number) => KeyAction | null;

const KEY_ACTIONS: Record<string, KeyHandler> = {
  Enter: (_rows, row) => ({ kind: "select", id: row.id }),
  " ": (_rows, row) => ({ kind: "select", id: row.id }),
  ArrowDown: (rows, _row, index) => {
    const next = rows[index + 1];
    return next ? { kind: "focus", id: next.id } : null;
  },
  ArrowUp: (rows, _row, index) => {
    const prev = rows[index - 1];
    return prev ? { kind: "focus", id: prev.id } : null;
  },
  ArrowRight: (rows, row, index) => arrowRightAction(row, rows[index + 1]),
  ArrowLeft: (_rows, row) => arrowLeftAction(row),
  Home: (rows) => (rows[0] ? { kind: "focus", id: rows[0].id } : null),
  End: (rows) => {
    const last = rows[rows.length - 1];
    return last ? { kind: "focus", id: last.id } : null;
  },
};

/**
 * Maps a key press on a treegrid row to a navigation or selection action.
 */
export function keyAction(rows: readonly FlatRow[], row: FlatRow, key: string): KeyAction | null {
  const index = rows.findIndex((candidate) => candidate.id === row.id);
  if (index === -1) {
    return null;
  }
  const handler = KEY_ACTIONS[key];
  return handler ? handler(rows, row, index) : null;
}
