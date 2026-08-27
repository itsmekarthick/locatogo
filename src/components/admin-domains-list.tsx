"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";

type DomainItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
};

const PAGE_SIZE = 6;

export function AdminDomainsList({ domains }: { domains: DomainItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(domains.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return domains.slice(start, start + PAGE_SIZE);
  }, [domains, currentPage]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {paginated.length > 0 ? (
          paginated.map((domain) => (
            <article
              key={domain.id}
              className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xs"
            >
              <div>
                <h3 className="font-semibold text-sm text-[var(--foreground)]">{domain.name}</h3>
                <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">/{domain.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/${domain.slug}`}
                  target="_blank"
                  className="rounded-full border border-[var(--line)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--coral)] hover:bg-[var(--line)] transition-colors"
                >
                  View public ↗
                </Link>
                <span className="rounded-full bg-[var(--leaf)] px-3 py-1 text-xs font-semibold text-[var(--leaf-dark)] capitalize">
                  {domain.status}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="sm:col-span-2 rounded-2xl border border-dashed border-[var(--line)] p-10 text-center text-sm text-[var(--ink-muted)]">
            No domains found.
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={domains.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

