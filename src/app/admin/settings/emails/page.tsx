import { requireTenantContext } from "@/lib/auth/tenant-context";
import {
  type EmailType,
  DEFAULT_EMAIL_TEMPLATES,
} from "@/lib/email/defaults";
import {
  EmailTemplatesManager,
  type StoredTemplate,
} from "./email-templates-manager";

export const metadata = {
  title: "Email Templates | Workspace Operations",
  description: "Configure and customize transactional email templates sent to your users.",
};

const ALL_TYPES: EmailType[] = [
  "welcome",
  "email_verified",
  "password_reset_sent",
  "listing_published",
];

export default async function AdminEmailSettingsPage() {
  const { tenant, user, supabase } = await requireTenantContext();

  // Fetch templates for current tenant
  const { data: dbTemplates, error } = await supabase
    .from("email_templates")
    .select("id, type, subject, html_content, updated_at")
    .eq("tenant_id", tenant.id);

  if (error) {
    console.error("Error loading email templates:", error.message);
  }

  // Construct map of stored templates falling back to defaults if not yet customized
  const initialTemplates: Record<EmailType, StoredTemplate> = {} as Record<
    EmailType,
    StoredTemplate
  >;

  for (const type of ALL_TYPES) {
    const found = dbTemplates?.find((t) => t.type === type);
    const defaultTpl = DEFAULT_EMAIL_TEMPLATES[type];

    initialTemplates[type] = {
      id: found?.id,
      type,
      subject: found?.subject ?? defaultTpl.subject,
      html_content: found?.html_content ?? defaultTpl.htmlContent,
      updated_at: found?.updated_at,
    };
  }

  return (
    <div className="mx-auto max-w-6xl">
      <EmailTemplatesManager
        initialTemplates={initialTemplates}
        currentUserEmail={user.email ?? ""}
      />
    </div>
  );
}
