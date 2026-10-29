"use client";

import { useMemo, useState, useTransition } from "react";
import { reviewSubmission } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckIcon, MessageIcon, ShieldCheckIcon, XIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";

type SubmissionItem = {
  id: string;
  submitted_email: string;
  payload_json: any;
  status: string;
  submitted_at: string;
};

type Status = "approved" | "changes_requested" | "rejected";

const PAGE_SIZE = 5;
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const OUTCOME: Record<Status, string> = {
  approved: "approved and published",
  changes_requested: "sent back for more information",
  rejected: "rejected",
};

export function AdminModerationList({ submissions }: { submissions: SubmissionItem[] }) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; name: string } | null>(null);
  const [, startTransition] = useTransition();

  const totalPages = Math.ceil(submissions.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return submissions.slice(start, start + PAGE_SIZE);
  }, [submissions, currentPage]);

  function review(id: string, status: Status, name: string) {
    setBusyId(id);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("submissionId", id);
        formData.set("status", status);
        await reviewSubmission(formData);
        toast({ title: `${name} ${OUTCOME[status]}`, variant: "success" });
      } catch (error) {
        toast({ title: "The review wasn't saved", description: error instanceof Error ? error.message : "Please try again.", variant: "error" });
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {paginated.length > 0 ? (
        paginated.map((submission) => {
          const payload = submission.payload_json as { name?: string; city?: string; description?: string; email?: string } | null;
          const name = payload?.name ?? "Unnamed submission";
          const busy = busyId === submission.id;
          return (
            <article key={submission.id} className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
              <Badge variant="warning" dot>
                Pending review
              </Badge>
              <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-fg">{name}</h2>
              <p className="mt-1 text-sm text-fg-muted">
                Submitted by <span className="font-medium text-fg">{submission.submitted_email}</span> · {payload?.city || "Locality not specified"} ·{" "}
                {dateFormat.format(new Date(submission.submitted_at))}
              </p>

              {payload?.description && (
                <div className="mt-4 rounded-xl bg-surface-2 p-4 text-sm leading-relaxed text-fg">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-fg-subtle">Curation note</p>
                  {payload.description}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <Button loading={busy} leadingIcon={<CheckIcon className="size-4" />} onClick={() => review(submission.id, "approved", name)}>
                  Approve and publish
                </Button>
                <Button variant="secondary" disabled={busy} leadingIcon={<MessageIcon className="size-4" />} onClick={() => review(submission.id, "changes_requested", name)}>
                  Request info
                </Button>
                <Button variant="secondary" disabled={busy} className="text-danger" leadingIcon={<XIcon className="size-4" />} onClick={() => setRejecting({ id: submission.id, name })}>
                  Reject
                </Button>
              </div>
            </article>
          );
        })
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface-1">
          <EmptyState icon={<ShieldCheckIcon />} title="Queue is clean" description="No pending community submissions need moderation right now." />
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={submissions.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />

      <ConfirmDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Reject this submission?"
        description={rejecting ? `${rejecting.name} won't be published and the submission will be closed.` : undefined}
        confirmLabel="Reject submission"
        onConfirm={() => {
          if (rejecting) review(rejecting.id, "rejected", rejecting.name);
          setRejecting(null);
        }}
      />
    </div>
  );
}
