import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminActivityList } from "@/components/admin-activity-list";

export default async function ActivityPage() {
  const { supabase, tenant } = await requireTenantContext();
  const { data: logs } = await supabase
    .from("listing_audit_logs")
    .select("id, action, entity_type, entity_id, old_values, new_values, created_at, actor_user_id")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Audit Trail</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em]">Activity Log</h1>
        <p className="mt-3 text-[var(--ink-muted)]">Real-time audit history of changes made across your directory workspace.</p>
      </div>

      <div className="mt-8">
        <AdminActivityList logs={logs ?? []} />
      </div>
    </div>
  );
}

