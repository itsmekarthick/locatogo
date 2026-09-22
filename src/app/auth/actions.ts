"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/send";
import type { ActionResult } from "@/lib/validation/directory";

const credentialsSchema = z.object({ email: z.string().trim().email(), password: z.string().min(8) });
const signupSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
});
const resetEmailSchema = z.object({ email: z.string().trim().email() });
const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

function value(formData: FormData, key: string) {
  return typeof formData.get(key) === "string" ? String(formData.get(key)) : "";
}

export async function login(_state: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse({ email: value(formData, "email"), password: value(formData, "password") });
  if (!parsed.success) return { error: "Enter a valid email and a password of at least 8 characters." };
  const supabase = await createSupabaseServerClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Unable to sign in with those credentials." };
  
  if (authData.user) {
    const { data: profile } = await supabase.from("profiles").select("platform_role").eq("id", authData.user.id).single();
    if (profile?.platform_role === "tech_user") {
      revalidatePath("/tech", "layout");
      redirect("/tech");
    }
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function signup(_state: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    displayName: value(formData, "displayName"),
    email: value(formData, "email"),
    password: value(formData, "password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your name, email, and password." };
  }

  const displayName = parsed.data.displayName;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: displayName,
        platform_role: 'tech_user',
      },
    },
  });
  if (error || !data.user) return { error: error?.message || "Unable to create the account." };

  // Dispatch branded welcome email
  sendTemplatedEmail({
    type: "welcome",
    to: parsed.data.email,
    variables: {
      displayName,
      email: parsed.data.email,
    },
  }).catch((err) => console.error("[auth] Failed to dispatch welcome email:", err));

  if (!data.session) return { success: "Account created! Confirm your email, then sign in to get started." };
  
  redirect("/tech");
}

export async function requestPasswordReset(_state: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = resetEmailSchema.safeParse({ email: value(formData, "email") });
  if (!parsed.success) return { error: "Please enter a valid email address." };

  const supabase = await createSupabaseServerClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectTo = `${origin}/auth/callback?type=recovery&next=/auth/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  if (error) {
    console.error("Password reset error:", error.message);
    // Return friendly generic response to prevent email enumeration
  }

  return {
    success: "If an account exists with that email, a password reset link has been sent. Check your inbox and spam folder.",
  };
}

export async function updatePassword(_state: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse({
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid password provided." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message || "Failed to update password. Please request a new reset link." };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
