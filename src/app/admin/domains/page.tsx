import { createDomain } from "@/app/admin/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminDomainsList } from "@/components/admin-domains-list";

export default async function DomainsPage() {
  const { supabase, tenant } = await requireTenantContext();
  const { data: domains } = await supabase.from("domains").select("id, name, slug, status, created_at").eq("tenant_id", tenant.id).order("created_at", { ascending: false });

  return (
    <div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Multi-Directory Setup</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em]">Directories (Domains)</h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Each domain is an independent directory website with its own public map, taxonomy, listings, and branding.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
        <h2 className="font-display text-xl font-bold">Create a New Directory</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Set up a new targeted directory under your workspace.</p>

        <form action={createDomain} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Directory Title <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">e.g. "Berlin Specialty Coffee" or "Global Climate Hub"</p>
              <input
                name="name"
                required
                placeholder="e.g. Tokyo Coffee Guide"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Public URL Slug <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Determines the public link: /your-slug</p>
              <input
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="e.g. tokyo-coffee"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--foreground)]">
              Directory Description (Optional)
            </label>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">A summary displayed on the directory homepage and search engines.</p>
            <textarea
              name="description"
              rows={2}
              placeholder="Curated map of specialty coffee roasters, minimalist cafes, and tasting rooms across Tokyo."
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-sm font-semibold text-[var(--paper)] shadow transition-transform hover:-translate-y-0.5">
              Create directory
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold mb-4">Existing Directories</h2>
        <AdminDomainsList domains={domains ?? []} />
      </div>
    </div>
  );
}
