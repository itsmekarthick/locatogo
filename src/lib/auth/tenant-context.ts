import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireTenantContext() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin");

  const { data: membership, error } = await supabase
    .from("tenant_users")
    .select("tenant_id, role, tenants!inner(id, name, slug, status)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const tenant = Array.isArray(membership?.tenants) ? membership.tenants[0] : membership?.tenants;
  if (error || !membership || !tenant) redirect("/auth/login?error=no_workspace");
  if (tenant.status !== "active") redirect("/auth/login?error=workspace_unavailable");

  return { supabase, user, membership, tenant };
}
