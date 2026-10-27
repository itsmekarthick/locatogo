"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Plural noun for the summary, e.g. "companies". */
  itemLabel?: string;
  className?: string;
};

function pageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (currentPage > 3) pages.push("...");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

const controlClasses =
  "focus-ring inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-line-strong bg-surface-1 px-3 text-sm font-medium text-fg transition-ui hover:bg-surface-3 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 pointer-coarse:h-11";

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "places",
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-col items-center justify-between gap-3 border-t border-line pt-4 sm:flex-row", className)}
    >
      <p className="text-sm text-fg-muted">
        Showing <span className="font-medium tabular-nums text-fg">{startItem}</span> to{" "}
        <span className="font-medium tabular-nums text-fg">{endItem}</span> of{" "}
        <span className="font-medium tabular-nums text-fg">{totalItems.toLocaleString("en-US")}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={controlClasses}>
          <ChevronLeftIcon className="size-4" />
          Prev
        </button>

        {pageNumbers(currentPage, totalPages).map((page, index) => {
          if (page === "...") {
            return (
              <span key={`dots-${index}`} className="select-none px-1 text-sm text-fg-subtle">
                …
              </span>
            );
          }
          const number = page as number;
          const active = currentPage === number;
          return (
            <button
              key={number}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onPageChange(number)}
              className={cn(
                controlClasses,
                "w-9 px-0 tabular-nums pointer-coarse:w-11",
                active && "border-accent bg-accent text-accent-fg hover:bg-accent-hover",
              )}
            >
              {number}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={controlClasses}
        >
          Next
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </nav>
  );
}
