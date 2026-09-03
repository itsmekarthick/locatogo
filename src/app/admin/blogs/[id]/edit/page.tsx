import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { AdminBlogForm } from "@/components/admin-blog-form";
import type { BlogPost } from "@/types/blog";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Edit Story | Locatogo Admin",
};

export default async function EditBlogPage({ params }: Props) {
  const { id } = await params;
  const { supabase, tenant } = await requireTenantContext();

  const { data: blog, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single();

  if (error || !blog) {
    notFound();
  }

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
            <span className="text-[var(--foreground)]">Edit Article</span>
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Edit Article: {blog.title}
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Update content, tags, author attribution, and publication visibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/blog/${blog.slug}`}
            target="_blank"
            className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 px-3.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors shadow-2xs flex items-center gap-1"
          >
            <span>View Live</span>
            <span>↗</span>
          </Link>
          <Link
            href="/admin/blogs"
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors shadow-2xs"
          >
            Back
          </Link>
        </div>
      </div>

      <AdminBlogForm mode="edit" initialBlog={blog as BlogPost} />
    </div>
  );
}
