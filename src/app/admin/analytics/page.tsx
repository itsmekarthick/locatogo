import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminMiniChart } from "@/components/admin-mini-chart";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowUpRightIcon, ClockIcon, EyeIcon, MapIcon, MapPinIcon, SearchIcon } from "@/components/ui/icons";

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
      .limit(5000),
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

  const channels = [
    { label: "Directory and place views", count: pageViews, color: "bg-accent", icon: EyeIcon },
    { label: "Search queries", count: searches, color: "bg-warning", icon: SearchIcon },
    { label: "Map clicks and exploration", count: mapInteractions, color: "bg-success", icon: MapIcon },
    { label: "Outbound leads (WhatsApp, Uber)", count: outboundLeads, color: "bg-danger", icon: ArrowUpRightIcon },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-accent-text">Traffic and telemetry</p>
          <h1 className="mt-1 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-fg">Visitor analytics</h1>
          <p className="mt-2 max-w-[60ch] text-sm text-fg-muted">
            Live visitor traffic, search inquiries and community engagement over the last 30 days.
          </p>
        </div>

        <Badge variant="success" dot>
          Live telemetry active
        </Badge>
      </div>

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard index={0} title="Total page views" value={pageViews} icon={<EyeIcon />} description="Directory and listing views" sparklineData={sparklineValues} tone="accent" />
        <AdminKpiCard index={1} title="Search inquiries" value={searches} icon={<SearchIcon />} description="Place searches performed" tone="warning" />
        <AdminKpiCard index={2} title="Map interactions" value={mapInteractions} icon={<MapIcon />} description="Pins clicked and clustered" tone="success" />
        <AdminKpiCard index={3} title="Outbound leads" value={outboundLeads} icon={<ArrowUpRightIcon />} description="WhatsApp, Uber and calls" tone="danger" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <section aria-labelledby="daily-activity" className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 id="daily-activity" className="font-display text-lg font-semibold tracking-tight text-fg">
                Daily visitor activity
              </h2>
              <p className="text-xs text-fg-subtle">Event volume over the past 14 days</p>
            </div>
            <Badge>{allEvents.length.toLocaleString("en-US")} total events</Badge>
          </div>

          <div className="mt-6">
            <AdminMiniChart data={dailyTraffic} height={140} title="Events per day" />
          </div>
        </section>

        <section aria-labelledby="event-channels" className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
          <h2 id="event-channels" className="font-display text-lg font-semibold tracking-tight text-fg">
            Event channels
          </h2>
          <p className="mt-0.5 text-xs text-fg-subtle">Breakdown by visitor action</p>

          <ul role="list" className="mt-5 space-y-3">
            {channels.map((channel) => {
              const pct = allEvents.length > 0 ? Math.round((channel.count / allEvents.length) * 100) : 0;
              const Icon = channel.icon;
              return (
                <li key={channel.label} className="rounded-xl border border-line bg-surface-2/60 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-fg">
                      <Icon className="size-4 shrink-0 text-fg-subtle" />
                      <span className="truncate">{channel.label}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-fg-muted">
                      {channel.count.toLocaleString("en-US")} ({pct}%)
                    </span>
                  </div>
                  <div role="meter" aria-label={`${channel.label} share of events`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                    <div className={`h-full w-full origin-left rounded-full ${channel.color}`} style={{ transform: `scaleX(${pct / 100})` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="top-places" className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
          <div className="border-b border-line pb-4">
            <h2 id="top-places" className="font-display text-lg font-semibold tracking-tight text-fg">
              Top viewed places
            </h2>
            <p className="text-xs text-fg-subtle">Listings generating the highest interest</p>
          </div>

          {topListings.length > 0 ? (
            <ol role="list" className="mt-2 divide-y divide-line">
              {topListings.map((item, i) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-xs font-semibold text-fg-muted">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{item.title}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-fg-subtle">
                        <MapPinIcon className="size-3 shrink-0" />
                        {item.locality}
                      </p>
                    </div>
                  </div>
                  <Badge variant="accent" size="sm">
                    {item.count.toLocaleString("en-US")} views
                  </Badge>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState className="py-10" icon={<EyeIcon />} title="No views yet" description="Place view events will appear here as visitors discover listings." />
          )}
        </section>

        <section aria-labelledby="activity-stream" className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
          <div className="border-b border-line pb-4">
            <h2 id="activity-stream" className="font-display text-lg font-semibold tracking-tight text-fg">
              Real-time activity stream
            </h2>
            <p className="text-xs text-fg-subtle">Latest 8 actions recorded</p>
          </div>

          {allEvents.length > 0 ? (
            <ul role="list" className="mt-4 space-y-2">
              {allEvents.slice(0, 8).map((evt) => (
                <li key={evt.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />
                    <span className="truncate font-mono text-xs font-medium capitalize text-fg">{evt.event_type.replace(/_/g, " ")}</span>
                  </span>
                  <time dateTime={evt.occurred_at} className="shrink-0 font-mono text-xs text-fg-subtle">
                    {new Date(evt.occurred_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="py-10" icon={<ClockIcon />} title="No activity recorded" description="Nothing in the last 30 days." />
          )}
        </section>
      </div>
    </div>
  );
}
