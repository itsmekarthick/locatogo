"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircleIcon, ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, RefreshIcon, RowsIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

export type Density = "comfortable" | "compact";
type SortDir = "asc" | "desc";

export type Column<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Makes the header a sort control. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: "left" | "right";
  className?: string;
  /** Hides the column below a breakpoint to keep narrow tables readable. */
  hideBelow?: "sm" | "md" | "lg";
};

const HIDE: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "max-sm:hidden",
  md: "max-md:hidden",
  lg: "max-lg:hidden",
};

const DENSITY_KEY = "locatogo_admin_density";
const DENSITY_EVENT = "locatogo:admin-density";

function subscribeDensity(onChange: () => void) {
  window.addEventListener(DENSITY_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DENSITY_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Row density, remembered per browser and shared by every table. */
export function useDensity() {
  const density = useSyncExternalStore<Density>(
    subscribeDensity,
    () => (window.localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable"),
    () => "comfortable",
  );
  const setDensity = useCallback((next: Density) => {
    window.localStorage.setItem(DENSITY_KEY, next);
    window.dispatchEvent(new Event(DENSITY_EVENT));
  }, []);
  return [density, setDensity] as const;
}

function compare(a: string | number | null | undefined, b: string | number | null | undefined) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

type DataTableProps<T> = {
  /** Accessible name for the table. */
  caption: string;
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Filters and search controls, shown above the table. */
  toolbar?: ReactNode;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  loading?: boolean;
  error?: { message: string; onRetry?: () => void } | null;
  empty: ReactNode;
  pageSize?: number;
  defaultSort?: { id: string; dir: SortDir };
  rowClassName?: (row: T) => string | undefined;
  /** Resets to the first page when this value changes, e.g. a serialised filter state. */
  resetKey?: string;
  className?: string;
};

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  toolbar,
  selectable = false,
  selected,
  onSelectedChange,
  loading = false,
  error,
  empty,
  pageSize = 10,
  defaultSort,
  rowClassName,
  resetKey,
  className,
}: DataTableProps<T>) {
  const [density, setDensity] = useDensity();
  const [sort, setSort] = useState<{ id: string; dir: SortDir } | null>(defaultSort ?? null);
  const [page, setPage] = useState({ index: 1, key: resetKey });
  const selectAllRef = useRef<HTMLInputElement>(null);

  // A new filter state starts on page one without an effect: the key is compared during render.
  const pageIndex = page.key === resetKey ? page.index : 1;

  const sorted = useMemo(() => {
    const column = sort ? columns.find((c) => c.id === sort.id) : null;
    if (!sort || !column?.sortValue) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    const value = column.sortValue;
    return [...rows].sort((a, b) => factor * compare(value(a), value(b)));
  }, [rows, columns, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(pageIndex, totalPages);
  const visible = useMemo(() => sorted.slice((current - 1) * pageSize, current * pageSize), [sorted, current, pageSize]);

  const selectedCount = visible.filter((row) => selected?.has(getRowId(row))).length;
  const allSelected = visible.length > 0 && selectedCount === visible.length;
  const someSelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  function toggleAll() {
    if (!onSelectedChange) return;
    const next = new Set(selected);
    for (const row of visible) {
      if (allSelected) next.delete(getRowId(row));
      else next.add(getRowId(row));
    }
    onSelectedChange(next);
  }

  function toggleRow(id: string) {
    if (!onSelectedChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  }

  function cycleSort(id: string) {
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, dir: "asc" };
      if (prev.dir === "asc") return { id, dir: "desc" };
      return null;
    });
  }

  const cellPadding = density === "compact" ? "px-4 py-2" : "px-4 py-3.5";
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-surface-1 elev-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">{toolbar}</div>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="text-xs text-fg-subtle">
            {loading ? "Loading" : `${rows.length.toLocaleString("en-US")} ${rows.length === 1 ? "row" : "rows"}`}
          </span>
          <Tooltip content={density === "compact" ? "Switch to comfortable rows" : "Switch to compact rows"}>
            <button
              type="button"
              aria-pressed={density === "compact"}
              aria-label="Compact rows"
              onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
              className={cn(
                "focus-ring grid size-9 place-items-center rounded-lg border text-lg transition-ui pointer-coarse:size-11",
                density === "compact" ? "border-accent/40 bg-accent-soft text-accent-text" : "border-line-strong bg-surface-1 text-fg-muted hover:bg-surface-3",
              )}
            >
              <RowsIcon />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="max-h-[min(72dvh,44rem)] overflow-auto overscroll-contain" tabIndex={0} role="region" aria-label={`${caption}, scrollable`}>
        <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className="sticky top-0 z-10 w-12 border-b border-line bg-surface-2 px-4 py-2.5">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={visible.length === 0}
                    aria-label="Select all rows on this page"
                    className="size-4 cursor-pointer rounded accent-[var(--accent)]"
                  />
                </th>
              )}
              {columns.map((column) => {
                const active = sort?.id === column.id;
                const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : column.sortValue ? "none" : undefined;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      "sticky top-0 z-10 whitespace-nowrap border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-fg-subtle",
                      column.align === "right" && "text-right",
                      column.hideBelow && HIDE[column.hideBelow],
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => cycleSort(column.id)}
                        className={cn(
                          "focus-ring -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 uppercase tracking-wider transition-colors hover:text-fg",
                          active && "text-fg",
                        )}
                      >
                        {column.header}
                        {active ? sort.dir === "asc" ? <ArrowUpIcon className="size-3.5" /> : <ArrowDownIcon className="size-3.5" /> : <ChevronsUpDownIcon className="size-3.5 opacity-60" />}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} aria-hidden="true">
                  {selectable && (
                    <td className={cn("border-b border-line", cellPadding)}>
                      <Skeleton className="size-4" />
                    </td>
                  )}
                  {columns.map((column, c) => (
                    <td key={column.id} className={cn("border-b border-line", cellPadding, column.hideBelow && HIDE[column.hideBelow])}>
                      <Skeleton className={cn("h-4", c === 0 ? "w-48" : "w-24")} />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={colSpan}>
                  <div role="alert">
                    <EmptyState
                      icon={<AlertCircleIcon />}
                      title="Couldn't load this table"
                      description={error.message}
                      action={
                        error.onRetry && (
                          <Button variant="secondary" leadingIcon={<RefreshIcon className="size-4" />} onClick={error.onRetry}>
                            Try again
                          </Button>
                        )
                      }
                    />
                  </div>
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={colSpan}>{empty}</td>
              </tr>
            ) : (
              visible.map((row) => {
                const id = getRowId(row);
                const isSelected = Boolean(selected?.has(id));
                return (
                  <tr key={id} data-selected={isSelected || undefined} className={cn("group transition-colors hover:bg-surface-3/60 data-[selected]:bg-accent-soft/50", rowClassName?.(row))}>
                    {selectable && (
                      <td className={cn("border-b border-line", cellPadding)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          aria-label="Select row"
                          className="size-4 cursor-pointer rounded accent-[var(--accent)]"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn("border-b border-line align-middle", cellPadding, column.align === "right" && "text-right", column.hideBelow && HIDE[column.hideBelow], column.className)}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && sorted.length > pageSize && (
        <div className="border-t border-line px-4 pb-4">
          <Pagination currentPage={current} totalPages={totalPages} totalItems={sorted.length} pageSize={pageSize} onPageChange={(index) => setPage({ index, key: resetKey })} />
        </div>
      )}
    </div>
  );
}
