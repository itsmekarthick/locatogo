import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminAdCreationForm } from "@/components/admin-ad-creation-form";

export default async function NewAdvertisementPage() {
  const { supabase, tenant } = await requireTenantContext();

  // Fetch tenant listings so admin can optionally link an ad to a listing
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, locality, city")
    .eq("tenant_id", tenant.id)
    .eq("status", "published")
    .order("title")
    .limit(100);

  // Fetch tenant domains
  const { data: domains } = await supabase
    .from("domains")
    .select("id, name")
    .eq("tenant_id", tenant.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)]">
            <Link href="/admin/advertising" className="hover:text-[var(--foreground)] transition-colors">
              ← Advertising & Sponsorships
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">New Ad Campaign</span>
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Create Advertisement
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Configure partner banners, featured spots, and promotional campaigns across public directories.
          </p>
        </div>

        <Link
          href="/admin/advertising"
          className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors shadow-2xs"
        >
          Cancel
        </Link>
      </div>

      <AdminAdCreationForm
        domains={domains ?? []}
        listings={listings ?? []}
      />
    </div>
  );
}
