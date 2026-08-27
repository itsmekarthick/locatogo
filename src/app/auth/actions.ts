"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/validation/directory";

const credentialsSchema = z.object({ email: z.string().trim().email(), password: z.string().min(8) });
const signupSchema = credentialsSchema.extend({ displayName: z.string().trim().min(2).max(120), tenantName: z.string().trim().min(2).max(120), tenantSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) });

function value(formData: FormData, key: string) {
  return typeof formData.get(key) === "string" ? String(formData.get(key)) : "";
}

export async function login(_state: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse({ email: value(formData, "email"), password: value(formData, "password") });
  if (!parsed.success) return { error: "Enter a valid email and a password of at least 8 characters." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Unable to sign in with those credentials." };
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function signup(_state: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({ displayName: value(formData, "displayName"), tenantName: value(formData, "tenantName"), tenantSlug: value(formData, "tenantSlug"), email: value(formData, "email"), password: value(formData, "password") });
  if (!parsed.success) return { error: "Check the workspace, email, and password fields." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { display_name: parsed.data.displayName, tenant_name: parsed.data.tenantName, tenant_slug: parsed.data.tenantSlug } } });
  if (error || !data.user) return { error: "Unable to create the account." };
  if (!data.session) return { success: "Account created. Confirm your email, then sign in to access your workspace." };
  redirect("/admin");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
