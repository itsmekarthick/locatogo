import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LandingHero } from "@/components/landing-hero";
import { LandingStats, LandingFeatures } from "@/components/landing-stats";
import { PublicHeader } from "@/components/public-header";
import { BrandLogo } from "@/components/brand-logo";
import { GLOBAL_COUNTRIES, GLOBAL_TECH_HUBS, TECH_SECTORS } from "@/lib/constants/tech-hubs";

export const metadata: Metadata = {
  title: "Global Tech Atlas: Companies, Startups & Live Jobs | LocaToGo",
  description:
    "Explore technology companies, startups, AI labs, MNC GCCs, tech hubs, and live job openings on LocaToGo's global Tech Atlas.",
  keywords: [
    "global tech atlas",
    "technology company directory",
    "startup ecosystem map",
    "tech companies by country",
    "tech companies by city",
    "live technology jobs",
    "AI labs and startups",
  ],
  authors: [{ name: "LocaToGo" }],
  creator: "LocaToGo",
  publisher: "LocaToGo",
  robots: { index: true, follow: true },
  alternates: { canonical: "/landing" },
  openGraph: {
    title: "Global Tech Atlas: Companies, Startups & Live Jobs | LocaToGo",
    description:
      "Find tech companies and active roles by city, sector, funding stage, workplace, and technology stack.",
    url: "/landing",
    siteName: "LocaToGo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Tech Atlas: Companies, Startups & Live Jobs | LocaToGo",
    description:
      "Explore global tech hubs, company profiles, and current openings with direct application links.",
  },
};

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: totalPlaces },
    { count: totalJobs },
    { data: featuredPlaces },
    { data: blogs },
  ] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "published").not("company_type", "is", null),
    supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("listings")
      .select("id, title, slug, short_description, locality, city, latitude, longitude, is_featured, verification_status")
      .eq("status", "published")
      .not("company_type", "is", null)
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-cyan-500 selection:text-white font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://locatogo.com/#organization",
                name: "LocaToGo",
                url: "https://locatogo.com",
                description: "A global Tech Atlas for discovering companies, technology hubs, and live jobs.",
              },
              {
                "@type": "WebSite",
                "@id": "https://locatogo.com/landing#website",
                url: "https://locatogo.com/landing",
                name: "LocaToGo Global Tech Atlas",
                publisher: { "@id": "https://locatogo.com/#organization" },
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://locatogo.com/?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "ItemList",
                name: "Global technology hubs on LocaToGo",
                itemListElement: [
                  "Bengaluru",
                  "Hyderabad",
                  "Delhi NCR",
                  "Mumbai",
                  "Pune",
                  "London",
                  "Silicon Valley",
                  "New York",
                  "Seattle",
                ].map((name, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: `${name} tech companies and startups`,
                })),
              },
            ],
          }),
        }}
      />
      {/* Unified Public Navigation Header */}
      <PublicHeader />

      {/* Hero Section with Interactive Preview Mockup */}
      <LandingHero totalListings={totalPlaces ?? 50} totalCategories={TECH_SECTORS.length - 1} />

      {/* Live Statistics Counters Strip */}
      <LandingStats
        totalPlaces={totalPlaces ?? 50}
        totalCategories={TECH_SECTORS.length - 1}
        totalLocalities={18}
        totalDomains={totalJobs ?? 0}
      />

      {/* One representative tech hub for every supported country */}
      <section className="border-t border-slate-200/80 bg-slate-50/70 py-20 dark:border-slate-800 dark:bg-slate-950/40 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Global Company Directory
              </p>
              <h2 className="mt-1 font-serif text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Explore Tech Companies by Country
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Start with a leading technology hub in each country, then browse companies, startups, and live roles on the map.
              </p>
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-cyan-600 hover:underline dark:text-cyan-400"
            >
              Open global atlas →
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GLOBAL_COUNTRIES.filter((country) => country.code !== "ALL").map((country) => {
              const hub = GLOBAL_TECH_HUBS.find((candidate) => candidate.id === country.defaultHubId);
              if (!hub) return null;

              return (
                <Link
                  key={country.code}
                  href={`/hub/${country.code.toLowerCase()}/${hub.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">{country.flag}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">
                        {hub.name} Tech Companies
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {country.name} · Startups &amp; live jobs
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Places Showcase */}
      {featuredPlaces && featuredPlaces.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Company Profiles
              </p>
              <h2 className="mt-1 font-serif text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Companies Worth Knowing
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400">
                Explore technology companies, startups, and global teams with useful context before you apply, partner, or visit.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPlaces.map((place) => (
                <Link
                  key={place.id}
                  href={`/company/${place.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-800 hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800 px-2.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
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

                    <h3 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {place.title}
                    </h3>

                    {place.short_description && (
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                        {place.short_description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    <span>View Company Profile</span>
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
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              The Tech Atlas Workflow
            </p>
            <h2 className="mt-1 font-serif text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              From Hub to Opportunity
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose a Tech Hub",
                desc: "Start with a global country or city hub and see the companies shaping that local ecosystem.",
                icon: "⌖",
              },
              {
                step: "02",
                title: "Filter Companies",
                desc: "Compare sectors, stages, tech stacks, workplace models, and companies that are actively hiring.",
                icon: "⌕",
              },
              {
                step: "03",
                title: "Open Roles & Apply",
                desc: "Inspect the company profile, review current roles, and follow the direct career link to apply.",
                icon: "↗",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-8 shadow-2xs"
              >
                <span className="font-mono text-3xl font-black text-cyan-300 dark:text-cyan-800/80">
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
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                  Tech Ecosystem Guides
                </p>
                <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Stories from the Tech Ecosystem
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                  Guides and perspectives on technology hubs, company ecosystems, and the people building what comes next.
                </p>
              </div>

              <Link
                href="/blog"
                className="rounded-full border border-cyan-200 dark:border-cyan-800 bg-slate-50 dark:bg-slate-900 px-5 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
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
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 p-5 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 dark:hover:border-cyan-800"
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

                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400">
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
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 py-24 text-white">
        {/* Glow orb */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-4 py-1.5 text-xs font-semibold text-cyan-300">
            Launch in Minutes
          </span>
          <h2 className="mt-6 font-serif text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            Ready to explore the global tech ecosystem?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Start with a city, sector, or company and follow the signal from discovery to a live opportunity.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="rounded-full bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-xl hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              <span>Explore Tech Atlas</span>
              <span>→</span>
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full border border-cyan-400/50 bg-cyan-900/40 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-900/70 transition-all backdrop-blur-md"
            >
              Add a Company
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
                <span className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100"><span className="animate-brand-reveal">LocaToGo<span className="text-cyan-600 dark:text-cyan-400">.</span></span>
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                A global Tech Atlas for companies, hubs, and live opportunities.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Directory</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link href="/" className="hover:text-cyan-600 dark:hover:text-cyan-400">Live Atlas</Link></li>
                <li><Link href="/blog" className="hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold text-cyan-600 dark:text-cyan-400">City Guides & Stories</Link></li>
                <li><Link href="/about" className="hover:text-cyan-600 dark:hover:text-cyan-400">About LocaToGo</Link></li>
                <li><Link href="/submit" className="hover:text-cyan-600 dark:hover:text-cyan-400">Add Company</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Administration</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link href="/admin" className="hover:text-cyan-600 dark:hover:text-cyan-400">Admin Dashboard</Link></li>
                <li><Link href="/admin/analytics" className="hover:text-cyan-600 dark:hover:text-cyan-400">Visitor Analytics</Link></li>
                <li><Link href="/admin/team" className="hover:text-cyan-600 dark:hover:text-cyan-400">Team & Permissions</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Legal & Trust</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link href="/privacy" className="hover:text-cyan-600 dark:hover:text-cyan-400">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-cyan-600 dark:hover:text-cyan-400">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-cyan-600 dark:hover:text-cyan-400">Contact Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-slate-400 dark:text-slate-500">
            <p>© {new Date().getFullYear()} LocaToGo SaaS. All rights reserved.</p>
            <p>Crafted for modern map-first discovery.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
