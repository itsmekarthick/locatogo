import { createCategory } from "@/app/admin/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminCategoriesList } from "@/components/admin-categories-list";

export default async function CategoriesPage() {
  const { supabase, tenant } = await requireTenantContext();
  const [{ data: domains }, { data: categories }] = await Promise.all([
    supabase.from("domains").select("id, name, slug").eq("tenant_id", tenant.id).order("name"),
    supabase
      .from("categories")
      .select("id, name, slug, description, domain_id, is_active")
      .eq("tenant_id", tenant.id)
      .order("sort_order")
      .order("name"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Taxonomy & Organization</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em]">Categories</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Build a structured category hierarchy for each directory atlas. Only enabled categories will appear in the directory UI, search filters, and map markers.
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
        <h2 className="font-display text-xl font-bold">Add a New Category</h2>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">Create a classification for places and map filters.</p>

        <form action={createCategory} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Category Name <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Schools & Education"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                URL Slug <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="e.g. schools-education"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Directory Domain <span className="text-[var(--coral)]">*</span>
              </label>
              <select
                name="domainId"
                defaultValue="global"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="global">🌐 All Domains (Global / Universal)</option>
                {domains?.map((d) => (
                  <option key={d.id} value={d.id}>
                    📍 {d.name} (/{d.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--foreground)]">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Short description of places in this sector..."
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] cursor-pointer select-none">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={true}
                className="h-4 w-4 rounded border-gray-300 text-[var(--coral)] focus:ring-[var(--coral)] cursor-pointer"
              />
              <span>Enable category in directory UI immediately</span>
            </label>

            <button className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-xs font-bold text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/90 transition-ui cursor-pointer">
              + Add Category
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold">Existing Categories ({categories?.length ?? 0})</h2>
        <AdminCategoriesList
          categories={categories ?? []}
          domains={domains ?? []}
        />
      </div>
    </div>
  );
}
