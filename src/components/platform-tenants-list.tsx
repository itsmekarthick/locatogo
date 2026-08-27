"use client";

import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";

type TenantItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
};

const PAGE_SIZE = 8;

export function PlatformTenantsList({ tenants }: { tenants: TenantItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(tenants.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return tenants.slice(start, start + PAGE_SIZE);
  }, [tenants, currentPage]);

  return (
    <div className="space-y-4">
      <div className="divide-y divide-[var(--line)]">
        {paginated.length > 0 ? (
          paginated.map((tenant) => (
            <div key={tenant.id} className="flex items-center justify-between py-4">
              <div>
                <h3 className="font-bold text-sm text-[var(--foreground)]">{tenant.name}</h3>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)] font-mono">
                  slug: /{tenant.slug} · id: {tenant.id.slice(0, 8)}...
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[var(--ink-muted)]">
                  Joined {new Date(tenant.created_at).toLocaleDateString()}
                </span>
                <span className="rounded-full bg-[var(--leaf)] px-3 py-1 text-xs font-bold text-[var(--leaf-dark)] uppercase">
                  {tenant.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-[var(--ink-muted)]">
            No tenants registered yet.
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={tenants.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

