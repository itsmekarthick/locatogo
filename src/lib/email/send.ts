import { resend } from "@/lib/email/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  type EmailType,
  DEFAULT_EMAIL_TEMPLATES,
} from "@/lib/email/defaults";

const FROM = process.env.RESEND_FROM_EMAIL ?? "LocaToGo <hello@locatogo.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://locatogo.com";

export interface SendTemplatedEmailOptions {
  type: EmailType;
  to: string;
  variables?: Record<string, string | number | undefined | null>;
  tenantId?: string;
  customSubject?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Replaces {{variableName}} tags in a string with supplied values.
 */
export function replaceVariables(
  text: string,
  variables: Record<string, string | number | undefined | null>
): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = variables[key];
    return val !== undefined && val !== null ? String(val) : "";
  });
}

/**
 * Common function to fetch configured email template from DB (or fallback to defaults),
 * interpolate dynamic variables, and deliver via Resend.
 *
 * Never throws — failures are logged so critical caller actions (signup, callbacks) are never blocked.
 */
export async function sendTemplatedEmail({
  type,
  to,
  variables = {},
  tenantId,
  customSubject,
}: SendTemplatedEmailOptions): Promise<SendEmailResult> {
  const mergedVariables: Record<string, string | number | undefined | null> = {
    appUrl: APP_URL,
    year: new Date().getFullYear(),
    toEmail: to,
    ...variables,
  };

  const defaultTpl = DEFAULT_EMAIL_TEMPLATES[type] ?? DEFAULT_EMAIL_TEMPLATES.welcome;
  let subjectTemplate = customSubject || defaultTpl.subject;
  let htmlTemplate = defaultTpl.htmlContent;

  // 1. Attempt to fetch configured template from database
  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("email_templates")
      .select("subject, html_content")
      .eq("type", type);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: dbTemplate } = await query.limit(1).maybeSingle();

    if (dbTemplate?.subject) {
      if (!customSubject) {
        subjectTemplate = dbTemplate.subject;
      }
    }
    if (dbTemplate?.html_content) {
      htmlTemplate = dbTemplate.html_content;
    }
  } catch (dbErr) {
    console.warn(
      `[email] Notice: Could not read custom template for "${type}" from database, using defaults:`,
      dbErr instanceof Error ? dbErr.message : dbErr
    );
  }

  // 2. Interpolate variables into subject and HTML
  const finalSubject = replaceVariables(subjectTemplate, mergedVariables);
  const finalHtml = replaceVariables(htmlTemplate, mergedVariables);

  // 3. Check Resend configuration
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[email] RESEND_API_KEY not configured. Simulated sending "${finalSubject}" to ${to}.`
    );
    return {
      success: false,
      error: "RESEND_API_KEY not configured",
    };
  }

  // 4. Send via Resend
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: finalSubject,
      html: finalHtml,
    });

    if (error) {
      console.error(`[email] Resend error for "${finalSubject}" to ${to}:`, error);
      return { success: false, error: error.message };
    }

    console.info(`[email] Successfully delivered "${finalSubject}" to ${to} (ID: ${data?.id})`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[email] Unexpected error sending "${finalSubject}" to ${to}:`, err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Direct send helper for custom HTML without template lookup.
 */
export async function sendRawEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not configured. Simulated raw email to ${to}.`);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[email] Failed raw send to ${to}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[email] Unexpected error in sendRawEmail to ${to}:`, err);
    return { success: false, error: errorMsg };
  }
}
