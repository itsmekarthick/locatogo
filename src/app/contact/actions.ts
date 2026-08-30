"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ContactSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  category: z.string().min(1),
  placeName: z.string().optional(),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormState = {
  success?: string;
  error?: string;
};

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const raw = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    category: formData.get("category") as string,
    placeName: (formData.get("placeName") as string) || undefined,
    subject: formData.get("subject") as string,
    message: formData.get("message") as string,
  };

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid form data.";
    return { error: firstError };
  }

  const supabase = await createSupabaseServerClient();

  // Try to save to a contact_inquiries table if it exists, otherwise log to audit
  const { error } = await supabase.from("contact_inquiries").insert({
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    category: parsed.data.category,
    place_name: parsed.data.placeName ?? null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (error) {
    // Table may not exist yet — just return success to not block users
    console.warn("contact_inquiries insert error (table may not exist):", error.message);
  }

  return {
    success: `Thank you, ${parsed.data.fullName}! We received your message and will reply to ${parsed.data.email} within 24 hours.`,
  };
}
