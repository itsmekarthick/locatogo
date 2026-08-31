"use client";

import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { updateCategory, archiveCategory } from "@/app/admin/actions";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  domain_id?: string;
  is_active?: boolean;
};

type DomainItem = {
  id: string;
  name: string;
  slug?: string;
};

const PAGE_SIZE = 8;

export function AdminCategoriesList({
  categories,
  domains,
}: {
  categories: CategoryItem[];
  domains: DomainItem[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const domainMap = useMemo(() => {
    return new Map(domains.map((d) => [d.id, d.name]));
  }, [domains]);

  const filtered = useMemo(() => {
    return categories.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    });
  }, [categories, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-4">
      {categories.length > 4 && (
        <div className="flex justify-end">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter categories by name or slug..."
            className="w-full sm:w-72 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs text-[var(--foreground)] placeholder-[var(--ink-muted)] focus:outline-none shadow-2xs"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {paginated.length > 0 ? (
          paginated.map((category) => {
            const icon =
              category.name.includes("School") || category.name.includes("Education")
                ? "🏫"
                : category.name.includes("Hospital") || category.name.includes("Health")
                ? "🏥"
                : category.name.includes("Tech") || category.name.includes("Software")
                ? "💻"
                : category.name.includes("Food") || category.name.includes("Restaurant") || category.name.includes("Cafe")
                ? "☕"
                : "🏷️";

            const domainName = category.domain_id ? domainMap.get(category.domain_id) : null;

            return (
              <article
                key={category.id}
                className="flex flex-col justify-between rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xs transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--background)] text-lg border border-[var(--line)]">
                      {icon}
                    </span>
                    {domainName && (
                      <span className="rounded-full bg-[var(--background)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--ink-muted)] border border-[var(--line)]">
                        {domainName}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 font-semibold text-sm text-[var(--foreground)]">{category.name}</h3>
                  <p className="mt-0.5 font-mono text-xs text-[var(--coral)]">/{category.slug}</p>

                  {category.description && (
                    <p className="mt-1.5 text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs">
                  <span className="rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--leaf-dark)] uppercase">
                    Active
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(category)}
                      className="rounded-full border border-[var(--line)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </button>

                    <form action={archiveCategory}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <button
                        type="submit"
                        onClick={(e) => {
                          if (!confirm(`Archive category "${category.name}"?`)) e.preventDefault();
                        }}
                        className="rounded-full px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Archive category"
                      >
                        Archive
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="sm:col-span-2 rounded-3xl border border-dashed border-[var(--line)] p-12 text-center text-sm text-[var(--ink-muted)]">
            No categories found matching your search.
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--foreground)]">
                  Edit Category
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">Update taxonomy classification and slug</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="rounded-full p-2 text-sm text-[var(--ink-muted)] hover:bg-[var(--background)]"
              >
                ✕
              </button>
            </div>

            <form action={updateCategory} className="mt-5 space-y-4">
              <input type="hidden" name="categoryId" value={editingCategory.id} />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Category Name <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingCategory.name}
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
                  defaultValue={editingCategory.slug}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                  Filter link: /?category={editingCategory.id} or /{editingCategory.slug}
                </p>
              </div>

              {domains.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                    Directory Domain
                  </label>
                  <select
                    name="domainId"
                    defaultValue={editingCategory.domain_id || ""}
                    className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm focus:outline-none"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.slug ? `(/${d.slug})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingCategory.description ?? ""}
                  placeholder="Summary for places in this category..."
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-full border border-[var(--line)] px-5 py-2 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--background)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--foreground)] px-6 py-2 text-xs font-bold text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
