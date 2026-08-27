"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { claimInputSchema, submissionInputSchema } from "@/lib/validation/directory";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitListing(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const domainSlug = text(formData, "domainSlug");
  const parsed = submissionInputSchema.safeParse({ domainSlug, name: text(formData, "name"), email: text(formData, "email"), description: text(formData, "description"), city: text(formData, "city") || undefined });
  if (!parsed.success) throw new Error("Please provide a name, valid email, and description.");
  const { data: domain } = await supabase.from("domains").select("id, tenant_id").eq("slug", parsed.data.domainSlug).eq("status", "published").single();
  if (!domain) throw new Error("Directory not found.");
  const { data: allowed } = await supabase.rpc("consume_rate_limit", { target_key: `submission:${parsed.data.email.toLowerCase()}`, window_seconds: 3600, max_requests: 5 });
  if (!allowed) throw new Error("Too many submissions. Please try again later.");
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("listing_submissions").insert({ tenant_id: domain.tenant_id, domain_id: domain.id, submitted_by_user_id: user?.id ?? null, submitted_email: parsed.data.email, payload_json: { name: parsed.data.name, description: parsed.data.description, city: parsed.data.city ?? null } });
  if (error) throw new Error("Submission could not be received.");
  redirect(`/${parsed.data.domainSlug}?submitted=1`);
}

export async function submitClaim(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent("/" + text(formData, "domainPath"))}`);
  const parsed = claimInputSchema.safeParse({ listingId: text(formData, "listingId"), information: text(formData, "information") });
  if (!parsed.success) throw new Error("Please provide supporting information.");
  const { data: listing } = await supabase.from("listings").select("id, tenant_id, domain_id").eq("id", parsed.data.listingId).eq("status", "published").single();
  if (!listing) throw new Error("Listing not found.");
  const { error } = await supabase.from("listing_claims").insert({ tenant_id: listing.tenant_id, listing_id: listing.id, user_id: user.id, submitted_information: { note: parsed.data.information } });
  if (error) throw new Error("Claim could not be submitted.");
  redirect(`/${text(formData, "domainPath")}/listing/${text(formData, "listingSlug")}?claimed=1`);
}
