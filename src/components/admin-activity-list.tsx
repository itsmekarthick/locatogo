"use client";

import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";

type AuditLogItem = {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  created_at: string;
};

const PAGE_SIZE = 10;

export function AdminActivityList({ logs }: { logs: AuditLogItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, currentPage]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
      <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 border-b border-[var(--line)] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)] bg-[var(--background)]/50">
        <span>Action / Entity</span>
        <span>Entity ID</span>
        <span>Timestamp</span>
      </div>

      <div className="divide-y divide-[var(--line)]">
        {paginated.length > 0 ? (
          paginated.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-[1.5fr_1fr_1fr] items-center gap-4 px-5 py-4 text-sm"
            >
              <div>
                <p className="font-semibold">{log.action}</p>
                <p className="mt-0.5 text-xs text-[var(--ink-muted)] capitalize">{log.entity_type}</p>
              </div>
              <span className="font-mono text-xs text-[var(--ink-muted)] truncate">
                {log.entity_id || "—"}
              </span>
              <span className="text-xs text-[var(--ink-muted)]">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))
        ) : (
          <div className="flex min-h-56 items-center justify-center px-5 text-center text-sm text-[var(--ink-muted)]">
            No logged activity yet. Changes to listings and directory items will appear here automatically.
          </div>
        )}
      </div>

      {logs.length > PAGE_SIZE && (
        <div className="px-5 pb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={logs.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

