import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogs, getFeaturedBlog } from "@/lib/services/blogs";
import { BlogHubClient } from "@/components/blog-hub-client";
import { PublicHeader } from "@/components/public-header";

export const metadata: Metadata = {
  title: "City Guides, Stories & Tech Insights | LocaToGo",
  description:
    "Curated neighborhood guides, coworking rankings, specialty coffee discoveries, and emerging tech corridors in Bengaluru and beyond.",
  alternates: {
    canonical: "/blog",
    types: {
      "application/rss+xml": "/blog/rss.xml",
    },
  },
};

export const revalidate = 60; // ISR cache for 60 seconds

export default async function BlogPage() {
  const [blogs, featuredBlog] = await Promise.all([
    getPublishedBlogs({ limit: 30 }),
    getFeaturedBlog(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col">
      {/* Unified Public Navigation Header */}
      <PublicHeader />

      {/* Hero Headline Strip */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-12 sm:py-16">
        <div className="mx-auto max-w-[1300px] px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            The LocaToGo Journal
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">
            Stories, City Guides & Tech Insights
          </h1>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Discover curated neighborhood itineraries, specialty coffee roasters, deep-dive tech corridor analyses, and local health guides crafted by our editorial team.
          </p>
        </div>
      </div>

      {/* Main Blog Hub Content */}
      <main className="mx-auto max-w-[1300px] w-full px-4 sm:px-6 py-10 flex-1">
        <BlogHubClient initialBlogs={blogs} featuredBlog={featuredBlog} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070b13] py-10 text-xs text-slate-500">
        <div className="mx-auto max-w-[1300px] px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} LocaToGo SaaS. Curated for place-first discovery.</p>
          <div className="flex items-center gap-4">
            <Link href="/blog/rss.xml" target="_blank" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <span>📡 RSS</span>
            </Link>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Tech Atlas</Link>
            <Link href="/about" className="hover:text-slate-900 dark:hover:text-white">About</Link>
            <Link href="/submit" className="hover:text-slate-900 dark:hover:text-white">Add Place</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
