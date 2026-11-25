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
import { keyAction } from "@/lib/treegrid-nav";

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

export function TreeGrid({
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

  // Opens the ancestors of the selection, never the selection itself.
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

  const focusRow = useCallback((id: string, options?: FocusOptions) => {
    setFocusedId(id);
    rowRefs.current.get(id)?.focus(options);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, row: FlatRow) => {
    const action = keyAction(rows, row, event.key);
    // A keypress aimed at the nested chevron must not select the row.
    if (!action || (action.kind === "select" && event.target !== event.currentTarget)) {
      return;
    }

    event.preventDefault();
    const dispatch = { focus: focusRow, toggle, select: onSelect };
    dispatch[action.kind](action.id);
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
          <TreeRow
            key={row.id}
            row={row}
            selectedId={selectedId}
            focusedId={focusedId}
            months={months}
            onRowRef={(element) => {
              if (element) {
                rowRefs.current.set(row.id, element);
              } else {
                rowRefs.current.delete(row.id);
              }
            }}
            onSelect={onSelect}
            onToggle={toggle}
            onFocus={focusRow}
            onKeyDown={handleKeyDown}
          />
        ))}
      </TableBody>
    </Table>
  );
}

type TreeRowProps = {
  row: FlatRow;
  selectedId: string;
  focusedId: string;
  months: ReadonlyArray<{ full: string; short: string }>;
  onRowRef: (element: HTMLTableRowElement | null) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onFocus: (id: string, options?: FocusOptions) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>, row: FlatRow) => void;
};

// Mixing the token 25% into --card keeps one ink legible across the palette.
function AdviserAvatar({ name, posInSet }: { name: string; posInSet: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium leading-none text-foreground"
      style={
        {
          "--avatar-color": `var(--chart-${posInSet})`,
          backgroundColor: "color-mix(in oklab, var(--avatar-color) 25%, var(--card))",
        } as React.CSSProperties
      }
    >
      {initials(name)}
    </span>
  );
}

function ExpandButton({
  row,
  onToggle,
  onFocus,
}: {
  row: FlatRow;
  onToggle: (id: string) => void;
  onFocus: (id: string, options?: FocusOptions) => void;
}) {
  const label = `${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`;

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      className="inline-flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-foreground/10"
      // Pointer only, so the row stays the only focus target.
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(row.id);
        onFocus(row.id, { focusVisible: false });
      }}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <Chevron expanded={row.isExpanded} />
    </button>
  );
}

function RowNameCell({
  row,
  selected,
  onToggle,
  onFocus,
}: {
  row: FlatRow;
  selected: boolean;
  onToggle: (id: string) => void;
  onFocus: (id: string, options?: FocusOptions) => void;
}) {
  return (
    <TableCell
      role="gridcell"
      className={cn(
        "sticky left-0 z-10 w-[clamp(160px,48vw,296px)] min-w-[clamp(160px,48vw,296px)] max-w-[clamp(160px,48vw,296px)] bg-card px-1.5 sm:px-2 group-hover:bg-muted border-b border-border group-last:border-b-0 after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border sm:after:hidden group-focus-visible:shadow-[inset_2px_2px_0_0_var(--color-ring),inset_0_-2px_0_0_var(--color-ring)]",
        // Design has no selected state: a tint read as a band and weight reflows the name.
        selected &&
          "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-foreground before:content-['']",
      )}
    >
      <div
        className="flex min-w-0 items-center gap-1.5 sm:gap-2"
        style={{ paddingInlineStart: `calc(var(--row-indent) * ${row.level - 1})` }}
      >
        {row.hasChildren ? (
          <ExpandButton row={row} onToggle={onToggle} onFocus={onFocus} />
        ) : (
          <span aria-hidden="true" className="inline-block h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
        )}
        {row.kind === "advisor" ? <AdviserAvatar name={row.name} posInSet={row.posInSet} /> : null}
        <span className="min-w-0 flex-1 truncate" title={row.name}>
          {row.name}
        </span>
      </div>
    </TableCell>
  );
}

function RowValueCells({
  values,
  months,
}: {
  values: readonly number[];
  months: ReadonlyArray<{ full: string; short: string }>;
}) {
  const lastIndex = months.length - 1;

  return values.map((value, index) => (
    <TableCell
      key={months[index]?.full}
      role="gridcell"
      className={cn(
        "px-1.5 sm:px-2 text-right tabular-nums",
        index === lastIndex && "pr-4 sm:pr-6",
      )}
    >
      {value}
    </TableCell>
  ));
}

// data-[state=selected]:hover is needed because hover loses to the transparent resting rule.
const ROW_CLASSES =
  "group h-12 sm:h-14 hover:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-[-2px] focus-visible:outline-ring data-[state=selected]:bg-transparent data-[state=selected]:hover:bg-muted";

function TreeRow({
  row,
  selectedId,
  focusedId,
  months,
  onRowRef,
  onSelect,
  onToggle,
  onFocus,
  onKeyDown,
}: TreeRowProps) {
  const isSelected = row.id === selectedId;

  return (
    <TableRow
      ref={onRowRef}
      role="row"
      aria-label={row.name}
      aria-level={row.level}
      aria-posinset={row.posInSet}
      aria-setsize={row.setSize}
      aria-expanded={row.hasChildren ? row.isExpanded : undefined}
      aria-selected={isSelected}
      tabIndex={row.id === focusedId ? 0 : -1}
      data-state={isSelected ? "selected" : undefined}
      className={ROW_CLASSES}
      onClick={() => {
        onFocus(row.id, { focusVisible: false });
        onSelect(row.id);
      }}
      onDoubleClick={() => {
        onSelect(row.id);
        onToggle(row.id);
      }}
      onFocus={() => onFocus(row.id)}
      onKeyDown={(event) => onKeyDown(event, row)}
    >
      <RowNameCell row={row} selected={isSelected} onToggle={onToggle} onFocus={onFocus} />
      <RowValueCells values={row.node.values} months={months} />
    </TableRow>
  );
}
