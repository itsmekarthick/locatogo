import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requirePlatformAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/platform-admin");
  const { data: profile, error } = await supabase.from("profiles").select("platform_role, display_name").eq("id", user.id).single();
  if (error || profile?.platform_role !== "platform_admin") redirect("/admin");
  return { supabase, user, profile };
}
