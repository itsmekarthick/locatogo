"use client";

import { useState, useMemo } from "react";
import { reviewClaim } from "@/app/admin/actions";
import { Pagination } from "@/components/ui/pagination";

type ClaimItem = {
  id: string;
  listing_id: string;
  user_id: string;
  submitted_information: any;
  submitted_at: string;
  listings: any;
};

const PAGE_SIZE = 5;

export function AdminClaimsList({ claims }: { claims: ClaimItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(claims.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return claims.slice(start, start + PAGE_SIZE);
  }, [claims, currentPage]);

  return (
    <div className="space-y-4">
      {paginated.length > 0 ? (
        paginated.map((claim) => {
          const listing = Array.isArray(claim.listings)
            ? claim.listings[0]
            : (claim.listings as { title?: string; slug?: string } | null);
          const info =
            typeof claim.submitted_information === "string"
              ? claim.submitted_information
              : (claim.submitted_information as { note?: string } | null)?.note;
          return (
            <article
              key={claim.id}
              className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    Ownership Verification Request
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-bold text-[var(--foreground)]">
                    {listing?.title ?? `Listing #${claim.listing_id.slice(0, 8)}`}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    Claimant User:{" "}
                    <span className="font-mono text-[11px] text-[var(--foreground)]">{claim.user_id}</span>{" "}
                    · Submitted: {new Date(claim.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {info && (
                <div className="mt-4 rounded-2xl bg-[var(--background)] p-4 text-xs leading-6 text-[var(--foreground)]">
                  <p className="font-bold text-[var(--ink-muted)] uppercase text-[10px] tracking-wider mb-1">
                    Claimant Verification Statement:
                  </p>
                  {info}
                </div>
              )}

              <form
                action={reviewClaim}
                className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4"
              >
                <input type="hidden" name="claimId" value={claim.id} />
                <button
                  name="status"
                  value="approved"
                  className="rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-bold text-[var(--paper)] shadow-xs hover:bg-[var(--foreground)]/85 transition-all cursor-pointer"
                >
                  ✓ Grant Ownership Rights
                </button>
                <button
                  name="status"
                  value="rejected"
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  ✕ Reject Claim
                </button>
              </form>
            </article>
          );
        })
      ) : (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-12 text-center">
          <p className="text-2xl">🤝</p>
          <h3 className="mt-3 font-display text-lg font-bold text-[var(--foreground)]">No pending claims</h3>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            When business owners claim their listings, their verification details will appear here.
          </p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={claims.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

