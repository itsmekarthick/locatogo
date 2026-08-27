import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminAdvertisingList } from "@/components/admin-advertising-list";

export default async function AdvertisingPage() {
  const { supabase, tenant } = await requireTenantContext();
  const { data: slots } = await supabase
    .from("ad_slots")
    .select("id, sponsor_name, slot_type, status, price_paid, start_date, end_date")
    .eq("tenant_id", tenant.id)
    .order("start_date", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Monetization & Growth</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
          Advertising & Sponsorships
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Manage featured placements, top-of-category banners, and partner campaigns.
        </p>
      </div>

      {/* Ad Placements List */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
        <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-1">Active Sponsor Placements</h2>
        <p className="mb-6 text-xs text-[var(--ink-muted)]">Configured placement slots across your public directories.</p>

        <AdminAdvertisingList slots={slots ?? []} />
      </div>
    </div>
  );
}
