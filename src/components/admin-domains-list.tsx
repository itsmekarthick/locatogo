"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/pagination";
import { updateDomain } from "@/app/admin/actions";

type DomainItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  default_latitude?: number | null;
  default_longitude?: number | null;
  created_at: string;
};

const PAGE_SIZE = 6;

export function AdminDomainsList({ domains }: { domains: DomainItem[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingDomain, setEditingDomain] = useState<DomainItem | null>(null);

  const totalPages = Math.ceil(domains.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return domains.slice(start, start + PAGE_SIZE);
  }, [domains, currentPage]);

  return (
    <div className="space-y-4">
      {/* Existing Domains Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {paginated.length > 0 ? (
          paginated.map((domain) => (
            <article
              key={domain.id}
              className="flex flex-col justify-between rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs transition-all hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--leaf-dark)] uppercase">
                    {domain.status}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                    Created {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(domain.created_at))}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-lg font-bold text-[var(--foreground)]">
                  {domain.name}
                </h3>
                <p className="mt-0.5 font-mono text-xs text-[var(--coral)]">
                  /{domain.slug}
                </p>

                {domain.description && (
                  <p className="mt-2 text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                    {domain.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingDomain(domain)}
                  className="rounded-full border border-[var(--line)] bg-[var(--background)] px-4 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>✏️</span>
                  <span>Edit Atlas</span>
                </button>

                <Link
                  href={`/${domain.slug}`}
                  target="_blank"
                  className="rounded-full bg-[var(--foreground)] px-4 py-1.5 text-xs font-semibold text-[var(--paper)] hover:bg-[var(--foreground)]/85 transition-colors"
                >
                  View Live ↗
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="sm:col-span-2 rounded-3xl border border-dashed border-[var(--line)] p-12 text-center text-sm text-[var(--ink-muted)]">
            No directories found. Create your first directory atlas above!
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={domains.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {/* Edit Domain Modal */}
      {editingDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--foreground)]">
                  Edit Directory Atlas
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">Update directory details and slug</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDomain(null)}
                className="rounded-full p-2 text-sm text-[var(--ink-muted)] hover:bg-[var(--background)]"
              >
                ✕
              </button>
            </div>

            <form action={updateDomain} className="mt-5 space-y-4">
              <input type="hidden" name="domainId" value={editingDomain.id} />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Directory Title <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingDomain.name}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Public URL Slug <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  defaultValue={editingDomain.slug}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                  Public URL: /{editingDomain.slug} or {editingDomain.slug}.locatogo.com
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Directory Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingDomain.description ?? ""}
                  placeholder="Summary for search engines and visitors..."
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setEditingDomain(null)}
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
