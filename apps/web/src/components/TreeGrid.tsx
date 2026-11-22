import type { Company } from "@nevis/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMonthLabel } from "@/lib/period";
import { ancestorIds, type FlatRow, flattenVisible, initials } from "@/lib/tree";

/**
 * The month table as an accessible treegrid.
 *
 * The whole tree is a prop, so expansion is pure local state. A row click
 * selects the node and the chart above remaps to it.
 *
 * The visible row list comes from flattenVisible in "@/lib/tree". This
 * component renders that list and handles the DOM, the focus and the keys. It
 * does not walk the tree itself, so the levels, the sibling counts and the
 * kind of each row are testable without a browser.
 */

export type TreeGridProps = {
  company: Company;
  selectedId: string;
  fiscalYear: number;
  onSelect: (id: string) => void;
  caption?: string;
  className?: string;
};

const DEFAULT_CAPTION = "Monthly figures by branch, adviser and acquisition channel";
const MONTH_COUNT = 12;
const INDENT_PX = 16;

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: expanded ? "rotate(90deg)" : undefined }}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function TreeGrid({
  company,
  selectedId,
  fiscalYear,
  onSelect,
  caption = DEFAULT_CAPTION,
  className,
}: TreeGridProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set([company.id, ...ancestorIds(company, selectedId)]),
  );
  const [focusedId, setFocusedId] = useState<string>(() => selectedId || company.id);

  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  const rows = useMemo(() => flattenVisible(company, expanded), [company, expanded]);

  const months = useMemo(
    () => Array.from({ length: MONTH_COUNT }, (_, index) => formatMonthLabel(fiscalYear, index)),
    [fiscalYear],
  );

  // A selection from a deep link has to open the path to it. The selected node
  // itself is never added, so selecting a collapsed branch does not expand it.
  useEffect(() => {
    const path = ancestorIds(company, selectedId);
    if (path.length === 0) {
      return;
    }

    setExpanded((previous) => {
      const next = new Set(previous);
      let changed = false;
      for (const id of path) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [company, selectedId]);

  const toggle = useCallback((id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const focusRow = useCallback((id: string) => {
    setFocusedId(id);
    rowRefs.current.get(id)?.focus();
  }, []);

  // The parent of a row is the nearest row above it one level up. The rows
  // arrive in document order, so the search is a walk backwards.
  const parentOf = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row, index) => {
      for (let previous = index - 1; previous >= 0; previous -= 1) {
        const candidate = rows[previous];
        if (candidate && candidate.level === row.level - 1) {
          map.set(row.id, candidate.id);
          break;
        }
      }
    });
    return map;
  }, [rows]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, row: FlatRow) => {
    const index = rows.findIndex((candidate) => candidate.id === row.id);
    const next = rows[index + 1];
    const previous = rows[index - 1];

    switch (event.key) {
      case "ArrowDown":
        if (next) {
          event.preventDefault();
          focusRow(next.id);
        }
        break;
      case "ArrowUp":
        if (previous) {
          event.preventDefault();
          focusRow(previous.id);
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        if (row.hasChildren && !row.isExpanded) {
          toggle(row.id);
        } else if (row.hasChildren && next && next.level === row.level + 1) {
          focusRow(next.id);
        }
        break;
      case "ArrowLeft": {
        event.preventDefault();
        if (row.hasChildren && row.isExpanded) {
          toggle(row.id);
          break;
        }
        const parentId = parentOf.get(row.id);
        if (parentId) {
          focusRow(parentId);
        }
        break;
      }
      case "Home": {
        event.preventDefault();
        const first = rows[0];
        if (first) {
          focusRow(first.id);
        }
        break;
      }
      case "End": {
        event.preventDefault();
        const last = rows[rows.length - 1];
        if (last) {
          focusRow(last.id);
        }
        break;
      }
      case "Enter":
      case " ": {
        // The chevron is a button inside the row. A keypress aimed at it is
        // the button's, and the row must not select.
        if (event.target !== event.currentTarget) {
          return;
        }
        event.preventDefault();
        onSelect(row.id);
        break;
      }
      default:
        break;
    }
  };

  return (
    <Table role="treegrid" aria-label={caption} className={className}>
      <TableHeader>
        <TableRow className="h-10">
          <TableHead role="columnheader" className="sr-only">
            Name
          </TableHead>
          {months.map((month) => (
            <TableHead key={month} role="columnheader" className="text-right">
              {month}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            ref={(element) => {
              if (element) {
                rowRefs.current.set(row.id, element);
              } else {
                rowRefs.current.delete(row.id);
              }
            }}
            role="row"
            aria-level={row.level}
            aria-posinset={row.posInSet}
            aria-setsize={row.setSize}
            aria-expanded={row.hasChildren ? row.isExpanded : undefined}
            aria-selected={row.id === selectedId}
            tabIndex={row.id === focusedId ? 0 : -1}
            data-state={row.id === selectedId ? "selected" : undefined}
            className="h-14"
            onClick={() => {
              focusRow(row.id);
              onSelect(row.id);
            }}
            onDoubleClick={() => {
              onSelect(row.id);
              toggle(row.id);
            }}
            onFocus={() => setFocusedId(row.id)}
            onKeyDown={(event) => handleKeyDown(event, row)}
          >
            <TableCell role="gridcell" className="w-[296px] min-w-[160px]">
              <div
                className="flex items-center gap-2"
                style={{ paddingLeft: (row.level - 1) * INDENT_PX }}
              >
                {row.hasChildren ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                    // The chevron is pointer only. Keeping the focus off the
                    // button leaves it on the row, which is the only focus
                    // target in the grid.
                    // The chevron is pointer only. Keeping the focus off the
                    // button leaves it on the row, which is the only focus
                    // target in the grid.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggle(row.id);
                      focusRow(row.id);
                    }}
                    onDoubleClick={(event) => event.stopPropagation()}
                  >
                    <Chevron expanded={row.isExpanded} />
                  </button>
                ) : (
                  <span aria-hidden="true" className="inline-block h-8 w-8 shrink-0" />
                )}
                {row.kind === "advisor" ? (
                  <span
                    aria-hidden="true"
                    className="adviser-avatar"
                    style={
                      { "--avatar-color": `var(--chart-${row.posInSet})` } as React.CSSProperties
                    }
                  >
                    {initials(row.name)}
                  </span>
                ) : null}
                <span>{row.name}</span>
              </div>
            </TableCell>
            {row.node.values.map((value, index) => (
              <TableCell key={months[index]} role="gridcell" className="text-right tabular-nums">
                {value}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
