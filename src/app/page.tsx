import type { Metadata } from "next";
import "./landing-effects.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

export const revalidate = 3600; // Cache and revalidate homepage every hour

type PreviewRow = {
  id: string;
  title: string;
  locality: string | null;
  city: string | null;
  active_jobs_count: number | null;
  verification_status: string | null;
};

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: totalPlaces },
    { count: totalJobs },
    { data: featuredPlaces },
    { data: blogs },
    { data: previewRows },
  ] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "published").not("company_type", "is", null),
    supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
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
    supabase
      .from("listings")
      .select("id, title, locality, city, active_jobs_count, verification_status")
      .eq("status", "published")
      .not("company_type", "is", null)
      .order("active_jobs_count", { ascending: false })
      .limit(5),
  ]);

  const countryCount = GLOBAL_COUNTRIES.filter((country) => country.code !== "ALL").length;
  const hubCount = GLOBAL_TECH_HUBS.length;

  const searchHubs = GLOBAL_TECH_HUBS.map(({ id, name, country, countryCode }) => ({ id, name, country, countryCode }));
  const popularHubs = GLOBAL_COUNTRIES.filter((country) => country.code !== "ALL")
    .flatMap((country) => {
      const hub = searchHubs.find((candidate) => candidate.id === country.defaultHubId);
      return hub ? [hub] : [];
    })
    .slice(0, 6);
  const previewHubs = GLOBAL_TECH_HUBS.map(({ id, name, lat, lng }) => ({ id, name, lat, lng }));
  const previewCompanies = ((previewRows ?? []) as PreviewRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    locality: row.locality,
    city: row.city,
    jobs: row.active_jobs_count ?? 0,
    verified: row.verification_status === "verified",
  }));

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
        openRoles={totalJobs ?? null}
        hubs={searchHubs}
        popularHubs={popularHubs}
        examples={examples}
        previewCompanies={previewCompanies}
        previewHubs={previewHubs}
        hubCount={hubCount}
        countryCount={countryCount}
      />

      <section aria-label="Tech hubs worldwide" className="pb-4">
        <p className="mb-6 px-4 text-center text-sm text-fg-subtle">
          Mapped across {hubCount} hubs in {countryCount} countries
        </p>
        <HubMarquee hubs={searchHubs} />
      </section>

      <LandingStats companies={totalPlaces ?? null} roles={totalJobs ?? null} hubs={hubCount} countries={countryCount} />

      <LandingFeatures />

      <HowItWorks hubNames={searchHubs.map((hub) => hub.name)} hubCount={hubCount} countryCount={countryCount} />

      <HubsByCountry />

      <FeaturedCompanies places={(featuredPlaces ?? []) as FeaturedPlace[]} />

      <Stories stories={(blogs ?? []) as StoryItem[]} />

      <CtaBand />

      <SiteFooter />
    </div>
  );
}
