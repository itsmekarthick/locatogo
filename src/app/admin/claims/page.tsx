import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminClaimsList } from "@/components/admin-claims-list";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function ClaimsPage() {
  const { supabase, tenant } = await requireTenantContext();
  const { data: claims } = await supabase
    .from("listing_claims")
    .select("id, listing_id, user_id, submitted_information, submitted_at, listings(title, slug)")
    .eq("tenant_id", tenant.id)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Ownership and verification"
        title="Listing claims"
        description="Manage business owners requesting official management rights to their listings."
      />

      <AdminClaimsList claims={claims ?? []} />
    </div>
  );
}
