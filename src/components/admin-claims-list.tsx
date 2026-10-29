"use client";

import { useMemo, useState, useTransition } from "react";
import { reviewClaim } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BuildingIcon, CheckIcon, XIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";

type ClaimItem = {
  id: string;
  listing_id: string;
  user_id: string;
  submitted_information: any;
  submitted_at: string;
  listings: any;
};

const PAGE_SIZE = 5;
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function AdminClaimsList({ claims }: { claims: ClaimItem[] }) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; title: string } | null>(null);
  const [, startTransition] = useTransition();

  const totalPages = Math.ceil(claims.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return claims.slice(start, start + PAGE_SIZE);
  }, [claims, currentPage]);

  function review(id: string, status: "approved" | "rejected", title: string) {
    setBusyId(id);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("claimId", id);
        formData.set("status", status);
        await reviewClaim(formData);
        toast({ title: status === "approved" ? `Ownership granted for ${title}` : `Claim rejected for ${title}`, variant: "success" });
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
        paginated.map((claim) => {
          const listing = Array.isArray(claim.listings) ? claim.listings[0] : (claim.listings as { title?: string; slug?: string } | null);
          const info =
            typeof claim.submitted_information === "string"
              ? claim.submitted_information
              : (claim.submitted_information as { note?: string } | null)?.note;
          const title = listing?.title ?? `Listing #${claim.listing_id.slice(0, 8)}`;
          const busy = busyId === claim.id;
          return (
            <article key={claim.id} className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
              <Badge variant="accent" icon={<BuildingIcon className="size-3.5" />}>
                Ownership verification request
              </Badge>
              <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-fg">{title}</h2>
              <p className="mt-1 text-sm text-fg-muted">
                Claimant <span className="font-mono text-xs text-fg">{claim.user_id}</span> · Submitted {dateFormat.format(new Date(claim.submitted_at))}
              </p>

              {info && (
                <div className="mt-4 rounded-xl bg-surface-2 p-4 text-sm leading-relaxed text-fg">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-fg-subtle">Claimant statement</p>
                  {info}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <Button loading={busy} leadingIcon={<CheckIcon className="size-4" />} onClick={() => review(claim.id, "approved", title)}>
                  Grant ownership
                </Button>
                <Button variant="secondary" disabled={busy} className="text-danger" leadingIcon={<XIcon className="size-4" />} onClick={() => setRejecting({ id: claim.id, title })}>
                  Reject claim
                </Button>
              </div>
            </article>
          );
        })
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface-1">
          <EmptyState icon={<BuildingIcon />} title="No pending claims" description="When business owners claim their listings, their verification details will appear here." />
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={claims.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />

      <ConfirmDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Reject this claim?"
        description={rejecting ? `${rejecting.title} will stay without a verified owner and the claimant's request will be closed.` : undefined}
        confirmLabel="Reject claim"
        onConfirm={() => {
          if (rejecting) review(rejecting.id, "rejected", rejecting.title);
          setRejecting(null);
        }}
      />
    </div>
  );
}
