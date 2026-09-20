import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminAdvertisingList } from "@/components/admin-advertising-list";

export default async function AdvertisingPage() {
  const { supabase, tenant } = await requireTenantContext();

  const [{ data: slots }, { count: impressionCount }, { count: clickCount }] = await Promise.all([
    supabase
      .from("ad_slots")
      .select("id, sponsor_name, title, description, slot_type, status, price_paid, start_date, end_date, banner_url, target_url, cta_text, badge_text")
      .eq("tenant_id", tenant.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("ad_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("event_type", "impression"),
    supabase
      .from("ad_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("event_type", "click"),
  ]);

  const activeCount = (slots ?? []).filter((s) => s.status === "active").length;
  const totalRevenue = (slots ?? []).reduce((acc, s) => acc + (Number(s.price_paid) || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Monetization & Growth</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
            Advertising & Sponsorships
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Manage featured placements, top-of-category banners, and partner campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/advertise"
            target="_blank"
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors shadow-2xs"
          >
            Preview Public Portal ↗
          </Link>
          <Link
            href="/admin/advertising/new"
            className="rounded-full bg-slate-900 dark:bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-cyan-700 transition-colors shadow-sm"
          >
            + Create Advertisement 📢
          </Link>
        </div>
      </div>

      {/* Analytics Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-2xs">
          <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">Active Campaigns</p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--foreground)]">{activeCount}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">Live in directories</p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-2xs">
          <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">Ad Revenue</p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--foreground)]">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Gross value</p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-2xs">
          <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">Total Impressions</p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--foreground)]">
            {(impressionCount ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-cyan-600 font-semibold">Ad views tracked</p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-2xs">
          <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">Total Clicks</p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--foreground)]">
            {(clickCount ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-emerald-600 font-semibold">Engagements</p>
        </div>
      </div>

      {/* Ad Placements List */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Configured Placements</h2>
            <p className="text-xs text-[var(--ink-muted)]">Active, scheduled, and past partner advertisements.</p>
          </div>
        </div>

        <AdminAdvertisingList slots={slots ?? []} />
      </div>
    </div>
  );
}
