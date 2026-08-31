import { logout } from "@/app/auth/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { SettingsForm } from "@/components/admin-settings-form";

export default async function SettingsPage() {
  const { tenant, user, membership } = await requireTenantContext();

  return (
    <SettingsForm
      tenant={tenant}
      membership={membership}
      userEmail={user.email ?? ""}
      userId={user.id}
      logoutAction={logout}
    />
  );
}
