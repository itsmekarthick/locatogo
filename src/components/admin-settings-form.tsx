"use client";

import { useState, useTransition } from "react";
import { updateTenantSettings } from "@/app/admin/actions";

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

export function SettingsForm({ tenant, membership, userEmail, userId, logoutAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
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
    setSaved(false);
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
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save settings.");
      }
    });
  }

  return (
    <div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Workspace</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em]">Settings</h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">Manage your workspace details, branding, and account settings.</p>
      </div>

      {/* Success/Error banners */}
      {saved && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <span>✅</span> Settings saved successfully!
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 flex items-center gap-2">
          <span>❌</span> {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 max-w-3xl">
        {/* Workspace Details */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
          <h2 className="font-display text-xl font-bold">Workspace Details</h2>
          <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Core workspace identity and configuration</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Workspace Name
              </label>
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none transition-colors"
                placeholder="My Directory"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--ink-muted)]">Slug</label>
                <p className="mt-1.5 rounded-xl bg-[var(--background)] px-4 py-2.5 text-sm font-mono text-[var(--ink-muted)]">
                  {tenant.slug}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink-muted)]">Status</label>
                <p className="mt-1.5">
                  <span className="rounded-full bg-[var(--leaf)] px-3 py-1 text-xs font-semibold text-[var(--leaf-dark)] capitalize">
                    {tenant.status}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-muted)]">Your Role</label>
              <p className="mt-1.5 text-sm font-semibold capitalize">{membership.role?.replace("_", " ")}</p>
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
          <h2 className="font-display text-xl font-bold">Branding</h2>
          <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Customize your directory&apos;s visual identity</p>

          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Primary Color
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--line)]"
                  />
                  <input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-mono focus:outline-none"
                    placeholder="#0ea5e9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Secondary Color
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--line)]"
                  />
                  <input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm font-mono focus:outline-none"
                    placeholder="#1b5e20"
                  />
                </div>
              </div>
            </div>

            {/* Color preview */}
            <div className="flex gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2.5">
                <div className="h-5 w-5 rounded-full shadow-inner" style={{ backgroundColor: primaryColor }} />
                <span className="text-xs font-medium">Primary</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2.5">
                <div className="h-5 w-5 rounded-full shadow-inner" style={{ backgroundColor: secondaryColor }} />
                <span className="text-xs font-medium">Secondary</span>
              </div>
              <div
                className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-white text-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                Gradient Preview
              </div>
            </div>
          </div>
        </section>

        {/* Directory Defaults */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
          <h2 className="font-display text-xl font-bold">Directory Defaults</h2>
          <p className="mt-1 text-[11px] text-[var(--ink-muted)]">Default settings for new directories and listings</p>

          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Default Timezone
                </label>
                <select
                  value={defaultTimezone}
                  onChange={(e) => setDefaultTimezone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm focus:outline-none"
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Default Currency
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm focus:outline-none"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Default Map Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={defaultLat}
                  onChange={(e) => setDefaultLat(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Default Map Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={defaultLng}
                  onChange={(e) => setDefaultLng(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Default Map Zoom
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={defaultZoom}
                  onChange={(e) => setDefaultZoom(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-full bg-[var(--foreground)] px-8 py-3 text-xs font-bold uppercase tracking-wider text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Account */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
          <h2 className="font-display text-xl font-bold">Account</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-[var(--line)] py-2.5">
              <span className="text-[var(--ink-muted)]">Signed in as</span>
              <span className="font-semibold">{userEmail}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] py-2.5">
              <span className="text-[var(--ink-muted)]">User ID</span>
              <span className="font-mono text-xs text-[var(--ink-muted)]">{userId}</span>
            </div>
          </div>
          <form action={logoutAction} className="mt-6">
            <button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--coral)] hover:bg-[var(--coral)]/10 transition-colors">
              Sign out
            </button>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <h2 className="font-display text-xl font-bold text-red-700">Danger Zone</h2>
          <p className="mt-1 text-[11px] text-red-600/70">Irreversible actions. Proceed with caution.</p>
          <div className="mt-4">
            <button
              className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
              disabled
              title="Contact support to archive this workspace"
            >
              Archive Workspace (contact support)
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
