"use client";

import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";

type AdSlotItem = {
  id: string;
  sponsor_name: string;
  slot_type: string;
  status: string;
  price_paid: number;
  start_date: string;
  end_date: string;
};

const PAGE_SIZE = 6;

export function AdminAdvertisingList({ slots }: { slots: AdSlotItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(slots.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return slots.slice(start, start + PAGE_SIZE);
  }, [slots, currentPage]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginated.length > 0 ? (
          paginated.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--background)] p-4 text-xs"
            >
              <div>
                <h3 className="font-bold text-[var(--foreground)] text-sm">{slot.sponsor_name}</h3>
                <p className="mt-0.5 text-[var(--ink-muted)]">
                  Type: <span className="capitalize">{slot.slot_type}</span> · Revenue: ${slot.price_paid}
                </p>
              </div>
              <span className="rounded-full bg-[var(--leaf)] px-3 py-1 text-xs font-bold text-[var(--leaf-dark)] uppercase">
                {slot.status}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center text-xs text-[var(--ink-muted)]">
            No active ad placements found. Sponsorship slots are enabled automatically when sponsors purchase featured tier placements.
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={slots.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

