"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { BlogPost } from "@/types/blog";
import { BLOG_CATEGORIES } from "@/types/blog";

export function BlogHubClient({
  initialBlogs,
  featuredBlog,
}: {
  initialBlogs: BlogPost[];
  featuredBlog: BlogPost | null;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Stories");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBlogs = useMemo(() => {
    return initialBlogs.filter((blog) => {
      const matchesCat =
        selectedCategory === "All Stories" || blog.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        blog.title.toLowerCase().includes(q) ||
        (blog.excerpt && blog.excerpt.toLowerCase().includes(q)) ||
        blog.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [initialBlogs, selectedCategory, searchQuery]);

  return (
    <div className="space-y-12">
      {/* Featured Editorial Spotlight (Hero) */}
      {featuredBlog && !searchQuery && selectedCategory === "All Stories" && (
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md group">
          <Link href={`/blog/${featuredBlog.slug}`} className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Image Column */}
            <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto min-h-[300px] overflow-hidden relative bg-slate-100 dark:bg-slate-800">
              {featuredBlog.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredBlog.cover_image_url}
                  alt={featuredBlog.title}
                  className="h-full w-full object-cover motion-safe:group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="rounded-full bg-cyan-600 text-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                  ★ Featured Guide
                </span>
                <span className="rounded-full bg-black/60 backdrop-blur-md text-white px-2.5 py-1 text-[10px] font-semibold">
                  {featuredBlog.reading_time_minutes} min read
                </span>
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                  {featuredBlog.category}
                </span>
                <h2 className="mt-2.5 font-serif text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-tight">
                  {featuredBlog.title}
                </h2>
                {featuredBlog.excerpt && (
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {featuredBlog.excerpt}
                  </p>
                )}
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {featuredBlog.author_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredBlog.author_avatar_url}
                      alt={featuredBlog.author_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold text-xs flex items-center justify-center">
                      ✍️
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {featuredBlog.author_name}
                    </p>
                    <p className="text-[10px] text-slate-400" suppressHydrationWarning>
                      {featuredBlog.published_at.split("T")[0]}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Read Guide</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {BLOG_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-ui whitespace-nowrap cursor-pointer shadow-2xs ${
                  isActive
                    ? "bg-slate-950 dark:bg-cyan-600 text-white shadow-sm"
                    : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides & articles..."
            className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Articles 3-Column Grid */}
      {filteredBlogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <article
              key={blog.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-xl lift"
            >
              <div>
                {/* Cover Image */}
                {blog.cover_image_url && (
                  <div className="h-48 w-full rounded-2xl overflow-hidden mb-4 relative bg-slate-100 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={blog.cover_image_url}
                      alt={blog.title}
                      className="h-full w-full object-cover motion-safe:group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      {blog.category}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-slate-100 px-2 py-0.5 text-[10px] font-semibold shadow-xs">
                      ⏱️ {blog.reading_time_minutes} min read
                    </span>
                  </div>
                )}

                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                  <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                </h3>

                {blog.excerpt && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {blog.author_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blog.author_avatar_url}
                      alt={blog.author_name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs">✍️</span>
                  )}
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {blog.author_name}
                  </span>
                </div>

                <Link
                  href={`/blog/${blog.slug}`}
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:underline flex items-center gap-1"
                >
                  <span>Read</span>
                  <span>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <span className="text-4xl">📚</span>
          <h3 className="mt-3 font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
            No stories found matching your filter
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Try choosing a different category or clearing your search keywords.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("All Stories");
              setSearchQuery("");
            }}
            className="mt-4 rounded-full bg-slate-900 dark:bg-cyan-600 text-white px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
