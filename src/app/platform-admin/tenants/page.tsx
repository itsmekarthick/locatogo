import { requirePlatformAdmin } from "@/lib/auth/platform-context";
import { PlatformTenantsList } from "@/components/platform-tenants-list";

export default async function PlatformTenantsPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-[1280px] space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Platform Governance</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
          Registered Tenants
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Inspect, audit, and monitor all organization workspaces on the Mapora platform.
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
        <h2 className="font-display text-lg font-bold text-[var(--foreground)] mb-1">Tenant Workspaces</h2>
        <p className="mb-6 text-xs text-[var(--ink-muted)]">All organization accounts active on the Mapora platform.</p>

        <PlatformTenantsList tenants={tenants ?? []} />
      </div>
    </div>
  );
}
