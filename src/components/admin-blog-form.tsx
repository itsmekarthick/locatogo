"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BlogPost } from "@/types/blog";
import { BLOG_CATEGORIES } from "@/types/blog";
import { createBlogAction, updateBlogAction, deleteBlogAction } from "@/app/admin/actions";

export function AdminBlogForm({
  mode,
  initialBlog,
}: {
  mode: "create" | "edit";
  initialBlog?: BlogPost | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState(initialBlog?.title || "");
  const [slug, setSlug] = useState(initialBlog?.slug || "");
  const [category, setCategory] = useState(initialBlog?.category || "City Guide");
  const [excerpt, setExcerpt] = useState(initialBlog?.excerpt || "");
  const [content, setContent] = useState(initialBlog?.content || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialBlog?.cover_image_url || "");
  const [authorName, setAuthorName] = useState(initialBlog?.author_name || "Locatogo Editorial");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState(initialBlog?.author_avatar_url || "");
  const [tags, setTags] = useState(initialBlog?.tags?.join(", ") || "");
  const [readingTime, setReadingTime] = useState(String(initialBlog?.reading_time_minutes || 4));
  const [status, setStatus] = useState<"published" | "draft">(
    initialBlog?.status === "draft" ? "draft" : "published"
  );
  const [isFeatured, setIsFeatured] = useState(initialBlog?.is_featured || false);

  // Auto-slug generator when title changes (if slug hasn't been manually set)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (mode === "create" && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""))) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("is_featured", isFeatured ? "true" : "false");

      if (mode === "create") {
        const res = await createBlogAction(formData);
        router.push("/admin/blogs");
        router.refresh();
      } else if (mode === "edit" && initialBlog) {
        await updateBlogAction(initialBlog.id, formData);
        router.push("/admin/blogs");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save article");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialBlog) return;
    if (!window.confirm(`Are you sure you want to delete "${initialBlog.title}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBlogAction(initialBlog.id);
      router.push("/admin/blogs");
      router.refresh();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMessage && (
        <div className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 p-4 text-xs font-bold text-rose-800 dark:text-rose-200">
          ✕ {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Main Article Body & Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Article Title */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Top 10 High-Growth Coworking Spaces in Bengaluru"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* URL Slug */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                URL Slug <span className="text-[var(--ink-muted)] font-normal">(e.g. /blog/top-coworking-spaces)</span>
              </label>
              <input
                type="text"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="top-coworking-spaces-bengaluru"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2 text-xs font-mono text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Short Excerpt */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Short Excerpt / Teaser <span className="text-[var(--ink-muted)] font-normal">(Shown on cards & previews)</span>
              </label>
              <textarea
                name="excerpt"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary to entice readers..."
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2 text-xs leading-relaxed text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Full Markdown Prose Content */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[var(--foreground)]">
                Article Body (Markdown Prose) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-[var(--ink-muted)] font-medium">
                Supports ## Headings, ### Subheadings, - bullet lists, **bold**
              </span>
            </div>

            <textarea
              name="content"
              required
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article in markdown format...&#10;&#10;## Section Heading&#10;Paragraph text here...&#10;&#10;### Subheading&#10;- Bullet point 1&#10;- Bullet point 2"
              className="w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] p-4 text-xs font-mono leading-relaxed text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right Column: Settings, Metadata & Publishing (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publishing Card */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Publishing Settings
            </h3>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Publication Status
              </label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="published">🟢 Published (Live in Public Journal)</option>
                <option value="draft">📝 Draft (Hidden from Public)</option>
              </select>
            </div>

            {/* Featured Spotlight Toggle */}
            <label className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--line)] bg-[var(--background)] cursor-pointer hover:bg-[var(--line)]/30 transition-colors">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-[var(--foreground)]">★ Featured Hero Spotlight</p>
                <p className="text-[10px] text-[var(--ink-muted)]">Showcase at top of blog hub</p>
              </div>
            </label>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-slate-900 dark:bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving Article..."
                  : mode === "create"
                  ? "Publish Story / Guide"
                  : "Save Changes"}
              </button>

              <Link
                href="/admin/blogs"
                className="block text-center w-full rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Taxonomy & Author Details */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Taxonomy & Details
            </h3>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Category
              </label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                {BLOG_CATEGORIES.filter((c) => c !== "All Stories").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Read Time */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Read Time (minutes)
              </label>
              <input
                type="number"
                name="reading_time_minutes"
                min="1"
                max="60"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none"
              />
            </div>

            {/* Author Name */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Author Name
              </label>
              <input
                type="text"
                name="author_name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none"
              />
            </div>

            {/* Author Avatar URL */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Author Photo / Avatar URL
              </label>
              <input
                type="url"
                name="author_avatar_url"
                value={authorAvatarUrl}
                onChange={(e) => setAuthorAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs font-mono text-[var(--foreground)] focus:outline-none text-[11px]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Tags <span className="text-[var(--ink-muted)] font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Coworking, Cafes, Bengaluru"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          {/* Cover Image URL & Preview */}
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Cover Imagery
            </h3>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Cover Photo URL (Unsplash or CDN)
              </label>
              <input
                type="url"
                name="cover_image_url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs font-mono text-[var(--foreground)] focus:outline-none text-[11px]"
              />
            </div>

            {coverImageUrl && (
              <div className="rounded-2xl overflow-hidden h-36 w-full border border-[var(--line)] bg-slate-100 dark:bg-slate-800 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt="Cover Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Danger Zone: Delete Option (Edit Mode Only) */}
          {mode === "edit" && initialBlog && (
            <div className="rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Danger Zone
              </h4>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                Permanently delete this story from the directory database.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Story"}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
