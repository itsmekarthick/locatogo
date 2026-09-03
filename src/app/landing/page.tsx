import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LandingHero } from "@/components/landing-hero";
import { LandingStats, LandingFeatures } from "@/components/landing-stats";
import { PublicHeader } from "@/components/public-header";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  title: "Locatogo | Global Interactive Map & Directory Platform",
  description: "Discover curated places on interactive maps or launch your own branded vertical directory in minutes.",
};

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: totalPlaces },
    { data: categories },
    { count: totalDomains },
    { data: featuredPlaces },
    { data: blogs },
  ] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("sort_order"),
    supabase.from("domains").select("id", { count: "exact", head: true }),
    supabase
      .from("listings")
      .select("id, title, slug, short_description, locality, city, latitude, longitude, is_featured, verification_status")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .limit(6),
    supabase
      .from("blogs")
      .select("id, title, slug, excerpt, cover_image_url, category, author_name, reading_time_minutes, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Unified Public Navigation Header */}
      <PublicHeader />

      {/* Hero Section with Interactive Preview Mockup */}
      <LandingHero totalListings={totalPlaces ?? 50} totalCategories={categories?.length ?? 8} />

      {/* Live Statistics Counters Strip */}
      <LandingStats
        totalPlaces={totalPlaces ?? 50}
        totalCategories={categories?.length ?? 12}
        totalLocalities={18}
        totalDomains={totalDomains ?? 1}
      />

      {/* Category Grid Section */}
      <section className="py-20 sm:py-24 bg-white dark:bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Taxonomy & Sectors
              </p>
              <h2 className="mt-1 font-serif text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Browse by Category
              </h2>
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View all on live map</span>
              <span>→</span>
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.id}
                href={`/?category=${cat.id}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 p-4 shadow-2xs transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-xl shadow-xs transition-transform group-hover:scale-110">
                    🏷️
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Curated listings</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Places Showcase */}
      {featuredPlaces && featuredPlaces.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Curated Highlights
              </p>
              <h2 className="mt-1 font-serif text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Featured Places in the Atlas
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400">
                Top-rated destinations, campuses, and community facilities verified by our team.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPlaces.map((place) => (
                <Link
                  key={place.id}
                  href={`/listing/${place.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-800 hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                          ★ Featured
                        </span>
                        {place.verification_status === "verified" && (
                          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      {place.locality && (
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          📍 {place.locality}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {place.title}
                    </h3>

                    {place.short_description && (
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                        {place.short_description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span>View Place Details</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works 3-Step Flow */}
      <section className="py-20 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Effortless Navigation
            </p>
            <h2 className="mt-1 font-serif text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              How Locatogo Works
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Search & Filter",
                desc: "Discover places by proximity radius (1km–25km), specialty, category, or real-time opening hours.",
                icon: "🔍",
              },
              {
                step: "02",
                title: "Explore on Map",
                desc: "Switch seamlessly between Leaflet interactive cluster view, Google 3D Satellite, and split screen.",
                icon: "🗺️",
              },
              {
                step: "03",
                title: "Connect & Arrive",
                desc: "Book 1-click rides via Uber or Ola preloaded with GPS coordinates, or reach out directly on WhatsApp.",
                icon: "🚖",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-8 shadow-2xs"
              >
                <span className="font-mono text-3xl font-black text-indigo-300 dark:text-indigo-800/80">
                  {item.step}
                </span>
                <span className="mt-4 block text-2xl">{item.icon}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <LandingFeatures />

      {/* Editorial Stories & Local Guides Section */}
      {blogs && blogs.length > 0 && (
        <section className="py-20 sm:py-28 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  The Locatogo Journal
                </p>
                <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Curated City Guides & Local Stories
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                  Insider perspectives on coworking culture, specialty coffee roasters, emerging tech corridors, and healthcare across Bengaluru.
                </p>
              </div>

              <Link
                href="/blog"
                className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-slate-50 dark:bg-slate-900 px-5 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
              >
                <span>Read All Stories</span>
                <span>→</span>
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 p-5 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-800"
                >
                  <div>
                    {article.cover_image_url && (
                      <div className="h-48 w-full rounded-2xl overflow-hidden mb-4 relative bg-slate-100 dark:bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.cover_image_url}
                          alt={article.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          {article.category}
                        </span>
                        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-slate-100 px-2 py-0.5 text-[10px] font-semibold shadow-xs">
                          ⏱️ {article.reading_time_minutes} min read
                        </span>
                      </div>
                    )}

                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      By {article.author_name}
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Read Guide</span>
                      <span>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA Banner — Deep Midnight Indigo Gradient (No orange) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 py-24 text-white">
        {/* Glow orb */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-4 py-1.5 text-xs font-semibold text-indigo-300">
            Launch in Minutes
          </span>
          <h2 className="mt-6 font-serif text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Ready to explore your community or build a directory atlas?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Locatogo gives you all the tools — interactive Leaflet maps, geocoding, verified reviews, and full admin governance.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="rounded-full bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-xl hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              <span>Launch Live Atlas</span>
              <span>🗺️</span>
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full border border-indigo-400/50 bg-indigo-900/40 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-indigo-900/70 transition-all backdrop-blur-md"
            >
              Create Free Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 pb-10 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BrandLogo size={28} />
                <span className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
                  locatogo<span className="text-indigo-600 dark:text-indigo-400">.</span>
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Next-generation multi-domain interactive directory and map exploration platform.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Directory</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">Live Atlas</Link></li>
                <li><Link href="/blog" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-indigo-600 dark:text-indigo-400">City Guides & Stories</Link></li>
                <li><Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400">About Locatogo</Link></li>
                <li><Link href="/submit" className="hover:text-indigo-600 dark:hover:text-indigo-400">Add Business</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Administration</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link href="/admin" className="hover:text-indigo-600 dark:hover:text-indigo-400">Workspace Hub</Link></li>
                <li><Link href="/admin/analytics" className="hover:text-indigo-600 dark:hover:text-indigo-400">Visitor Analytics</Link></li>
                <li><Link href="/admin/team" className="hover:text-indigo-600 dark:hover:text-indigo-400">Team & Permissions</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Legal & Trust</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-slate-400 dark:text-slate-500">
            <p>© {new Date().getFullYear()} Locatogo SaaS. All rights reserved.</p>
            <p>Crafted for modern map-first discovery.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
