import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminModerationList } from "@/components/admin-moderation-list";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

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
      <AdminPageHeader
        eyebrow="Review queue"
        title="Community submissions"
        description="Review places suggested by public visitors before they appear live on your directory."
      />

      <AdminModerationList submissions={submissions ?? []} />
    </div>
  );
}
