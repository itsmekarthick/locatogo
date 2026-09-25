"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import {
  type EmailType,
  DEFAULT_EMAIL_TEMPLATES,
} from "@/lib/email/defaults";
import { sendTemplatedEmail, replaceVariables } from "@/lib/email/send";
import { getResendClient } from "@/lib/email/resend";

const updateTemplateSchema = z.object({
  type: z.enum(["welcome", "email_verified", "password_reset_sent", "listing_published"]),
  subject: z.string().trim().min(1, "Subject cannot be empty").max(255),
  html_content: z.string().min(1, "HTML content cannot be empty"),
});

const resetTemplateSchema = z.object({
  type: z.enum(["welcome", "email_verified", "password_reset_sent", "listing_published"]),
});

const sendTestSchema = z.object({
  type: z.enum(["welcome", "email_verified", "password_reset_sent", "listing_published"]),
  recipientEmail: z.string().trim().email("Please enter a valid email address"),
  customSubject: z.string().optional(),
  customHtml: z.string().optional(),
});

export async function updateEmailTemplateAction(formData: FormData) {
  try {
    const { tenant, membership, supabase } = await requireTenantContext();

    if (membership.role !== "tenant_owner" && membership.role !== "tenant_staff") {
      return { error: "Unauthorized: only tenant administrators can edit templates." };
    }

    const parsed = updateTemplateSchema.safeParse({
      type: formData.get("type"),
      subject: formData.get("subject"),
      html_content: formData.get("html_content"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid template payload." };
    }

    const { type, subject, html_content } = parsed.data;
    const defaultMeta = DEFAULT_EMAIL_TEMPLATES[type];

    const { error: upsertError } = await supabase
      .from("email_templates")
      .upsert(
        {
          tenant_id: tenant.id,
          type,
          name: defaultMeta.name,
          description: defaultMeta.description,
          subject,
          html_content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,type" }
      );

    if (upsertError) {
      return { error: `Database error: ${upsertError.message}` };
    }

    revalidatePath("/admin/settings/emails");
    return { success: `Successfully saved "${defaultMeta.name}" template.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update template.";
    return { error: msg };
  }
}

export async function resetEmailTemplateAction(type: EmailType) {
  try {
    const { tenant, membership, supabase } = await requireTenantContext();

    if (membership.role !== "tenant_owner" && membership.role !== "tenant_staff") {
      return { error: "Unauthorized: only tenant administrators can reset templates." };
    }

    const parsed = resetTemplateSchema.safeParse({ type });
    if (!parsed.success) return { error: "Invalid template type." };

    const defaultTpl = DEFAULT_EMAIL_TEMPLATES[type];
    if (!defaultTpl) return { error: "Unknown template type." };

    const { error: upsertError } = await supabase
      .from("email_templates")
      .upsert(
        {
          tenant_id: tenant.id,
          type,
          name: defaultTpl.name,
          description: defaultTpl.description,
          subject: defaultTpl.subject,
          html_content: defaultTpl.htmlContent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,type" }
      );

    if (upsertError) {
      return { error: `Database error: ${upsertError.message}` };
    }

    revalidatePath("/admin/settings/emails");
    return { success: `Reset "${defaultTpl.name}" to factory default.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to reset template.";
    return { error: msg };
  }
}

export async function sendTestEmailAction({
  type,
  recipientEmail,
  customSubject,
  customHtml,
}: {
  type: EmailType;
  recipientEmail: string;
  customSubject?: string;
  customHtml?: string;
}) {
  try {
    const { tenant, membership } = await requireTenantContext();

    if (membership.role !== "tenant_owner" && membership.role !== "tenant_staff") {
      return { error: "Unauthorized." };
    }

    const parsed = sendTestSchema.safeParse({
      type,
      recipientEmail,
      customSubject,
      customHtml,
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid email address." };
    }

    if (!process.env.RESEND_API_KEY) {
      return {
        error: "RESEND_API_KEY is not configured in environment variables. Please add it to .env to deliver real emails.",
      };
    }

    const resend = getResendClient();
    if (!resend) {
      return { error: "RESEND_API_KEY is not configured in environment variables. Please add it to .env to deliver real emails." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://locatogo.com";
    const testVariables = {
      displayName: "Jane Doe (Test)",
      email: parsed.data.recipientEmail,
      appUrl,
      year: new Date().getFullYear(),
      resetLink: `${appUrl}/auth/reset-password?token=sample-test-token`,
      listingTitle: "Acme Cloud Technologies",
      listingUrl: `${appUrl}/tech`,
    };

    const defaultTpl = DEFAULT_EMAIL_TEMPLATES[type];
    const subjectToUse = `[TEST] ${parsed.data.customSubject || defaultTpl.subject}`;
    const htmlToUse = parsed.data.customHtml || defaultTpl.htmlContent;

    const interpolatedSubject = replaceVariables(subjectToUse, testVariables);
    const interpolatedHtml = replaceVariables(htmlToUse, testVariables);

    const from = process.env.RESEND_FROM_EMAIL ?? "LocaToGo <hello@locatogo.com>";
    const { data, error } = await resend.emails.send({
      from,
      to: parsed.data.recipientEmail,
      subject: interpolatedSubject,
      html: interpolatedHtml,
    });

    if (error) {
      return { error: error.message };
    }

    return {
      success: `Test email dispatched to ${parsed.data.recipientEmail} (Resend ID: ${data?.id})!`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send test email.";
    return { error: msg };
  }
}
