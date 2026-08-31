import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminMiniChart, AdminAreaChart } from "@/components/admin-mini-chart";

const statuses = ["published", "draft", "pending_review", "rejected", "suspended", "archived"] as const;

export default async function AdminPage() {
  const { supabase, tenant, user } = await requireTenantContext();

  // Fetch all metrics in parallel for performance
  const [
    counts,
    { data: recentAudits },
    domainsRes,
    { count: featuredCount },
    { count: verifiedCount },
    { count: claimsCount },
    { count: submissionsCount },
    { data: recentListings },
  ] = await Promise.all([
    Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .eq("status", status);
        return [status, count ?? 0] as const;
      })
    ),
    supabase
      .from("listing_audit_logs")
      .select("id, action, entity_type, entity_id, before_state, after_state, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("domains")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("is_featured", true),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("verification_status", "verified"),
    supabase
      .from("listing_claims")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("status", "pending"),
    supabase
      .from("listing_submissions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("status", "pending"),
    supabase
      .from("listings")
      .select("created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(90),
  ]);

  const total = counts.reduce((sum, [, count]) => sum + count, 0);
  const published = counts.find(([s]) => s === "published")?.[1] ?? 0;
  const pending = counts.find(([s]) => s === "pending_review")?.[1] ?? 0;
  const draft = counts.find(([s]) => s === "draft")?.[1] ?? 0;
  const suspended = counts.find(([s]) => s === "suspended")?.[1] ?? 0;

  // Build weekly growth sparkline from recent listings
  const now = new Date();
  const weekLabels = ["6w", "5w", "4w", "3w", "2w", "1w", "Now"];
  const weeklyData = weekLabels.map((label, i) => {
    const weekStart = new Date(now.getTime() - (6 - i) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const count = (recentListings ?? []).filter((l) => {
      const d = new Date(l.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    return { label, value: count };
  });

  const sparklineValues = weeklyData.map((d) => d.value);
  const thisWeek = sparklineValues[sparklineValues.length - 1] ?? 0;
  const lastWeek = sparklineValues[sparklineValues.length - 2] ?? 0;
  const weeklyTrend = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;

  // Format audit action names for display
  function formatAction(action: string) {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Get action icon
  function getActionIcon(action: string) {
    if (action.includes("create")) return "🆕";
    if (action.includes("publish")) return "🟢";
    if (action.includes("update") || action.includes("edit")) return "✏️";
    if (action.includes("delete") || action.includes("archive")) return "🗑️";
    if (action.includes("reject")) return "❌";
    if (action.includes("approve")) return "✅";
    if (action.includes("import")) return "📥";
    if (action.includes("claim")) return "🤝";
    if (action.includes("feature")) return "⭐";
    if (action.includes("verify")) return "🔵";
    return "📋";
  }

  // Time ago helper
  function timeAgo(dateStr: string) {
    const diff = now.getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-8">
      {/* Greeting & Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Workspace Overview</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
            Welcome, {user.email?.split("@")[0]}.
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Here is a snapshot of your directory listings, curation pipeline, and recent operations.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/listings"
            className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-bold text-[var(--paper)] shadow-sm hover:bg-[var(--foreground)]/85 transition-all"
          >
            + Add Listing
          </Link>
          <Link
            href="/admin/import"
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-2.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors"
          >
            📥 Import CSV
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AdminKpiCard
          title="Total Listings"
          value={total}
          icon="📍"
          description="Across all directories"
          sparklineData={sparklineValues}
          trend={weeklyTrend !== 0 ? { value: weeklyTrend, label: "vs last week" } : null}
          accentClass="bg-gradient-to-r from-blue-500 to-indigo-500"
          href="/admin/listings"
        />
        <AdminKpiCard
          title="Published"
          value={published}
          icon="🟢"
          description="Live on map"
          accentClass="bg-gradient-to-r from-emerald-500 to-green-500"
          href="/admin/listings"
        />
        <AdminKpiCard
          title="Pending Review"
          value={pending}
          icon="⏳"
          description="Awaiting approval"
          accentClass="bg-gradient-to-r from-amber-400 to-orange-500"
          href="/admin/moderation"
        />
        <AdminKpiCard
          title="Drafts"
          value={draft}
          icon="📝"
          description="Unpublished edits"
          accentClass="bg-gradient-to-r from-slate-400 to-slate-500"
          href="/admin/listings"
        />
        <AdminKpiCard
          title="Featured"
          value={featuredCount ?? 0}
          icon="⭐"
          description="Promoted listings"
          accentClass="bg-gradient-to-r from-amber-400 to-yellow-500"
        />
        <AdminKpiCard
          title="Verified"
          value={verifiedCount ?? 0}
          icon="🔵"
          description="Confirmed places"
          accentClass="bg-gradient-to-r from-sky-400 to-blue-500"
        />
        <AdminKpiCard
          title="Directories"
          value={domainsRes.count ?? 1}
          icon="🌐"
          description="Active atlases"
          accentClass="bg-gradient-to-r from-rose-400 to-pink-500"
          href="/admin/domains"
        />
        <AdminKpiCard
          title="Suspended"
          value={suspended}
          icon="🚫"
          description="Paused listings"
          accentClass="bg-gradient-to-r from-red-400 to-red-600"
        />
      </div>

      {/* Quick Actions Strip */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Quick Actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {[
            { label: "Add Listing", icon: "📍", href: "/admin/listings", desc: "Create a new place" },
            { label: "Import CSV", icon: "📥", href: "/admin/import", desc: "Bulk import listings" },
            { label: "Review Submissions", icon: "🛡️", href: "/admin/moderation", desc: `${submissionsCount ?? 0} pending` },
            { label: "Review Claims", icon: "🤝", href: "/admin/claims", desc: `${claimsCount ?? 0} pending` },
            { label: "Add Category", icon: "🏷️", href: "/admin/categories", desc: "Organize taxonomy" },
            { label: "Create Ad Slot", icon: "📢", href: "/admin/advertising", desc: "Monetize inventory" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3.5 transition-all hover:border-[var(--foreground)] hover:shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--background)] text-base transition-transform group-hover:scale-110">
                {action.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--coral)] transition-colors">{action.label}</p>
                <p className="truncate text-[10px] text-[var(--ink-muted)]">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two-Column: Activity + Charts */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Recent Activity Timeline */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Recent Activity</h2>
              <p className="text-[11px] text-[var(--ink-muted)]">Audit trail of workspace operations</p>
            </div>
            <Link href="/admin/activity" className="text-xs font-bold text-[var(--coral)] hover:underline">
              View all →
            </Link>
          </div>

          <div className="mt-4 space-y-0.5">
            {recentAudits && recentAudits.length > 0 ? (
              recentAudits.map((audit, i) => (
                <div
                  key={audit.id}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--background)]"
                >
                  {/* Timeline connector */}
                  <div className="relative flex flex-col items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--background)] text-sm transition-transform group-hover:scale-110">
                      {getActionIcon(audit.action)}
                    </span>
                    {i < (recentAudits.length ?? 0) - 1 && (
                      <div className="absolute top-8 h-full w-[1px] bg-[var(--line)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--foreground)]">
                      {formatAction(audit.action)}
                    </p>
                    <p className="truncate text-[10px] text-[var(--ink-muted)]">
                      {audit.entity_type && <span className="capitalize">{audit.entity_type} · </span>}
                      {timeAgo(audit.created_at)}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-[var(--background)] px-2 py-0.5 text-[9px] font-mono text-[var(--ink-faint)]">
                    #{audit.id.slice(0, 6)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <span className="text-3xl">📋</span>
                <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">No activity yet</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Create or edit a listing to generate audit history.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Charts Column */}
        <div className="space-y-6">
          {/* Weekly Listing Growth */}
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
            <AdminMiniChart
              data={weeklyData}
              title="Listing Growth"
              subtitle="New listings per week (last 7 weeks)"
              height={110}
            />
          </section>

          {/* Status Distribution */}
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--foreground)]">Status Breakdown</h3>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">Current listing pipeline</p>
            <div className="mt-4 space-y-2.5">
              {[
                { label: "Published", count: published, color: "bg-emerald-500" },
                { label: "Draft", count: draft, color: "bg-slate-400" },
                { label: "Pending Review", count: pending, color: "bg-amber-500" },
                { label: "Suspended", count: suspended, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[var(--foreground)]">{item.label}</span>
                    <span className="font-mono font-bold text-[var(--ink-muted)]">{item.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--background)]">
                    <div
                      className={`h-1.5 rounded-full ${item.color} transition-all duration-1000`}
                      style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Promo Card */}
          <section className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[var(--leaf)] to-emerald-100 p-6 shadow-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--leaf-dark)]">Multi-Atlas Engine</p>
              <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-[var(--foreground)]">
                Curate with precision.
              </h3>
              <p className="mt-2 text-[11px] leading-5 text-[var(--ink-muted)]">
                Power multiple directories with independent branding, categories, and monetization.
              </p>
            </div>
            <div className="mt-5 space-y-2">
              <Link
                href="/admin/domains"
                className="block w-full rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-center text-xs font-semibold text-[var(--paper)] hover:bg-[var(--foreground)]/85 transition-colors"
              >
                Directory settings →
              </Link>
              <Link
                href="/"
                target="_blank"
                className="block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)]/80 px-4 py-2.5 text-center text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--paper)] transition-colors"
              >
                View live atlas ↗
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
