import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminModerationList } from "@/components/admin-moderation-list";

export default async function ModerationPage() {
  const { supabase, tenant } = await requireTenantContext();
  const { data: submissions } = await supabase
    .from("listing_submissions")
    .select("id, submitted_email, payload_json, status, submitted_at")
    .eq("tenant_id", tenant.id)
    .eq("status", "pending_review")
    .order("submitted_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Review Queue</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
          Community Submissions
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Review places suggested by public visitors before they appear live on your directory.
        </p>
      </div>

      <AdminModerationList submissions={submissions ?? []} />
    </div>
  );
}
