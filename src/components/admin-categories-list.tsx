"use client";

import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  domain_id: string;
};

type DomainItem = {
  id: string;
  name: string;
};

const PAGE_SIZE = 6;

export function AdminCategoriesList({
  categories,
  domains,
}: {
  categories: CategoryItem[];
  domains: DomainItem[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return categories.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    });
  }, [categories, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const domainMap = useMemo(() => {
    return new Map(domains.map((d) => [d.id, d.name]));
  }, [domains]);

  return (
    <div className="space-y-4">
      {categories.length > 5 && (
        <div className="flex justify-end">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter categories..."
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--ink-muted)] focus:outline-none"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {paginated.length > 0 ? (
          paginated.map((category) => {
            const icon =
              category.name.includes("School") || category.name.includes("Education")
                ? "🏫"
                : category.name.includes("Hospital") || category.name.includes("Health")
                ? "🏥"
                : "🏷️";
            return (
              <article
                key={category.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--foreground)]">{category.name}</h3>
                    <p className="mt-0.5 font-mono text-xs text-[var(--ink-muted)]">/{category.slug}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                  Active
                </span>
              </article>
            );
          })
        ) : (
          <div className="sm:col-span-2 rounded-2xl border border-dashed border-[var(--line)] p-10 text-center text-sm text-[var(--ink-muted)]">
            No categories found matching criteria.
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

