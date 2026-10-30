import { createCustomField } from "@/app/admin/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";

export default async function CustomFieldsPage() {
  const { supabase, tenant } = await requireTenantContext();
  const [{ data: domains }, { data: fields }] = await Promise.all([
    supabase.from("domains").select("id, name").eq("tenant_id", tenant.id).order("name"),
    supabase.from("custom_fields").select("id, name, key, field_type, domain_id, is_required, is_public").eq("tenant_id", tenant.id).order("sort_order").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Schema & Attributes</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
          Custom Fields
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Define custom data attributes (e.g. WiFi speed, outdoor seating, price range, pet policy) scoped to your directories.
        </p>
      </div>

      {/* Field Creator Card */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
        <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Define New Field</h2>
        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Fields will automatically appear on place detail forms for the selected directory.</p>

        <form action={createCustomField} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Directory <span className="text-[var(--coral)]">*</span>
              </label>
              <select
                name="domainId"
                required
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="">Select directory</option>
                {domains?.map((domain) => (
                  <option key={domain.id} value={domain.id}>{domain.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Field Label <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Outdoor Seating"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Internal Key <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                name="key"
                required
                pattern="[a-z][a-z0-9_]*"
                placeholder="e.g. outdoor_seating"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Type <span className="text-[var(--coral)]">*</span>
              </label>
              <select
                name="fieldType"
                required
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="text">Text (short string)</option>
                <option value="long_text">Long Text / Bio</option>
                <option value="number">Numeric (integer/float)</option>
                <option value="currency">Currency Price</option>
                <option value="boolean">Boolean Toggle (Yes/No)</option>
                <option value="date">Date</option>
                <option value="select">Single Select</option>
                <option value="multi_select">Multi-Select Tags</option>
                <option value="url">Website URL</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="image">Image Attachment</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
            <div className="flex items-center gap-6 text-xs font-medium">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" name="isRequired" className="rounded" /> Required field
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" name="isPublic" defaultChecked className="rounded" /> Visible publicly
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" name="isFilterable" className="rounded" /> Enable search filter
              </label>
            </div>

            <button
              disabled={!domains?.length}
              className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-bold text-[var(--paper)] shadow-xs hover:bg-[var(--foreground)]/85 transition-ui disabled:opacity-50"
            >
              + Create field
            </button>
          </div>
        </form>
      </div>

      {/* Existing Fields List */}
      <div>
        <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Active Custom Attributes</h2>
        <div className="mt-4 space-y-3">
          {fields?.length ? (
            fields.map((field) => (
              <article
                key={field.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[var(--foreground)]">{field.name}</h3>
                    <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[10px] font-mono text-[var(--ink-muted)]">
                      {field.key}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    Type: <span className="font-semibold text-[var(--foreground)] capitalize">{field.field_type.replace("_", " ")}</span> · Scoped to: {domains?.find((d) => d.id === field.domain_id)?.name || "Workspace"}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase ${field.is_required ? "bg-amber-100 text-amber-800" : "bg-[var(--background)] text-[var(--ink-muted)]"}`}>
                    {field.is_required ? "Required" : "Optional"}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase ${field.is_public ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}`}>
                    {field.is_public ? "Public" : "Internal"}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-10 text-center text-xs text-[var(--ink-muted)]">
              No custom fields configured yet. Define attributes above to enrich your directory cards.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
