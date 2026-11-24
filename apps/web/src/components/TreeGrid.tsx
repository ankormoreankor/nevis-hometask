import type { Company } from "@nevis/shared";
import { cn } from "cn";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMonthLabel, formatMonthShort } from "@/lib/period";
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
    () =>
      Array.from({ length: MONTH_COUNT }, (_, index) => ({
        full: formatMonthLabel(fiscalYear, index),
        short: formatMonthShort(fiscalYear, index),
      })),
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

  const toggle = useCallback(
    (id: string) => {
      const isOpen = expanded.has(id);
      if (isOpen && selectedId !== id && ancestorIds(company, selectedId).includes(id)) {
        onSelect(id);
      }

      setExpanded((previous) => {
        const next = new Set(previous);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [company, expanded, onSelect, selectedId],
  );

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
    <Table
      role="treegrid"
      aria-label={caption}
      className={cn("text-[13px] sm:text-sm [--row-indent:12px] sm:[--row-indent:16px]", className)}
    >
      <TableHeader>
        <TableRow className="h-12 sm:h-14 hover:bg-transparent">
          <TableHead
            role="columnheader"
            className="sticky left-0 z-20 w-[clamp(160px,48vw,296px)] min-w-[clamp(160px,48vw,296px)] max-w-[clamp(160px,48vw,296px)] bg-card px-1.5 sm:px-2 border-b border-border after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border sm:after:hidden"
          >
            <span className="sr-only">Name</span>
          </TableHead>
          {months.map(({ full, short }, index) => (
            <TableHead
              key={full}
              role="columnheader"
              className={cn(
                "px-1.5 sm:px-2 text-right font-normal text-muted-foreground",
                index === months.length - 1 && "pr-4 sm:pr-6",
              )}
            >
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{full}</span>
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
            // The selected row keeps its resting state transparent so the rail
            // carries the selection. The hover band is the full muted token so a
            // row can be scanned across, and the compound data-[state=selected]:hover
            // variant is needed because the plain hover rule would lose to the
            // transparent resting rule on specificity.
            className={cn(
              "group h-12 sm:h-14 hover:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
              row.id === selectedId &&
                "data-[state=selected]:bg-transparent data-[state=selected]:hover:bg-muted",
            )}
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
            {/* The design has no selected state: a full-row tint read as a stray
                gray band on a single-row table, and a weight change would reflow
                the text, so the selection is a rail. */}
            <TableCell
              role="gridcell"
              className={cn(
                "sticky left-0 z-10 w-[clamp(160px,48vw,296px)] min-w-[clamp(160px,48vw,296px)] max-w-[clamp(160px,48vw,296px)] bg-card px-1.5 sm:px-2 group-hover:bg-muted border-b border-border group-last:border-b-0 after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border sm:after:hidden group-focus-visible:shadow-[inset_2px_2px_0_0_var(--color-ring),inset_0_-2px_0_0_var(--color-ring)]",
                row.id === selectedId &&
                  "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-foreground before:content-['']",
              )}
            >
              <div
                className="flex min-w-0 items-center gap-1.5 sm:gap-2"
                style={{ paddingInlineStart: `calc(var(--row-indent) * ${row.level - 1})` }}
              >
                {row.hasChildren ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`}
                    className="inline-flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-foreground/10"
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
                  <span
                    aria-hidden="true"
                    className="inline-block h-6 w-6 sm:h-8 sm:w-8 shrink-0"
                  />
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
                <span className="min-w-0 flex-1 truncate" title={row.name}>
                  {row.name}
                </span>
              </div>
            </TableCell>
            {row.node.values.map((value, index) => (
              <TableCell
                key={months[index]?.full}
                role="gridcell"
                className={cn(
                  "px-1.5 sm:px-2 text-right tabular-nums",
                  index === months.length - 1 && "pr-4 sm:pr-6",
                )}
              >
                {value}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
