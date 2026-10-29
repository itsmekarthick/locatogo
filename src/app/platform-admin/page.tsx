import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/platform-context";
import { AdminKpiCard } from "@/components/admin-kpi-card";
import { AdminMiniChart } from "@/components/admin-mini-chart";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LiveRefresh } from "@/components/admin/live-refresh";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRightIcon, BuildingIcon, ChartIcon, ClockIcon, CreditCardIcon, GlobeIcon, MapPinIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const DAY_MS = 86_400_000;
const EVENT_WINDOW_DAYS = 14;
const EVENT_ROW_LIMIT = 5000;

const stampFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const STATUS_VARIANT: Record<string, BadgeVariant> = { active: "success", trialing: "info", suspended: "danger", pending: "warning" };
const EVENT_DOTS = ["bg-accent", "bg-info", "bg-success", "bg-warning"];

export default async function PlatformAdminPage() {
  const { supabase } = await requirePlatformAdmin();
  const { windowStart, monthAgo } = cutoffs();

  const [tenants, domains, listings, listingsRecent, payments, windowEvents, latestEvents] = await Promise.all([
    supabase.from("tenants").select("id, name, slug, status, created_at", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("domains").select("created_at", { count: "exact" }),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
    supabase.from("payments").select("amount, currency, created_at").eq("status", "succeeded"),
    supabase.from("analytics_events").select("event_type, occurred_at", { count: "exact" }).gte("occurred_at", windowStart).order("occurred_at", { ascending: false }).limit(EVENT_ROW_LIMIT),
    supabase.from("analytics_events").select("event_type, occurred_at").order("occurred_at", { ascending: false }).limit(8),
  ]);

  const tenantRows = tenants.data ?? [];
  const tenantDates = tenantRows.map((tenant) => tenant.created_at);
  const domainDates = (domains.data ?? []).map((domain) => domain.created_at);

  // Revenue is summed per currency; amounts in different currencies are never added together.
  const revenueByCurrency = new Map<string, { total: number; items: { at: string; value: number }[] }>();
  for (const payment of payments.data ?? []) {
    const entry = revenueByCurrency.get(payment.currency) ?? { total: 0, items: [] };
    entry.total += Number(payment.amount);
    entry.items.push({ at: payment.created_at, value: Number(payment.amount) });
    revenueByCurrency.set(payment.currency, entry);
  }
  const currencies = [...revenueByCurrency.entries()].sort((a, b) => b[1].total - a[1].total);
  const [primaryCurrency, primaryRevenue] = currencies[0] ?? ["USD", { total: 0, items: [] }];

  const events = windowEvents.data ?? [];
  const eventTotal = windowEvents.count ?? events.length;
  const dailyEvents = dailySeries(events.map((event) => event.occurred_at), EVENT_WINDOW_DAYS);
  const typeCounts = new Map<string, number>();
  for (const event of events) typeCounts.set(event.event_type, (typeCounts.get(event.event_type) ?? 0) + 1);
  const topTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topTypeMax = topTypes[0]?.[1] ?? 1;

  const feed = latestEvents.data ?? [];

  return (
    <div className="mx-auto max-w-[1280px] space-y-8">
      <AdminPageHeader
        eyebrow="Platform pulse"
        title="System overview"
        description="Global health and activity across all tenant workspaces."
        actions={<LiveRefresh />}
      />

      <section aria-label="Platform metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard index={0} title="Active tenants" value={tenants.count ?? tenantRows.length} icon={<BuildingIcon />} description={newSince(tenantDates, "workspace")} tone="accent" href="/platform-admin/tenants" sparklineData={growthSeries(tenantDates)} />
        <AdminKpiCard index={1} title="Public directories" value={domains.count ?? 0} icon={<GlobeIcon />} description={newSince(domainDates, "domain")} tone="info" sparklineData={growthSeries(domainDates)} />
        <AdminKpiCard index={2} title="Total places" value={listings.count ?? 0} icon={<MapPinIcon />} description={`${(listingsRecent.count ?? 0).toLocaleString("en-US")} new in 30 days`} tone="success" />
        <AdminKpiCard
          index={3}
          title="Gross revenue"
          value={primaryRevenue.total}
          currency={primaryCurrency}
          icon={<CreditCardIcon />}
          description={currencies.length > 1 ? `${primaryCurrency} · plus ${currencies.length - 1} other ${currencies.length === 2 ? "currency" : "currencies"}` : "Lifetime volume"}
          tone="warning"
          sparklineData={weeklySeries(primaryRevenue.items.map((item) => item.at), primaryRevenue.items.map((item) => item.value))}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Event activity" description={`Events per day, ${dailyEvents[0].label} to ${dailyEvents[dailyEvents.length - 1].label} (UTC)`} trailing={<Badge>{eventTotal.toLocaleString("en-US")} events</Badge>}>
          {eventTotal ? (
            <div className="mt-5">
              <AdminMiniChart data={dailyEvents} height={150} />
              {eventTotal > events.length && <p className="mt-3 text-xs text-fg-subtle">Chart covers the most recent {events.length.toLocaleString("en-US")} events.</p>}
            </div>
          ) : (
            <EmptyState icon={<ChartIcon />} title="No events in this window" description={`Nothing recorded in the last ${EVENT_WINDOW_DAYS} days.`} />
          )}
        </Panel>

        <Panel title="Top event types" description="Share of events in the same window">
          {topTypes.length ? (
            <ul role="list" className="mt-5 space-y-4">
              {topTypes.map(([type, count]) => (
                <li key={type}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-fg">{humanize(type)}</span>
                    <span className="shrink-0 font-mono text-xs text-fg-subtle">
                      {count.toLocaleString("en-US")} · {Math.round((count / events.length) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
                    <div className={cn("h-full rounded-full", dotFor(type))} style={{ width: `${Math.max((count / topTypeMax) * 100, 4)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<ChartIcon />} title="No event types yet" description="Types appear as visitors use the atlas." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Real-time event pulse" trailing={<Badge variant="success" dot>Latest 8</Badge>}>
          {feed.length ? (
            <ul role="list" className="mt-3 divide-y divide-line">
              {feed.map((event, index) => (
                <li key={`${event.occurred_at}-${index}`} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dotFor(event.event_type))} />
                    <span className="truncate text-sm font-medium text-fg">{humanize(event.event_type)}</span>
                  </span>
                  <time dateTime={event.occurred_at} title={`${stampFormat.format(new Date(event.occurred_at))} UTC`} className="shrink-0 text-xs text-fg-subtle">
                    {ago(event.occurred_at)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<ClockIcon />} title="No telemetry yet" description="Analytics events will stream in here as visitors use the atlas." />
          )}
        </Panel>

        <Panel
          title="Newest tenants"
          trailing={
            <Link href="/platform-admin/tenants" className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-accent-text hover:underline">
              View all
              <ArrowRightIcon className="size-4" />
            </Link>
          }
        >
          {tenantRows.length ? (
            <ul role="list" className="mt-3 divide-y divide-line">
              {tenantRows.slice(0, 5).map((tenant) => (
                <li key={tenant.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{tenant.name}</p>
                    <p className="truncate font-mono text-xs text-fg-subtle">
                      {tenant.slug} · {dayFormat.format(new Date(tenant.created_at))}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[tenant.status] ?? "neutral"} dot className="capitalize">
                    {tenant.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<BuildingIcon />} title="No tenants yet" description="Registered workspaces will show up here." />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, description, trailing, children }: { title: string; description?: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="adm-rise min-w-0 rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-fg-subtle">{description}</p>}
        </div>
        {trailing}
      </div>
      {children}
    </section>
  );
}

function cutoffs() {
  const now = Date.now();
  const iso = (days: number) => new Date(now - days * DAY_MS).toISOString();
  return { windowStart: iso(EVENT_WINDOW_DAYS), monthAgo: iso(30) };
}

const humanize = (value: string) => {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function dotFor(type: string) {
  let hash = 0;
  for (let i = 0; i < type.length; i++) hash = (hash * 31 + type.charCodeAt(i)) >>> 0;
  return EVENT_DOTS[hash % EVENT_DOTS.length];
}

function ago(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return relativeFormat.format(Math.trunc(seconds / size), unit);
  return "just now";
}

/** Items per week over the last `weeks` weeks, oldest first; undefined when there is nothing to draw. */
function weeklySeries(dates: string[], amounts?: number[], weeks = 8) {
  const now = Date.now();
  const series = Array.from({ length: weeks }, (_, i) => {
    const start = now - (weeks - i) * 7 * DAY_MS;
    const end = start + 7 * DAY_MS;
    return dates.reduce((sum, value, index) => {
      const time = new Date(value).getTime();
      return time >= start && time < end ? sum + (amounts ? amounts[index] : 1) : sum;
    }, 0);
  });
  return series.some(Boolean) ? series : undefined;
}

/** Running total at the end of each of the last `weeks` weeks; undefined when it never grows. */
function growthSeries(dates: string[], weeks = 8) {
  const now = Date.now();
  const times = dates.map((value) => new Date(value).getTime());
  const series = Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * DAY_MS;
    return times.filter((time) => time <= end).length;
  });
  return series[weeks - 1] > series[0] ? series : undefined;
}

function newSince(dates: string[], noun: string, days = 30) {
  const now = Date.now();
  const count = dates.filter((value) => now - new Date(value).getTime() < days * DAY_MS).length;
  return `${count.toLocaleString("en-US")} new ${noun}${count === 1 ? "" : "s"} in ${days} days`;
}

/** Counts per UTC day for the last `days` days, oldest first. */
function dailySeries(dates: string[], days: number) {
  const startOfToday = Math.floor(Date.now() / DAY_MS) * DAY_MS;
  const counts = new Array<number>(days).fill(0);
  for (const value of dates) {
    const offset = Math.floor((startOfToday - Math.floor(new Date(value).getTime() / DAY_MS) * DAY_MS) / DAY_MS);
    if (offset >= 0 && offset < days) counts[days - 1 - offset] += 1;
  }
  return counts.map((count, i) => {
    const day = new Date(startOfToday - (days - 1 - i) * DAY_MS);
    return { label: dayFormat.format(day), shortLabel: String(day.getUTCDate()), value: count };
  });
}
