import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminBlogForm } from "@/components/admin-blog-form";

export const metadata = {
  title: "New Editorial Story | LocaToGo Admin",
};

export default async function NewBlogPage() {
  await requireTenantContext();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)]">
            <Link href="/admin/blogs" className="hover:text-[var(--foreground)] transition-colors">
              ← Stories & Blogs
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">New Article</span>
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Write New Story / Guide
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Publish rich neighborhood itineraries, tech spotlights, or food and wellness guides.
          </p>
        </div>

        <Link
          href="/admin/blogs"
          className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors shadow-2xs"
        >
          Cancel
        </Link>
      </div>

      <AdminBlogForm mode="create" />
    </div>
  );
}
