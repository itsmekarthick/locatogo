import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminClaimsList } from "@/components/admin-claims-list";

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
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Ownership & Verification</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
          Listing Claims
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Manage business owners requesting official management rights to their listings.
        </p>
      </div>

      <AdminClaimsList claims={claims ?? []} />
    </div>
  );
}
