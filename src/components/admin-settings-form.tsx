"use client";

import { useState, useTransition, type ReactNode } from "react";
import { updateTenantSettings } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, LogOutIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

type Props = {
  tenant: { id: string; name: string; slug: string; status: string };
  membership: { role: string | null };
  userEmail: string;
  userId: string;
  logoutAction: () => Promise<void>;
};

const timezoneOptions = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Europe/Paris", "Asia/Kolkata", "Asia/Tokyo",
  "Asia/Shanghai", "Asia/Singapore", "Australia/Sydney", "Pacific/Auckland",
];

const currencyOptions = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "SGD", label: "Singapore Dollar (S$)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
];

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6">
      <h2 className="font-display text-lg font-semibold tracking-tight text-fg">{title}</h2>
      {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ColorField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <Input
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="font-mono"
      trailing={
        <input
          type="color"
          aria-label={`${label} picker`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="focus-ring size-7 cursor-pointer rounded-md border border-line-strong bg-surface-1 p-0.5"
        />
      }
    />
  );
}

export function SettingsForm({ tenant, membership, userEmail, userId, logoutAction }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [workspaceName, setWorkspaceName] = useState(tenant.name);
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9");
  const [secondaryColor, setSecondaryColor] = useState("#1b5e20");
  const [defaultTimezone, setDefaultTimezone] = useState("UTC");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [defaultLat, setDefaultLat] = useState("12.9716");
  const [defaultLng, setDefaultLng] = useState("77.5946");
  const [defaultZoom, setDefaultZoom] = useState("12");

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("workspaceName", workspaceName);
        formData.set("primaryColor", primaryColor);
        formData.set("secondaryColor", secondaryColor);
        formData.set("defaultTimezone", defaultTimezone);
        formData.set("defaultCurrency", defaultCurrency);
        formData.set("defaultLat", defaultLat);
        formData.set("defaultLng", defaultLng);
        formData.set("defaultZoom", defaultZoom);
        await updateTenantSettings(formData);
        toast({ title: "Settings saved", variant: "success" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save settings.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <AdminPageHeader eyebrow="Workspace" title="Settings" description="Manage your workspace details, branding, and account settings." />

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="grid gap-6">
        <Section title="Workspace details" description="Core workspace identity and configuration">
          <div className="space-y-5">
            <Input label="Workspace name" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="My directory" />

            <dl className="grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-fg-muted">Slug</dt>
                <dd className="mt-1.5 font-mono text-sm">{tenant.slug}</dd>
              </div>
              <div>
                <dt className="text-sm text-fg-muted">Status</dt>
                <dd className="mt-1.5">
                  <Badge variant={tenant.status === "active" ? "success" : "warning"} dot className="capitalize">
                    {tenant.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-fg-muted">Your role</dt>
                <dd className="mt-1.5 text-sm font-medium capitalize">{membership.role?.replace(/_/g, " ")}</dd>
              </div>
            </dl>
          </div>
        </Section>

        <Section title="Branding" description="Customize your directory's visual identity">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Primary color" value={primaryColor} onChange={setPrimaryColor} placeholder="#0ea5e9" />
              <ColorField label="Secondary color" value={secondaryColor} onChange={setSecondaryColor} placeholder="#1b5e20" />
            </div>

            <div className="flex flex-wrap items-center gap-3" aria-label="Color preview">
              <span className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <span className="size-4 rounded-full border border-line-strong" style={{ backgroundColor: primaryColor }} />
                Primary
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <span className="size-4 rounded-full border border-line-strong" style={{ backgroundColor: secondaryColor }} />
                Secondary
              </span>
              <span className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>
                Sample button
              </span>
            </div>
          </div>
        </Section>

        <Section title="Directory defaults" description="Default settings for new directories and listings">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Default timezone" value={defaultTimezone} onChange={(e) => setDefaultTimezone(e.target.value)}>
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>

              <Select label="Default currency" value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}>
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Map latitude" type="number" step="any" inputMode="decimal" value={defaultLat} onChange={(e) => setDefaultLat(e.target.value)} className="font-mono" />
              <Input label="Map longitude" type="number" step="any" inputMode="decimal" value={defaultLng} onChange={(e) => setDefaultLng(e.target.value)} className="font-mono" />
              <Input label="Map zoom" type="number" min="1" max="20" value={defaultZoom} onChange={(e) => setDefaultZoom(e.target.value)} className="font-mono" />
            </div>
          </div>
        </Section>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={isPending} size="lg">
            Save settings
          </Button>
        </div>

        <Section title="Account">
          <dl className="divide-y divide-line text-sm">
            <div className="flex flex-wrap justify-between gap-2 pb-3">
              <dt className="text-fg-muted">Signed in as</dt>
              <dd className="font-medium">{userEmail}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 pt-3">
              <dt className="text-fg-muted">User ID</dt>
              <dd className="break-all font-mono text-xs text-fg-subtle">{userId}</dd>
            </div>
          </dl>
          <form action={logoutAction} className="mt-6">
            <Button type="submit" variant="secondary" leadingIcon={<LogOutIcon className="size-4" />}>
              Sign out
            </Button>
          </form>
        </Section>

        <section className="rounded-2xl border border-danger/30 bg-danger-soft p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight text-danger">Danger zone</h2>
          <p className="mt-1 text-sm text-fg-muted">Irreversible actions. Proceed with caution.</p>
          <div className="mt-4">
            <Button variant="secondary" disabled title="Contact support to archive this workspace" className="text-danger">
              Archive workspace (contact support)
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
