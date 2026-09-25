import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GlobalTechExplorer, type UnifiedJob } from "@/components/global-tech-explorer";
import { GLOBAL_TECH_HUBS, GLOBAL_COUNTRIES, matchesHub } from "@/lib/constants/tech-hubs";
import { type CompanyDetail } from "@/components/company-detail-drawer";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";

type Props = {
  params: Promise<{ country: string; city: string }>;
  searchParams: Promise<{ q?: string; type?: string; stage?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city } = await params;
  const countryCode = country.toUpperCase();
  const hub = GLOBAL_TECH_HUBS.find(
    (h) =>
      h.id === city.toLowerCase() ||
      h.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === city.toLowerCase()
  );

  const countryInfo = GLOBAL_COUNTRIES.find((c) => c.code === countryCode);

  const cityName = hub ? hub.name : city.charAt(0).toUpperCase() + city.slice(1);
  const countryName = countryInfo ? countryInfo.name : countryCode;

  const title = `${cityName} Tech Companies, Startups & Live Jobs (${countryName}) | LocaToGo`;
  const description = `Interactive tech directory & startup map of verified IT companies, SaaS unicorns, AI ventures, and active jobs in ${cityName}, ${countryName}. Direct application links.`;

  return {
    title,
    description,
    keywords: [
      `${cityName} tech companies`,
      `${cityName} startups`,
      `${cityName} technology jobs`,
      `${countryName} tech companies`,
      `${cityName} tech hub`,
    ],
    alternates: {
      canonical: `/hub/${country.toLowerCase()}/${city.toLowerCase()}`,
    },
    openGraph: {
      title,
      description,
      url: `https://locatogo.com/hub/${country.toLowerCase()}/${city.toLowerCase()}`,
      siteName: "LocaToGo",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function HubPage({ params, searchParams }: Props) {
  const { country, city } = await params;
  const countryCode = country.toUpperCase();

  const hub = GLOBAL_TECH_HUBS.find(
    (h) =>
      h.id === city.toLowerCase() ||
      h.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === city.toLowerCase()
  );

  if (!hub) {
    notFound();
  }

  let supabase: any;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  // 1. Fetch companies and jobs for this hub and country
  const [
    { count: totalCount },
    { data: listingsData },
    { data: jobsData },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .not("company_type", "is", null),
    supabase
      .from("listings")
      .select(`
        id,
        title,
        slug,
        short_description,
        address_line_1,
        locality,
        city,
        country_code,
        latitude,
        longitude,
        website,
        careers_url,
        company_type,
        funding_stage,
        employee_range,
        tech_stack,
        founded_year,
        active_jobs_count
      `)
      .eq("status", "published")
      .not("company_type", "is", null)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("active_jobs_count", { ascending: false })
      .limit(1000),
    supabase
      .from("company_jobs")
      .select("id, listing_id, title, department, location_name, workplace_type, experience_level, salary_range, apply_url, posted_at, is_active")
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .limit(1000),
  ]);

  // Group jobs by listing_id
  const jobsByListing = new Map<string, any[]>();
  (jobsData || []).forEach((j: any) => {
    if (j.listing_id) {
      if (!jobsByListing.has(j.listing_id)) jobsByListing.set(j.listing_id, []);
      jobsByListing.get(j.listing_id)!.push(j);
    }
  });

  const companies: CompanyDetail[] = (listingsData || []).map((l: any) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    short_description: l.short_description,
    address_line_1: l.address_line_1,
    locality: l.locality,
    city: l.city,
    country_code: l.country_code,
    latitude: l.latitude,
    longitude: l.longitude,
    website: l.website,
    careers_url: l.careers_url,
    company_type: l.company_type || "product_saas",
    funding_stage: l.funding_stage || "Product",
    employee_range: l.employee_range,
    tech_stack: l.tech_stack || [],
    founded_year: l.founded_year,
    active_jobs_count: l.active_jobs_count || (jobsByListing.get(l.id) || []).length,
    jobs: jobsByListing.get(l.id) || [],
  }));

  const initialJobs: UnifiedJob[] = (jobsData || []).map((j: any) => {
    const matchedComp = companies.find((c) => c.id === j.listing_id);
    return {
      id: j.id,
      title: j.title,
      department: j.department,
      location_name: j.location_name,
      workplace_type: j.workplace_type,
      experience_level: j.experience_level,
      salary_range: j.salary_range,
      apply_url: j.apply_url,
      company_careers_url: matchedComp?.careers_url || null,
      posted_at: j.posted_at,
      listing_id: j.listing_id,
      company_title: matchedComp?.title,
      company_slug: matchedComp?.slug,
      company_type: matchedComp?.company_type,
      funding_stage: matchedComp?.funding_stage,
      locality: matchedComp?.locality,
      city: matchedComp?.city,
      country_code: matchedComp?.country_code,
    };
  });

  const hubCompanies = companies.filter((c) => matchesHub(c, hub));
  const hubJobs = initialJobs.filter((j) => jobMatchesLocation(j.location_name, hub.id) || jobMatchesLocation(j.location_name, hub.name));

  // JSON-LD structured data for Google Search
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${hub.name} Tech Companies and Startups`,
    description: `Directory of top tech employers, startups, and AI labs in ${hub.name}, ${hub.country}.`,
    itemListElement: hubCompanies.slice(0, 15).map((comp, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Organization",
        name: comp.title,
        description: comp.short_description,
        url: comp.website,
        address: {
          "@type": "PostalAddress",
          addressLocality: comp.city,
          addressCountry: comp.country_code,
        },
      },
    })),
  };

  return (
    <>
      {/* Search Engine Structured Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Interactive Map & Directory pre-focused on this hub */}
      <GlobalTechExplorer
        initialCompanies={companies}
        initialJobs={initialJobs}
        totalDatabaseCompanies={totalCount || companies.length}
        currentHub={hub.id}
      />

      {/* SEO Static Content Block for Search Crawlers */}
      <section className="sr-only" aria-label={`Tech Directory index for ${hub.name}`}>
        <h1>
          {hub.name} Tech Ecosystem & Live Startups Job Board ({hub.country})
        </h1>
        <p>
          Discover {hubCompanies.length} leading tech companies and {hubJobs.length} active jobs
          in {hub.name}, {hub.country}.
        </p>
        <nav aria-label="Breadcrumb">
          <Link href="/">Home</Link> &gt; <span>{hub.country}</span> &gt; <span>{hub.name}</span>
        </nav>
        <ul>
          {hubCompanies.map((c) => (
            <li key={c.id}>
              <h2>{c.title}</h2>
              <p>{c.short_description}</p>
              <p>Location: {c.address_line_1}, {c.locality}, {c.city}, {c.country_code}</p>
              {c.website && <a href={c.website}>Website</a>}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
