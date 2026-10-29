import { requirePlatformAdmin } from "@/lib/auth/platform-context";
import { PlatformTenantsList } from "@/components/platform-tenants-list";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function PlatformTenantsPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-[1280px] space-y-8">
      <AdminPageHeader
        eyebrow="Platform governance"
        title="Registered tenants"
        description="Inspect, audit and monitor all organization workspaces on the LocaToGo platform."
      />

      <PlatformTenantsList tenants={tenants ?? []} />
    </div>
  );
}
