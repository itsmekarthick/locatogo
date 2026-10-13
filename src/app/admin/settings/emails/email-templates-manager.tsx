"use client";

import { useState, useTransition } from "react";
import {
  type EmailType,
  type DefaultEmailTemplate,
  DEFAULT_EMAIL_TEMPLATES,
} from "@/lib/email/defaults";
import {
  updateEmailTemplateAction,
  resetEmailTemplateAction,
  sendTestEmailAction,
} from "./actions";

export interface StoredTemplate {
  id?: string;
  type: EmailType;
  subject: string;
  html_content: string;
  updated_at?: string;
}

interface EmailTemplatesManagerProps {
  initialTemplates: Record<EmailType, StoredTemplate>;
  currentUserEmail: string;
}

const TEMPLATE_TABS: { type: EmailType; label: string; icon: string; badge: string }[] = [
  { type: "welcome", label: "Welcome Email", icon: "🚀", badge: "On Registration" },
  { type: "email_verified", label: "Email Verified", icon: "✅", badge: "On Verification" },
  { type: "password_reset_sent", label: "Password Reset", icon: "🔐", badge: "On Auth Reset" },
  { type: "listing_published", label: "Listing Published", icon: "🏢", badge: "On Publish" },
];

export function EmailTemplatesManager({
  initialTemplates,
  currentUserEmail,
}: EmailTemplatesManagerProps) {
  const [activeType, setActiveType] = useState<EmailType>("welcome");
  const [editorTab, setEditorTab] = useState<"code" | "preview">("code");
  const [templatesState, setTemplatesState] = useState<Record<EmailType, StoredTemplate>>(initialTemplates);
  const [isPending, startTransition] = useTransition();

  // Test email state
  const [testEmail, setTestEmail] = useState(currentUserEmail);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const currentTemplate = templatesState[activeType];
  const defaultMeta: DefaultEmailTemplate = DEFAULT_EMAIL_TEMPLATES[activeType];

  function handleSubjectChange(newSubject: string) {
    setTemplatesState((prev) => ({
      ...prev,
      [activeType]: {
        ...prev[activeType],
        subject: newSubject,
      },
    }));
  }

  function handleHtmlChange(newHtml: string) {
    setTemplatesState((prev) => ({
      ...prev,
      [activeType]: {
        ...prev[activeType],
        html_content: newHtml,
      },
    }));
  }

  function copyVariable(varName: string) {
    const textToCopy = `{{${varName}}}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 2000);
  }

  function handleSave() {
    setStatusMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("type", activeType);
      formData.set("subject", currentTemplate.subject);
      formData.set("html_content", currentTemplate.html_content);

      const res = await updateEmailTemplateAction(formData);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setStatusMessage({ type: "success", text: res.success || "Template saved successfully!" });
      }
    });
  }

  function handleReset() {
    if (!confirm(`Are you sure you want to reset the "${defaultMeta.name}" template to factory default?`)) {
      return;
    }
    setStatusMessage(null);
    startTransition(async () => {
      const res = await resetEmailTemplateAction(activeType);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setTemplatesState((prev) => ({
          ...prev,
          [activeType]: {
            ...prev[activeType],
            subject: defaultMeta.subject,
            html_content: defaultMeta.htmlContent,
          },
        }));
        setStatusMessage({ type: "success", text: res.success || "Template reset to default." });
      }
    });
  }

  async function handleSendTest() {
    if (!testEmail || !testEmail.includes("@")) {
      setStatusMessage({ type: "error", text: "Please enter a valid recipient email for the test." });
      return;
    }

    setIsSendingTest(true);
    setStatusMessage(null);

    try {
      const res = await sendTestEmailAction({
        type: activeType,
        recipientEmail: testEmail,
        customSubject: currentTemplate.subject,
        customHtml: currentTemplate.html_content,
      });

      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setStatusMessage({ type: "success", text: res.success || "Test email sent successfully!" });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Failed to dispatch test email." });
    } finally {
      setIsSendingTest(false);
    }
  }

  // Generates preview HTML with mock variables
  function getPreviewHtml() {
    const sampleVars: Record<string, string> = {
      displayName: "Alex Morgan",
      email: currentUserEmail || "alex.morgan@example.com",
      appUrl: window?.location?.origin || "https://locatogo.com",
      year: new Date().getFullYear().toString(),
      resetLink: `${window?.location?.origin || "https://locatogo.com"}/auth/reset-password?token=sample-test-token`,
      listingTitle: "Acme AI Systems",
      listingUrl: `${window?.location?.origin || "https://locatogo.com"}/dashboard`,
    };

    let preview = currentTemplate.html_content;
    for (const [k, v] of Object.entries(sampleVars)) {
      preview = preview.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), v);
    }
    return preview;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✉️</span>
              <h1 className="font-display text-xl font-bold text-[var(--foreground)]">
                Email Templates & Notifications
              </h1>
            </div>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Customize transactional email copy, branding, and subjects delivered to your users via Resend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--leaf)]/10 px-3 py-1 text-xs font-semibold text-[var(--leaf-dark)]">
              <span className="h-2 w-2 rounded-full bg-[var(--leaf)]"></span>
              Resend Delivery Engine
            </span>
          </div>
        </div>

        {/* Template Selector Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-[var(--line)] pb-3">
          {TEMPLATE_TABS.map((tab) => {
            const isActive = activeType === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => {
                  setActiveType(tab.type);
                  setStatusMessage(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[var(--foreground)] text-[var(--paper)] shadow-sm"
                    : "bg-[var(--background)] text-[var(--ink-muted)] hover:bg-[var(--line)]/50 hover:text-[var(--foreground)]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isActive
                      ? "bg-[var(--paper)]/20 text-[var(--paper)]"
                      : "bg-[var(--line)] text-[var(--ink-muted)]"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Notification Alert */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
            statusMessage.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{statusMessage.type === "success" ? "✅" : "⚠️"}</span>
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor & Configuration Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Metadata & Variables */}
        <div className="space-y-6 lg:col-span-1">
          {/* Template Info Card */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Template Details
            </h2>
            <div>
              <p className="font-display text-base font-semibold text-[var(--foreground)]">
                {defaultMeta.name}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-muted)] leading-relaxed">
                {defaultMeta.description}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--background)] p-3 text-xs text-[var(--ink-muted)]">
              <span className="font-semibold text-[var(--foreground)]">Type ID:</span>{" "}
              <code className="text-[var(--coral)]">{activeType}</code>
            </div>
          </div>

          {/* Dynamic Variables Card */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Available Variables
              </h2>
              <span className="text-[11px] text-[var(--ink-muted)]">Click to copy</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {defaultMeta.availableVariables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => copyVariable(v)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                    copiedVar === v
                      ? "bg-emerald-500 text-white"
                      : "bg-[var(--background)] text-[var(--coral)] hover:bg-[var(--coral)]/10 border border-[var(--line)]"
                  }`}
                  title={`Click to copy {{${v}}}`}
                >
                  <span>{copiedVar === v ? "✓" : "+"}</span>
                  <span>{`{{${v}}}`}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed pt-1">
              Insert these tags anywhere in the subject or HTML content. They are automatically replaced with recipient details upon sending.
            </p>
          </div>

          {/* Send Test Dispatcher Card */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Send Live Test Email
            </h2>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              Test delivery to your inbox using current unsaved edits.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--ink-muted)]/50 focus:border-[var(--coral)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSendingTest}
                className="w-full rounded-xl bg-[var(--background)] border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] shadow-xs hover:bg-[var(--line)]/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSendingTest ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
                    <span>Dispatching test...</span>
                  </>
                ) : (
                  <>
                    <span>📨</span>
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Subject & HTML Editor / Preview */}
        <div className="space-y-6 lg:col-span-2">
          {/* Subject Field */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="subject-input" className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Email Subject Line
              </label>
              <span className="text-[11px] text-[var(--ink-muted)]">
                {currentTemplate.subject.length} / 255 chars
              </span>
            </div>
            <input
              id="subject-input"
              type="text"
              value={currentTemplate.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              placeholder="e.g. Welcome to LocaToGo, {{displayName}}!"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--ink-muted)]/50 focus:border-[var(--coral)] focus:outline-none"
            />
          </div>

          {/* HTML Editor / Live Preview Container */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-sm overflow-hidden flex flex-col min-h-[560px]">
            {/* Tab switch header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3 bg-[var(--background)]/50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorTab("code")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    editorTab === "code"
                      ? "bg-[var(--foreground)] text-[var(--paper)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  HTML Source Code
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    editorTab === "preview"
                      ? "bg-[var(--foreground)] text-[var(--paper)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Live Visual Preview
                </button>
              </div>

              <div className="text-[11px] text-[var(--ink-muted)]">
                {editorTab === "code" ? "Raw HTML Editor" : "Simulated client view"}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-0 flex flex-col">
              {editorTab === "code" ? (
                <div className="p-4 flex-1 flex flex-col">
                  <textarea
                    value={currentTemplate.html_content}
                    onChange={(e) => handleHtmlChange(e.target.value)}
                    rows={22}
                    className="w-full flex-1 rounded-xl border border-[var(--line)] bg-slate-950 p-4 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-[var(--coral)] focus:outline-none leading-relaxed resize-y selection:bg-sky-500 selection:text-white"
                    placeholder="<!DOCTYPE html>..."
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="flex-1 p-4 bg-slate-100 dark:bg-slate-900 flex justify-center">
                  <div className="w-full max-w-[620px] rounded-xl overflow-hidden shadow-md border border-slate-300 dark:border-slate-800 bg-white">
                    <iframe
                      title="Live Email Preview"
                      srcDoc={getPreviewHtml()}
                      className="w-full h-[520px] border-none"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--line)] px-5 py-4 bg-[var(--paper)]">
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline disabled:opacity-50 text-left"
              >
                ↺ Reset to Factory Default
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-xs font-bold text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/85 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--paper)] border-t-transparent" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Template</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
