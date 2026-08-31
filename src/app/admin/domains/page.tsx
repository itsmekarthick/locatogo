import { createDomain } from "@/app/admin/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminDomainsList } from "@/components/admin-domains-list";

export default async function DomainsPage() {
  const { supabase, tenant } = await requireTenantContext();
  const { data: domains } = await supabase
    .from("domains")
    .select("id, name, slug, description, status, default_latitude, default_longitude, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Multi-Directory Setup</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em]">Directories (Domains)</h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)] text-sm">
          Each domain is an independent directory website with its own public map, taxonomy, listings, and branding (e.g. Bangalore, New York).
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
        <h2 className="font-display text-xl font-bold">Create a New Directory Atlas</h2>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">Set up a new city or vertical directory under your workspace.</p>

        <form action={createDomain} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Directory Title <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">e.g. "Bangalore Tech & Food Atlas" or "New York Guide"</p>
              <input
                name="name"
                required
                placeholder="e.g. Bangalore Tech Atlas"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Public URL Slug <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Determines the public link: /bangalore or bangalore.locatogo.com</p>
              <input
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="e.g. bangalore"
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
              placeholder="Curated interactive map of tech campuses, specialty coffee, and colleges across the city."
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-xs font-bold text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/90 transition-all">
              + Create Directory Atlas
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold">Existing Directories ({domains?.length ?? 0})</h2>
        <AdminDomainsList domains={domains ?? []} />
      </div>
    </div>
  );
}
