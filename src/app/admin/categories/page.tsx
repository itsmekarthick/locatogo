import { createCategory } from "@/app/admin/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminCategoriesList } from "@/components/admin-categories-list";

export default async function CategoriesPage() {
  const { supabase, tenant } = await requireTenantContext();
  const [{ data: domains }, { data: categories }] = await Promise.all([
    supabase.from("domains").select("id, name").eq("tenant_id", tenant.id).order("name"),
    supabase.from("categories").select("id, name, slug, domain_id").eq("tenant_id", tenant.id).order("sort_order").order("name"),
  ]);

  return (
    <div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Taxonomy & Organization</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em]">Categories</h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Build a structured category hierarchy for each directory. Categories power discovery filters, search tags, and map icons.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
        <h2 className="font-display text-xl font-bold">Add a Category</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Categories power discovery filters, search tags, and map icons.</p>

        <form action={createCategory} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Category Name <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">e.g. "Schools & Education", "Hospitals & Healthcare"</p>
              <input
                name="name"
                required
                placeholder="e.g. Schools & Education"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                URL Slug <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">e.g. "schools-education"</p>
              <input
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="e.g. schools-education"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-sm font-semibold text-[var(--paper)] shadow transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              Add category
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold mb-4">Existing Categories</h2>
        <AdminCategoriesList
          categories={categories ?? []}
          domains={domains ?? []}
        />
      </div>
    </div>
  );
}
