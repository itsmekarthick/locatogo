import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminMiniChart, AdminAreaChart } from "@/components/admin-mini-chart";

export default async function TenantAnalyticsPage() {
  const { supabase, tenant } = await requireTenantContext();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch tenant-scoped analytics events
  const [
    { data: events, count: totalEventsCount },
    { data: listings },
  ] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("id, event_type, listing_id, occurred_at, metadata", { count: "exact" })
      .eq("tenant_id", tenant.id)
      .gte("occurred_at", thirtyDaysAgo)
      .order("occurred_at", { ascending: false })
      .limit(500),
    supabase
      .from("listings")
      .select("id, title, slug, locality, city")
      .eq("tenant_id", tenant.id),
  ]);

  const allEvents = events ?? [];

  // Metrics aggregation
  const pageViews = allEvents.filter((e) => e.event_type === "page_view" || e.event_type === "listing_view").length;
  const searches = allEvents.filter((e) => e.event_type === "search").length;
  const mapInteractions = allEvents.filter((e) => e.event_type === "map_interaction").length;
  const outboundLeads = allEvents.filter(
    (e) =>
      e.event_type === "whatsapp_click" ||
      e.event_type === "phone_click" ||
      e.event_type === "uber_click" ||
      e.event_type === "website_click"
  ).length;

  // Daily views breakdown (last 14 days)
  const dayLabels = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
      shortLabel: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      date: d.toISOString().split("T")[0],
    };
  });

  const dailyTraffic = dayLabels.map((day) => {
    const count = allEvents.filter((e) => e.occurred_at.startsWith(day.date)).length;
    return {
      label: day.shortLabel,
      value: count,
    };
  });

  // Top Viewed Places Leaderboard
  const listingViewsMap: Record<string, number> = {};
  allEvents
    .filter((e) => e.listing_id)
    .forEach((e) => {
      const lid = e.listing_id!;
      listingViewsMap[lid] = (listingViewsMap[lid] || 0) + 1;
    });

  const topListings = Object.entries(listingViewsMap)
    .map(([lid, count]) => {
      const listing = (listings ?? []).find((l) => l.id === lid);
      return {
        id: lid,
        title: listing?.title || "Unknown Place",
        slug: listing?.slug || "",
        locality: listing?.locality || listing?.city || "Area",
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const sparklineValues = dailyTraffic.map((d) => d.value);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Traffic & Telemetry</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
            Visitor Analytics
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Live visitor traffic, search inquiries, and community engagement over the last 30 days.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-[var(--ink-muted)]">Live Telemetry Active</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          title="Total Page Views"
          value={pageViews}
          icon="👀"
          description="Directory & listing views"
          sparklineData={sparklineValues}
          accentClass="bg-gradient-to-r from-blue-500 to-indigo-500"
        />
        <AdminKpiCard
          title="Search Inquiries"
          value={searches}
          icon="🔍"
          description="Place searches performed"
          accentClass="bg-gradient-to-r from-amber-400 to-orange-500"
        />
        <AdminKpiCard
          title="Map Interactions"
          value={mapInteractions}
          icon="🗺️"
          description="Pins clicked & clustered"
          accentClass="bg-gradient-to-r from-emerald-400 to-green-500"
        />
        <AdminKpiCard
          title="Outbound Leads"
          value={outboundLeads}
          icon="🚀"
          description="WhatsApp, Uber & calls"
          accentClass="bg-gradient-to-r from-rose-400 to-pink-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Daily Traffic Chart */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Daily Visitor Activity</h2>
              <p className="text-xs text-[var(--ink-muted)]">Event volume over the past 14 days</p>
            </div>
            <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-mono text-[var(--ink-muted)] border border-[var(--line)]">
              {allEvents.length} total events
            </span>
          </div>

          <div className="mt-6">
            <AdminMiniChart
              data={dailyTraffic}
              height={140}
              barColor="var(--line-strong)"
              activeBarColor="var(--coral)"
            />
          </div>
        </section>

        {/* Engagement Channel Breakdown */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Event Channels</h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Breakdown by visitor action</p>

          <div className="mt-6 space-y-3">
            {[
              { label: "Directory & Place Views", count: pageViews, color: "bg-blue-500", icon: "👀" },
              { label: "Search Queries", count: searches, color: "bg-amber-500", icon: "🔍" },
              { label: "Map Clicks & Exploration", count: mapInteractions, color: "bg-emerald-500", icon: "🗺️" },
              { label: "Outbound Leads (WhatsApp/Uber)", count: outboundLeads, color: "bg-rose-500", icon: "🚀" },
            ].map((channel) => {
              const pct = allEvents.length > 0 ? Math.round((channel.count / allEvents.length) * 100) : 0;
              return (
                <div key={channel.label} className="rounded-2xl border border-[var(--line)] bg-[var(--background)] p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      <span>{channel.icon}</span>
                      <span>{channel.label}</span>
                    </span>
                    <span className="font-mono font-bold text-[var(--ink-muted)]">{channel.count} ({pct}%)</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--line)]">
                    <div className={`h-1.5 rounded-full ${channel.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Top Viewed Places Leaderboard & Live Telemetry Stream */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Viewed Places */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
          <div className="border-b border-[var(--line)] pb-4">
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Top Viewed Places</h2>
            <p className="text-xs text-[var(--ink-muted)]">Listings generating the highest interest</p>
          </div>

          <div className="mt-4 divide-y divide-[var(--line)]">
            {topListings.length > 0 ? (
              topListings.map((item, i) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--background)] text-xs font-bold text-[var(--foreground)] border border-[var(--line)]">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)]">{item.title}</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">📍 {item.locality}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--coral-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--coral)]">
                    {item.count} views
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[var(--ink-muted)]">
                Place view events will appear here as visitors discover listings.
              </div>
            )}
          </div>
        </section>

        {/* Live Event Stream */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Real-Time Activity Stream</h2>
              <p className="text-xs text-[var(--ink-muted)]">Latest 8 actions recorded</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {allEvents.slice(0, 8).map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between rounded-xl bg-[var(--background)] px-3.5 py-2.5 text-xs border border-[var(--line)]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--coral)]" />
                  <span className="font-mono font-semibold text-[var(--foreground)] capitalize">
                    {evt.event_type.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--ink-muted)] font-mono">
                  {new Date(evt.occurred_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            ))}
            {allEvents.length === 0 && (
              <div className="py-8 text-center text-xs text-[var(--ink-muted)]">
                No visitor activity recorded in the last 30 days.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
