import type { Metadata } from "next";
import "./landing-effects.css";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { LandingHero } from "@/components/landing-hero";
import { LandingStats, LandingFeatures } from "@/components/landing-stats";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { HowItWorks } from "@/components/landing/how-it-works";
import { HubMarquee } from "@/components/landing/hub-marquee";
import {
  CtaBand,
  FeaturedCompanies,
  HubsByCountry,
  Stories,
  type FeaturedPlace,
  type StoryItem,
} from "@/components/landing/sections";
import { GLOBAL_COUNTRIES, GLOBAL_TECH_HUBS } from "@/lib/constants/tech-hubs";
import { loadLandingLive } from "@/lib/landing/data";

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
  alternates: { canonical: "/" },
  openGraph: {
    title: "Global Tech Atlas: Companies, Startups & Live Jobs | LocaToGo",
    description:
      "Find tech companies and active roles by city, sector, funding stage, workplace, and technology stack.",
    url: "/",
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

export const revalidate = 300;

export default async function LandingPage() {
  const supabase = createSupabasePublicClient();

  const [
    { count: totalPlaces },
    { data: featuredPlaces },
    { data: blogs },
  ] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "published").not("company_type", "is", null),
    supabase
      .from("listings")
      .select("id, title, slug, short_description, locality, city, is_featured, verification_status, active_jobs_count")
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

  const live = await loadLandingLive(supabase, { companies: totalPlaces ?? 0 });

  const countryCount = GLOBAL_COUNTRIES.filter((country) => country.code !== "ALL").length;
  const hubCount = GLOBAL_TECH_HUBS.length;

  const searchHubs = GLOBAL_TECH_HUBS.map(({ id, name, country, countryCode }) => ({ id, name, country, countryCode }));
  const popularHubs = GLOBAL_COUNTRIES.filter((country) => country.code !== "ALL")
    .flatMap((country) => {
      const hub = searchHubs.find((candidate) => candidate.id === country.defaultHubId);
      return hub ? [hub] : [];
    })
    .slice(0, 6);

  const examples = [
    "Search companies, hubs and roles",
    "Try “Bengaluru”",
    ...((featuredPlaces ?? []).slice(0, 2).map((place) => `Try “${place.title}”`)),
    "Try “London”",
    "Try “Singapore”",
  ];

  return (
    <div className="min-h-screen bg-surface-0 text-fg">
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
                "@id": "https://locatogo.com/#website",
                url: "https://locatogo.com",
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

      <PublicHeader />

      <LandingHero
        openRoles={live.roles}
        hubs={searchHubs}
        popularHubs={popularHubs}
        examples={examples}
        live={live}
        hubCount={hubCount}
        countryCount={countryCount}
      />

      <section aria-label="Tech hubs worldwide" className="pb-4">
        <p className="mb-6 px-4 text-center text-sm text-fg-subtle">
          Mapped across {hubCount} hubs in {countryCount} countries
        </p>
        <HubMarquee hubs={searchHubs} />
      </section>

      <LandingStats companies={totalPlaces ?? null} roles={live.roles} freshers={live.facets.freshers} weekRoles={live.weekRoles} />

      <LandingFeatures live={live} />

      <HowItWorks hubNames={searchHubs.map((hub) => hub.name)} hubCount={hubCount} countryCount={countryCount} live={live} />

      <HubsByCountry />

      <FeaturedCompanies places={(featuredPlaces ?? []) as FeaturedPlace[]} />

      <Stories stories={(blogs ?? []) as StoryItem[]} />

      <CtaBand />

      <SiteFooter />
    </div>
  );
}
