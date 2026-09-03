import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogs, getFeaturedBlog } from "@/lib/services/blogs";
import { BlogHubClient } from "@/components/blog-hub-client";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";

export const metadata: Metadata = {
  title: "City Guides, Stories & Tech Insights | Locatogo",
  description:
    "Curated neighborhood guides, coworking rankings, specialty coffee discoveries, and emerging tech corridors in Bengaluru and beyond.",
};

export const revalidate = 60; // ISR cache for 60 seconds

export default async function BlogPage() {
  const [blogs, featuredBlog] = await Promise.all([
    getPublishedBlogs({ limit: 30 }),
    getFeaturedBlog(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1300px] items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <BrandLogo size={32} className="group-hover:scale-105 transition-transform" />
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                locatogo<span className="text-indigo-600 dark:text-indigo-400">.</span>
              </span>
            </Link>

            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Journal & Guides
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <span className="hidden sm:inline">← City Explorer</span>
              <span className="sm:hidden">← City</span>
            </Link>
            <Link
              href="/tech-atlas"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <span className="hidden sm:inline">💼 Tech Atlas</span>
              <span className="sm:hidden">💼 Tech</span>
            </Link>
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </div>
      </header>

      {/* Hero Headline Strip */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-12 sm:py-16">
        <div className="mx-auto max-w-[1300px] px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            The Locatogo Journal
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
          <p>© {new Date().getFullYear()} Locatogo SaaS. Curated for place-first discovery.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Explore Atlas</Link>
            <Link href="/tech-atlas" className="hover:text-slate-900 dark:hover:text-white">Tech Atlas</Link>
            <Link href="/about" className="hover:text-slate-900 dark:hover:text-white">About</Link>
            <Link href="/submit" className="hover:text-slate-900 dark:hover:text-white">Add Place</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
