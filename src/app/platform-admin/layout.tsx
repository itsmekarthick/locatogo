import { AdminShell } from "@/components/admin/admin-shell";
import { requirePlatformAdmin } from "@/lib/auth/platform-context";

export default async function PlatformAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { supabase, user } = await requirePlatformAdmin();
  const { data: membership } = await supabase
    .from("tenant_users")
    .select("tenant_id, tenants!inner(status)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const tenant = Array.isArray(membership?.tenants) ? membership.tenants[0] : membership?.tenants;
  const hasWorkspace = tenant?.status === "active";

  return <AdminShell variant="platform" hasWorkspace={hasWorkspace}>{children}</AdminShell>;
}
