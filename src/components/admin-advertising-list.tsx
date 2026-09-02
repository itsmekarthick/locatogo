"use client";

import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { updateAdSlotStatusAction, deleteAdSlotAction } from "@/app/admin/actions";

export type AdSlotItem = {
  id: string;
  sponsor_name: string;
  title?: string | null;
  description?: string | null;
  slot_type: string;
  status: string;
  price_paid: number;
  start_date: string;
  end_date: string;
  banner_url?: string | null;
  target_url?: string | null;
  cta_text?: string | null;
  badge_text?: string | null;
};

const PAGE_SIZE = 6;

export function AdminAdvertisingList({ slots }: { slots: AdSlotItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return slots.filter((slot) => {
      if (filterStatus !== "all" && slot.status !== filterStatus) return false;
      return true;
    });
  }, [slots, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const handleToggleStatus = async (slot: AdSlotItem) => {
    setProcessingId(slot.id);
    try {
      const nextStatus = slot.status === "active" ? "draft" : "active";
      await updateAdSlotStatusAction(slot.id, nextStatus);
    } catch (e: any) {
      alert(e.message || "Failed to toggle ad status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this ad slot campaign?")) return;
    setProcessingId(slotId);
    try {
      await deleteAdSlotAction(slotId);
    } catch (e: any) {
      alert(e.message || "Failed to delete ad slot");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
        {["all", "active", "draft", "expired"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilterStatus(s);
              setCurrentPage(1);
            }}
            className={`rounded-full px-3.5 py-1 text-xs font-bold capitalize transition-all cursor-pointer ${
              filterStatus === s
                ? "bg-[var(--foreground)] text-[var(--paper)]"
                : "text-[var(--ink-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {paginated.length > 0 ? (
          paginated.map((slot) => {
            const isLive = slot.status === "active";
            const slotTypeLabel = slot.slot_type.replace(/_/g, " ");

            return (
              <div
                key={slot.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--background)] p-4 text-xs shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Thumbnail / Emblem */}
                  {slot.banner_url ? (
                    <div className="h-14 w-20 rounded-xl overflow-hidden shrink-0 border border-[var(--line)] bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slot.banner_url}
                        alt={slot.sponsor_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg shrink-0 shadow-2xs">
                      📢
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--foreground)] text-sm">
                        {slot.sponsor_name}
                      </span>
                      <span className="rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {slotTypeLabel}
                      </span>
                      {slot.badge_text && (
                        <span className="rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 text-[9px] font-bold">
                          {slot.badge_text}
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-xs text-[var(--foreground)] mt-0.5 truncate">
                      {slot.title || "No headline"}
                    </h4>

                    <p className="mt-1 text-[11px] text-[var(--ink-muted)] flex items-center gap-2 flex-wrap">
                      <span>
                        Schedule:{" "}
                        <span className="font-mono font-medium">
                          {new Date(slot.start_date).toLocaleDateString()} → {new Date(slot.end_date).toLocaleDateString()}
                        </span>
                      </span>
                      <span>·</span>
                      <span>
                        Value:{" "}
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          ${Number(slot.price_paid).toFixed(2)}
                        </span>
                      </span>
                      {slot.target_url && (
                        <>
                          <span>·</span>
                          <a
                            href={slot.target_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Destination ↗
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isLive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {slot.status}
                  </span>

                  <button
                    type="button"
                    disabled={processingId === slot.id}
                    onClick={() => handleToggleStatus(slot)}
                    className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLive ? "Pause" : "Activate"}
                  </button>

                  <button
                    type="button"
                    disabled={processingId === slot.id}
                    onClick={() => handleDelete(slot.id)}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center text-xs text-[var(--ink-muted)]">
            No ad placements found matching this filter. Click &quot;+ Create Advertisement&quot; above to launch a new campaign.
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
