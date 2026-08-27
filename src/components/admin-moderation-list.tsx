"use client";

import { useState, useMemo } from "react";
import { reviewSubmission } from "@/app/admin/actions";
import { Pagination } from "@/components/ui/pagination";

type SubmissionItem = {
  id: string;
  submitted_email: string;
  payload_json: any;
  status: string;
  submitted_at: string;
};

const PAGE_SIZE = 5;

export function AdminModerationList({ submissions }: { submissions: SubmissionItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(submissions.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return submissions.slice(start, start + PAGE_SIZE);
  }, [submissions, currentPage]);

  return (
    <div className="space-y-4">
      {paginated.length > 0 ? (
        paginated.map((submission) => {
          const payload = submission.payload_json as {
            name?: string;
            city?: string;
            description?: string;
            email?: string;
          } | null;
          return (
            <article
              key={submission.id}
              className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Pending Review
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-bold text-[var(--foreground)]">
                    {payload?.name ?? "Unnamed submission"}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    Submitted by:{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {submission.submitted_email}
                    </span>{" "}
                    · Locality: {payload?.city || "Not specified"} · Date:{" "}
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {payload?.description && (
                <div className="mt-4 rounded-2xl bg-[var(--background)] p-4 text-xs leading-6 text-[var(--foreground)]">
                  <p className="font-bold text-[var(--ink-muted)] uppercase text-[10px] tracking-wider mb-1">
                    Curation Note:
                  </p>
                  {payload.description}
                </div>
              )}

              <form
                action={reviewSubmission}
                className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4"
              >
                <input type="hidden" name="submissionId" value={submission.id} />
                <button
                  name="status"
                  value="approved"
                  className="rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-bold text-[var(--paper)] shadow-xs hover:bg-[var(--foreground)]/85 transition-all cursor-pointer"
                >
                  ✓ Approve & Publish
                </button>
                <button
                  name="status"
                  value="changes_requested"
                  className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background)] transition-colors cursor-pointer"
                >
                  Request Info
                </button>
                <button
                  name="status"
                  value="rejected"
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  ✕ Reject
                </button>
              </form>
            </article>
          );
        })
      ) : (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-12 text-center">
          <p className="text-2xl">🛡️</p>
          <h3 className="mt-3 font-display text-lg font-bold text-[var(--foreground)]">Queue is clean</h3>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            No pending community submissions require moderation at this time.
          </p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={submissions.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

