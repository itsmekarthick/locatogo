import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminActivityList } from "@/components/admin-activity-list";
import { AdminMiniChart } from "@/components/admin-mini-chart";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";

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


  // Count action breakdown
  const actionCounts: Record<string, number> = {};
  (logs ?? []).forEach((l) => {
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Audit trail and velocity"
        title="Activity and analytics"
        description="Audit history of changes made across your directory workspace."
      />

      <section aria-labelledby="mutation-activity" className="space-y-4 rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="mutation-activity" className="font-display text-lg font-semibold tracking-tight text-fg">
            7-day mutation activity
          </h2>
          <Badge>{(logs?.length ?? 0).toLocaleString("en-US")} events</Badge>
        </div>

        <AdminMiniChart data={chartEntries.map((entry) => ({ label: entry.label, value: entry.count }))} height={160} title="Events per day" />

        {Object.keys(actionCounts).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-xs text-fg-subtle">Action breakdown</span>
            {Object.entries(actionCounts).map(([action, count]) => (
              <Badge key={action}>
                {action}: <strong className="font-semibold text-fg">{count}</strong>
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="mutation-log">
        <h2 id="mutation-log" className="mb-4 font-display text-lg font-semibold tracking-tight text-fg">
          Detailed mutation log
        </h2>
        <AdminActivityList logs={logs ?? []} />
      </section>
    </div>
  );
}
