import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant-context";

export const metadata = {
  title: "Editorial Guides & Stories | LocaToGo Workspace",
};

export default async function AdminBlogsPage() {
  const { supabase, tenant } = await requireTenantContext();

  const { data: blogs } = await supabase
    .from("blogs")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const articles = blogs ?? [];
  const publishedCount = articles.filter((a) => a.status === "published").length;
  const featuredCount = articles.filter((a) => a.is_featured).length;
  const totalViews = articles.reduce((acc, a) => acc + (a.view_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)]">
            <Link href="/admin" className="hover:text-[var(--foreground)] transition-colors">
              Admin
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">Content & Journalism</span>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            City Guides & Editorial Stories
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Manage long-form editorial guides, neighborhood spotlights, and tech insights that appear on your public directory and landing page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/blogs/new"
            className="rounded-full bg-slate-900 dark:bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-cyan-500 transition-ui shadow-xs flex items-center gap-1.5"
          >
            <span>+ Write Article</span>
          </Link>
          <Link
            href="/blog"
            target="_blank"
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>Public Journal</span>
            <span>↗</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-2xs">
          <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">Total Articles</p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--foreground)]">{articles.length}</p>
          <p className="mt-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">Editorial pieces</p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-2xs">
          <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">Published</p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--foreground)]">{publishedCount}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">Live in directories</p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-2xs">
          <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">Featured Spotlights</p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--foreground)]">{featuredCount}</p>
          <p className="mt-1 text-[11px] text-amber-600 font-semibold">Hero placements</p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-2xs">
          <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider">Reader Views</p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--foreground)]">{totalViews.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-slate-500 font-semibold">Engagements</p>
        </div>
      </div>

      {/* Articles Table */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-bold text-[var(--foreground)]">All Editorial Guides</h3>
            <p className="text-xs text-[var(--ink-muted)]">Articles published under this directory workspace</p>
          </div>
          <span className="text-xs text-[var(--ink-muted)] font-mono">{articles.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                <th className="py-3 px-3">Story Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Author</th>
                <th className="py-3 px-3">Read Time</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-xs">
              {articles.map((art) => (
                <tr key={art.id} className="hover:bg-[var(--line)]/20 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      {art.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={art.cover_image_url}
                          alt={art.title}
                          className="h-10 w-14 rounded-lg object-cover shrink-0 border border-[var(--line)]"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-xs flex items-center justify-center shrink-0">
                          📰
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--foreground)] truncate max-w-sm sm:max-w-md">
                          {art.title}
                        </p>
                        <p className="text-[11px] text-[var(--ink-muted)] truncate max-w-xs sm:max-w-md">
                          {art.excerpt || art.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 text-[10px] font-bold">
                      {art.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-[var(--foreground)] font-medium">
                    {art.author_name}
                  </td>
                  <td className="py-3.5 px-3 text-[var(--ink-muted)] font-mono text-[11px]">
                    {art.reading_time_minutes} min
                  </td>
                  <td className="py-3.5 px-3">
                    {art.status === "published" ? (
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 text-[10px] font-bold">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link
                        href={`/admin/blogs/${art.id}/edit`}
                        className="text-xs font-bold text-[var(--foreground)] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        Edit ✏️
                      </Link>
                      <Link
                        href={`/blog/${art.slug}`}
                        target="_blank"
                        className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <span>↗</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
