import type { ComponentType } from "react";
import { ContentEnter } from "@/components/page-transition";
import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminMiniChart } from "@/components/admin-mini-chart";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BuildingIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  FileTextIcon,
  GlobeIcon,
  MapPinIcon,
  MegaphoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  StarIcon,
  TagIcon,
  XIcon,
  type IconProps,
} from "@/components/ui/icons";

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
      .limit(5000),
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
  function getActionIcon(action: string): ComponentType<IconProps> {
    if (action.includes("create")) return PlusIcon;
    if (action.includes("publish")) return CheckCircleIcon;
    if (action.includes("update") || action.includes("edit")) return FileTextIcon;
    if (action.includes("delete") || action.includes("archive")) return ArchiveIcon;
    if (action.includes("reject")) return XIcon;
    if (action.includes("approve")) return CheckIcon;
    if (action.includes("import")) return DownloadIcon;
    if (action.includes("claim")) return BuildingIcon;
    if (action.includes("feature")) return StarIcon;
    if (action.includes("verify")) return ShieldCheckIcon;
    return ClockIcon;
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

  const quickActions = [
    { label: "Add listing", icon: MapPinIcon, href: "/admin/listings", desc: "Create a new place" },
    { label: "Import CSV", icon: DownloadIcon, href: "/admin/import", desc: "Bulk import listings" },
    { label: "Review submissions", icon: ShieldCheckIcon, href: "/admin/moderation", desc: `${submissionsCount ?? 0} pending` },
    { label: "Review claims", icon: BuildingIcon, href: "/admin/claims", desc: `${claimsCount ?? 0} pending` },
    { label: "Add category", icon: TagIcon, href: "/admin/categories", desc: "Organize taxonomy" },
    { label: "Create ad slot", icon: MegaphoneIcon, href: "/admin/advertising", desc: "Monetize inventory" },
  ];

  const statusBreakdown = [
    { label: "Published", count: published, color: "bg-success" },
    { label: "Draft", count: draft, color: "bg-fg-subtle" },
    { label: "Pending review", count: pending, color: "bg-warning" },
    { label: "Suspended", count: suspended, color: "bg-danger" },
  ];

  return (
    <ContentEnter><div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-accent-text">Workspace overview</p>
          <h1 className="mt-1 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-fg">
            Welcome, {user.email?.split("@")[0]}.
          </h1>
          <p className="mt-2 max-w-[60ch] text-sm text-fg-muted">
            A snapshot of your directory listings, curation pipeline and recent operations.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/admin/listings" className={buttonVariants()}>
            <PlusIcon className="size-4" />
            Add listing
          </Link>
          <Link href="/admin/import" className={buttonVariants({ variant: "secondary" })}>
            <DownloadIcon className="size-4" />
            Import CSV
          </Link>
        </div>
      </div>

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AdminKpiCard
          index={0}
          title="Total listings"
          value={total}
          icon={<MapPinIcon />}
          description="Across all directories"
          sparklineData={sparklineValues}
          trend={weeklyTrend !== 0 ? { value: weeklyTrend, label: "vs last week" } : null}
          tone="accent"
          href="/admin/listings"
        />
        <AdminKpiCard index={1} title="Published" value={published} icon={<CheckCircleIcon />} description="Live on the map" tone="success" href="/admin/listings" />
        <AdminKpiCard index={2} title="Pending review" value={pending} icon={<ClockIcon />} description="Awaiting approval" tone="warning" href="/admin/moderation" />
        <AdminKpiCard index={3} title="Drafts" value={draft} icon={<FileTextIcon />} description="Unpublished edits" tone="neutral" href="/admin/listings" />
        <AdminKpiCard index={4} title="Featured" value={featuredCount ?? 0} icon={<StarIcon />} description="Promoted listings" tone="warning" />
        <AdminKpiCard index={5} title="Verified" value={verifiedCount ?? 0} icon={<ShieldCheckIcon />} description="Confirmed places" tone="info" />
        <AdminKpiCard index={6} title="Directories" value={domainsRes.count ?? 1} icon={<GlobeIcon />} description="Active atlases" tone="accent" href="/admin/domains" />
        <AdminKpiCard index={7} title="Suspended" value={suspended} icon={<AlertTriangleIcon />} description="Paused listings" tone="danger" />
      </section>

      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="text-sm font-medium text-fg-muted">
          Quick actions
        </h2>
        <ul role="list" className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.href + action.label}>
                <Link
                  href={action.href}
                  className="focus-ring group flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-3.5 lift hover:border-line-strong hover:bg-surface-3/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-lg text-accent-text">
                    <Icon />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">{action.label}</span>
                    <span className="block truncate text-xs text-fg-subtle">{action.desc}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <section aria-labelledby="recent-activity" className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 id="recent-activity" className="font-display text-lg font-semibold tracking-tight text-fg">
                Recent activity
              </h2>
              <p className="text-xs text-fg-subtle">Audit trail of workspace operations</p>
            </div>
            <Link href="/admin/activity" className="focus-ring rounded text-sm font-medium text-accent-text hover:underline">
              View all
            </Link>
          </div>

          {recentAudits && recentAudits.length > 0 ? (
            <ul role="list" className="mt-3 space-y-0.5">
              {recentAudits.map((audit) => {
                const Icon = getActionIcon(audit.action);
                return (
                  <li key={audit.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-3/60">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-lg text-fg-muted">
                      <Icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{formatAction(audit.action)}</p>
                      <p className="truncate text-xs text-fg-subtle">
                        {audit.entity_type && <span className="capitalize">{audit.entity_type} · </span>}
                        {timeAgo(audit.created_at)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-surface-3 px-2 py-0.5 font-mono text-[11px] text-fg-subtle">#{audit.id.slice(0, 6)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={<ClockIcon />}
              title="No activity yet"
              description="Create or edit a listing to generate audit history."
              action={
                <Link href="/admin/listings" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  Go to listings
                </Link>
              }
            />
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
            <AdminMiniChart data={weeklyData} title="Listing growth" subtitle="New listings per week, last 7 weeks" height={110} />
          </section>

          <section aria-labelledby="status-breakdown" className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
            <h3 id="status-breakdown" className="text-sm font-semibold text-fg">
              Status breakdown
            </h3>
            <p className="mt-0.5 text-xs text-fg-subtle">Current listing pipeline</p>
            <ul role="list" className="mt-4 space-y-3">
              {statusBreakdown.map((item) => {
                const share = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <li key={item.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-fg">{item.label}</span>
                      <span className="font-mono text-fg-muted">
                        {item.count.toLocaleString("en-US")} · {share}%
                      </span>
                    </div>
                    <div role="meter" aria-label={`${item.label} share of listings`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={share} className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                      <div className={`h-full w-full origin-left rounded-full ${item.color}`} style={{ transform: `scaleX(${share / 100})` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-gradient-to-br from-accent-soft to-surface-1 p-5 elev-sm sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-accent-text">Multi-atlas engine</p>
            <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-fg">Curate with precision.</h3>
            <p className="mt-2 text-sm text-fg-muted">Power multiple directories with independent branding, categories and monetization.</p>
            <div className="mt-5 grid gap-2">
              <Link href="/admin/domains" className={buttonVariants({ fullWidth: true })}>
                Directory settings
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link href="/" target="_blank" className={buttonVariants({ variant: "secondary", fullWidth: true })}>
                View live atlas
                <ArrowUpRightIcon className="size-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div></ContentEnter>
  );
}
