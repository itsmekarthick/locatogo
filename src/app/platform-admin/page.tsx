import { requirePlatformAdmin } from "@/lib/auth/platform-context";

export default async function PlatformAdminPage() {
  const { supabase } = await requirePlatformAdmin();
  const [tenants, domains, listings, payments, events] = await Promise.all([
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase.from("domains").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("amount, currency, status").eq("status", "succeeded"),
    supabase.from("analytics_events").select("event_type, occurred_at").order("occurred_at", { ascending: false }).limit(8),
  ]);

  const revenue = (payments.data ?? []).reduce((total, payment) => total + Number(payment.amount), 0);

  const metrics = [
    { label: "Active Tenants", value: tenants.count ?? 0, icon: "🏢", change: "Workspaces active" },
    { label: "Public Directories", value: domains.count ?? 0, icon: "🌐", change: "Multi-domains live" },
    { label: "Total Places", value: listings.count ?? 0, icon: "📍", change: "Database records" },
    { label: "Gross Revenue", value: `$${revenue.toFixed(2)}`, icon: "💳", change: "Lifetime volume" },
  ];

  return (
    <div className="mx-auto max-w-[1280px] space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Platform Pulse</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
          System Overview
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Real-time global health and activity telemetry across all tenant workspaces.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink-muted)]">{metric.label}</span>
              <span className="text-lg">{metric.icon}</span>
            </div>
            <p className="mt-4 font-display text-3xl font-bold text-[var(--foreground)]">{metric.value}</p>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{metric.change}</p>
          </div>
        ))}
      </div>

      {/* Analytics Feed Card */}
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Real-Time Event Pulse</h2>
          <span className="rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--leaf-dark)]">
            Live Stream
          </span>
        </div>

        <div className="mt-4 divide-y divide-[var(--line)]">
          {events.data?.length ? (
            events.data.map((event, index) => (
              <div key={`${event.occurred_at}-${index}`} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[var(--coral)]" />
                  <span className="font-mono text-xs font-semibold text-[var(--foreground)]">{event.event_type}</span>
                </div>
                <span className="text-xs font-mono text-[var(--ink-muted)]">
                  {new Date(event.occurred_at).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-[var(--ink-muted)]">
              No analytics telemetry events logged recently.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
