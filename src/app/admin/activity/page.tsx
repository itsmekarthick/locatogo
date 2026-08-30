import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminActivityList } from "@/components/admin-activity-list";

export const metadata = {
  title: "Activity & Analytics | Workspace Admin",
};

export default async function ActivityPage() {
  const { supabase, tenant } = await requireTenantContext();
  const { data: logs } = await supabase
    .from("listing_audit_logs")
    .select("id, action, entity_type, entity_id, old_values, new_values, created_at, actor_user_id")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(100);

  // Group logs by day for the last 7 days to build visual activity chart
  const days: { [dateStr: string]: number } = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = 0;
  }

  (logs ?? []).forEach((log) => {
    const dateStr = log.created_at.slice(0, 10);
    if (days[dateStr] !== undefined) {
      days[dateStr] += 1;
    }
  });

  const chartEntries = Object.entries(days).map(([date, count]) => {
    const d = new Date(date);
    const label = d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
    return { date, label, count };
  });

  const maxCount = Math.max(...chartEntries.map((e) => e.count), 5);

  // Count action breakdown
  const actionCounts: Record<string, number> = {};
  (logs ?? []).forEach((l) => {
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Audit Trail & Velocity</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em]">Activity & Analytics</h1>
        <p className="mt-3 text-[var(--ink-muted)]">Real-time audit history of changes made across your directory workspace.</p>
      </div>

      {/* 7-Day Velocity Chart */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">7-Day Mutation Activity</h2>
          <span className="text-xs text-[var(--ink-muted)]">Total Events: {logs?.length ?? 0}</span>
        </div>

        {/* SVG Bar Chart */}
        <div className="h-44 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
          {chartEntries.map((entry) => {
            const heightPct = Math.max((entry.count / maxCount) * 100, 4);
            return (
              <div key={entry.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {entry.count}
                </span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full max-w-[48px] rounded-t-lg bg-[var(--coral)]/80 group-hover:bg-[var(--coral)] transition-all shadow-xs"
                />
                <span className="text-[10px] font-medium text-[var(--ink-muted)] whitespace-nowrap">
                  {entry.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Breakdown Chips */}
        {Object.keys(actionCounts).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--line)]">
            <span className="text-xs text-[var(--ink-muted)]">Action breakdown:</span>
            {Object.entries(actionCounts).map(([action, count]) => (
              <span
                key={action}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
              >
                {action}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4">Detailed Mutation Log</h2>
        <AdminActivityList logs={logs ?? []} />
      </div>
    </div>
  );
}
