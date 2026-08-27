import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant-context";

const statuses = ["published", "draft", "pending_review", "rejected"] as const;

export default async function AdminPage() {
  const { supabase, tenant, user } = await requireTenantContext();

  const [counts, { data: recentAudits }, domainsRes] = await Promise.all([
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
      .select("id, action, before_state, after_state, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("domains")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id),
  ]);

  const total = counts.reduce((sum, [, count]) => sum + count, 0);
  const published = counts.find(([s]) => s === "published")?.[1] ?? 0;
  const pending = counts.find(([s]) => s === "pending_review")?.[1] ?? 0;
  const draft = counts.find(([s]) => s === "draft")?.[1] ?? 0;

  const statCards = [
    { title: "Total Places", value: total, icon: "📍", bg: "bg-blue-50 text-blue-700", desc: "Across all domains" },
    { title: "Published", value: published, icon: "🟢", bg: "bg-green-50 text-green-700", desc: "Live on map" },
    { title: "Pending Review", value: pending, icon: "⏳", bg: "bg-amber-50 text-amber-700", desc: "Awaiting approval" },
    { title: "Draft Places", value: draft, icon: "📝", bg: "bg-slate-100 text-slate-700", desc: "Unpublished edits" },
    { title: "Directories", value: domainsRes.count ?? 1, icon: "🌐", bg: "bg-rose-50 text-rose-700", desc: "Active atlases" },
  ];

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

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xs transition-all hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink-muted)]">{card.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${card.bg}`}>{card.icon}</span>
            </div>
            <p className="mt-4 font-display text-3xl font-bold text-[var(--foreground)]">{card.value}</p>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Operations Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/listings"
          className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-xs hover:border-[var(--foreground)] transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--coral-soft)] text-lg">
            📍
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--coral)]">Manage Listings</h3>
            <p className="text-[11px] text-[var(--ink-muted)]">Add, edit, or geo-locate places</p>
          </div>
        </Link>

        <Link
          href="/admin/domains"
          className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-xs hover:border-[var(--foreground)] transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--leaf)] text-lg">
            🌐
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--coral)]">Directories (Domains)</h3>
            <p className="text-[11px] text-[var(--ink-muted)]">Configure multi-atlas portals</p>
          </div>
        </Link>

        <Link
          href="/admin/categories"
          className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-xs hover:border-[var(--foreground)] transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--yellow-soft)] text-lg">
            🏷️
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--coral)]">Taxonomy Categories</h3>
            <p className="text-[11px] text-[var(--ink-muted)]">Organize place classifications</p>
          </div>
        </Link>

        <Link
          href="/admin/moderation"
          className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-xs hover:border-[var(--foreground)] transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-lg">
            🛡️
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--coral)]">Moderation Queue</h3>
            <p className="text-[11px] text-[var(--ink-muted)]">Review community suggestions</p>
          </div>
        </Link>
      </div>

      {/* Two-Column Activity & Growth Section */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Recent Activity Feed */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Recent Activity</h2>
              <p className="text-xs text-[var(--ink-muted)]">Audit trail of changes made to listings and taxonomy</p>
            </div>
            <Link href="/admin/activity" className="text-xs font-bold text-[var(--coral)] hover:underline">
              View all →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[var(--line)]">
            {recentAudits && recentAudits.length > 0 ? (
              recentAudits.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[var(--coral)]" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)] capitalize">
                        {audit.action.replace("_", " ")}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        {new Date(audit.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--background)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--ink-muted)]">
                    Audit #{audit.id.slice(0, 6)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-[var(--ink-muted)]">
                No recent activity recorded yet. Create or edit a listing to generate audit history.
              </div>
            )}
          </div>
        </section>

        {/* Directory Atlas Launchpad Promo Card */}
        <section className="flex flex-col justify-between rounded-3xl bg-[var(--leaf)] p-7 shadow-xs">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--leaf-dark)]">Multi-Atlas Engine</p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Curate with precision.
            </h3>
            <p className="mt-3 text-xs leading-6 text-[var(--ink-muted)]">
              Mapora lets you power multiple specialized directories with independent branding, categories, custom fields, and monetization rules under one workspace.
            </p>
          </div>

          <div className="mt-8 space-y-2">
            <Link
              href="/admin/domains"
              className="block w-full rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-center text-xs font-semibold text-[var(--paper)] hover:bg-[var(--foreground)]/85 transition-colors"
            >
              Explore directory settings →
            </Link>
            <Link
              href="/"
              target="_blank"
              className="block w-full rounded-xl border border-[var(--line)] bg-[var(--paper)]/80 px-4 py-2.5 text-center text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--paper)] transition-colors"
            >
              View live public atlas ↗
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
