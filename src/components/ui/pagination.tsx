"use client";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses if needed
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 border-t border-[var(--line)] pt-4 sm:flex-row ${className}`}
    >
      <p className="text-xs text-[var(--ink-muted)]">
        Showing <span className="font-semibold text-[var(--foreground)]">{startItem}</span> to{" "}
        <span className="font-semibold text-[var(--foreground)]">{endItem}</span> of{" "}
        <span className="font-semibold text-[var(--foreground)]">{totalItems}</span> results
      </p>

      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>

        {/* Number Buttons */}
        {getPageNumbers().map((page, idx) => {
          if (page === "...") {
            return (
              <span key={`dots-${idx}`} className="px-2 text-xs text-[var(--ink-muted)]">
                …
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = currentPage === pageNum;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-[var(--foreground)] text-[var(--paper)] shadow-xs"
                  : "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

