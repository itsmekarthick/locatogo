import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogBySlug, getRelatedBlogs } from "@/lib/services/blogs";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return { title: "Story Not Found | Locatogo" };
  }

  return {
    title: `${blog.title} | Locatogo Journal`,
    description: blog.excerpt || `Read ${blog.title} on the Locatogo directory atlas.`,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || undefined,
      images: blog.cover_image_url ? [{ url: blog.cover_image_url }] : [],
    },
  };
}

export const revalidate = 60; // Cache for 60 seconds

// Simple, robust markdown converter for headlines, lists, and bold text
function renderMarkdownContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="my-4 space-y-2 list-disc list-inside text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed pl-2">
          {currentList.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(idx);
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList(idx);
      elements.push(
        <h3 key={idx} className="mt-8 mb-3 font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          {trimmed.replace("### ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList(idx);
      elements.push(
        <h2 key={idx} className="mt-10 mb-4 font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
          {trimmed.replace("## ", "")}
        </h2>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      // Process bold inside list
      let formatted = trimmed.substring(2);
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950 dark:text-white">$1</strong>');
      currentList.push(formatted);
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList(idx);
      let formatted = trimmed.replace(/^\d+\.\s/, "");
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950 dark:text-white">$1</strong>');
      elements.push(
        <div key={idx} className="my-2 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">→</span>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      );
    } else {
      flushList(idx);
      let formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950 dark:text-white">$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-slate-600 dark:text-slate-400">$1</em>');
      elements.push(
        <p key={idx} className="my-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
  });

  flushList(lines.length);
  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  const relatedBlogs = await getRelatedBlogs(blog.slug, blog.category, 3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <BrandLogo size={30} className="group-hover:scale-105 transition-transform" />
              <span className="font-serif text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                locatogo<span className="text-indigo-600 dark:text-indigo-400">.</span>
              </span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link
              href="/blog"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ← All Stories
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-400 transition-all shadow-2xs"
            >
              🗺️ Open Map
            </Link>
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </div>
      </header>

      {/* Main Reader Container */}
      <main className="mx-auto max-w-[840px] w-full px-4 sm:px-6 py-10 sm:py-14 flex-1">
        {/* Article Metadata Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {blog.category}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ⏱️ {blog.reading_time_minutes} min read
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>
              {blog.published_at.split("T")[0]}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100 leading-tight">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {blog.excerpt}
            </p>
          )}

          {/* Author Byline Strip */}
          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {blog.author_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blog.author_avatar_url}
                  alt={blog.author_name}
                  className="h-11 w-11 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-2xs"
                />
              ) : (
                <div className="h-11 w-11 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm shadow-2xs">
                  ✍️
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {blog.author_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Locatogo Editorial Contributor
                </p>
              </div>
            </div>

            {/* Share / Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Cover Photo */}
        {blog.cover_image_url && (
          <div className="my-8 sm:my-10 h-72 sm:h-96 lg:h-[420px] w-full rounded-3xl overflow-hidden shadow-md relative bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blog.cover_image_url}
              alt={blog.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Formatted Article Body */}
        <div className="mt-8 prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
          {renderMarkdownContent(blog.content)}
        </div>

        {/* "Explore on Map" Sticky Callout Banner */}
        <div className="my-12 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="rounded-full bg-indigo-600 text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
              Interactive Map
            </span>
            <h3 className="mt-2 font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Explore places mentioned in this guide
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md">
              View verified coordinates, real-time operating hours, contact details, and one-click rides on our live map.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full bg-slate-950 dark:bg-indigo-600 text-white px-6 py-3 text-xs font-bold shadow-md hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shrink-0 flex items-center gap-2"
          >
            <span>Open in City Atlas</span>
            <span>🗺️</span>
          </Link>
        </div>

        {/* Related Stories Strip */}
        {relatedBlogs.length > 0 && (
          <section className="mt-16 pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
            <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              More Stories & Guides to Read Next
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedBlogs.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-0.5"
                >
                  <div>
                    {rel.cover_image_url && (
                      <div className="h-32 w-full rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rel.cover_image_url}
                          alt={rel.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {rel.category}
                    </span>
                    <h4 className="mt-1 font-serif text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                  </div>
                  <p className="mt-3 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <span>Read Guide</span>
                    <span>→</span>
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070b13] py-10 text-xs text-slate-500">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Locatogo Journal. Curated with pride for Bengaluru.</p>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="hover:text-slate-900 dark:hover:text-white">All Stories</Link>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">City Atlas</Link>
            <Link href="/tech-atlas" className="hover:text-slate-900 dark:hover:text-white">Tech Atlas</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
