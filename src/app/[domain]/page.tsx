import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GlobalTechExplorer } from "@/components/global-tech-explorer";
import {
  GLOBAL_TECH_HUBS,
  KNOWN_HUB_LOCALITIES,
  KNOWN_HUB_COUNTS,
  matchesHub,
  type TechHub,
  type UnifiedJob,
} from "@/lib/constants/tech-hubs";
import { type CompanyDetail, type CompanyJob } from "@/components/company-detail-drawer";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";

export const revalidate = 3600; // Cache and revalidate every hour for high performance


type Props = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim().toLowerCase();

  const hub = GLOBAL_TECH_HUBS.find(
    (h) => h.id === slug || h.name.toLowerCase() === slug
  );

  if (hub) {
    const title = `${hub.name} Tech Companies, GCCs & Startups Directory | LocaToGo`;
    const description = `Explore verified tech companies, Global Capability Centers (GCCs), artificial intelligence labs, SaaS ventures, and live open jobs in ${hub.name}, ${hub.country}. Complete directory with office addresses, tech stacks, and direct career links.`;
    const url = `https://locatogo.com/${hub.id}`;

    return {
      title,
      description,
      alternates: {
        canonical: `/${hub.id}`,
      },
      openGraph: {
        title,
        description,
        url,
        siteName: "LocaToGo",
        images: [
          {
            url: `/api/og?title=${encodeURIComponent(hub.name)}%20Tech%20Atlas&category=Tech%20Hub&locality=${encodeURIComponent(hub.country)}`,
            width: 1200,
            height: 630,
            alt: `${hub.name} Tech Directory`,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [`/api/og?title=${encodeURIComponent(hub.name)}%20Tech%20Atlas&category=Tech%20Hub&locality=${encodeURIComponent(hub.country)}`],
      },
    };
  }

  return {
    title: "LocaToGo | Tech Atlas & Startup Directory",
    description: "Explore verified tech ecosystems, companies, and jobs worldwide.",
  };
}

export default async function HubDirectoryPage({ params }: Props) {
  const { domain: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim().toLowerCase();

  const hub = GLOBAL_TECH_HUBS.find(
    (h) => h.id === slug || h.name.toLowerCase() === slug
  );

  let supabase: any;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  // 1. If not a tech hub, check if this is a direct place or company slug
  if (!hub) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let listingQuery = supabase.from("listings").select("slug, company_type");
    if (isUuid) {
      listingQuery = listingQuery.or(`slug.eq.${slug},slug.ilike.${slug},id.eq.${slug}`);
    } else {
      listingQuery = listingQuery.or(`slug.eq.${slug},slug.ilike.${slug}`);
    }

    const { data: maybeListing } = await listingQuery.limit(1).maybeSingle();
    if (maybeListing?.slug) {
      if (maybeListing.company_type) {
        redirect(`/company/${maybeListing.slug}`);
      } else {
        redirect(`/listing/${maybeListing.slug}`);
      }
    }

    redirect("/");
  }

  // 2. Fetch all listings and active jobs in parallel (bypassing PostgREST 1000 limit with deterministic tie-breakers)
  const [
    { count: totalTechCount },
    jobsPage1,
    jobsPage2,
    jobsPage3,
    jobsPage4,
    listingsPage1,
    listingsPage2,
    listingsPage3,
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .not("company_type", "is", null),
    supabase
      .from("company_jobs")
      .select("id, listing_id, title, department, location_name, workplace_type, experience_level, salary_range, apply_url, posted_at, is_active")
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .order("id", { ascending: true })
      .range(0, 999),
    supabase
      .from("company_jobs")
      .select("id, listing_id, title, department, location_name, workplace_type, experience_level, salary_range, apply_url, posted_at, is_active")
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .order("id", { ascending: true })
      .range(1000, 1999),
    supabase
      .from("company_jobs")
      .select("id, listing_id, title, department, location_name, workplace_type, experience_level, salary_range, apply_url, posted_at, is_active")
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .order("id", { ascending: true })
      .range(2000, 2999),
    supabase
      .from("company_jobs")
      .select("id, listing_id, title, department, location_name, workplace_type, experience_level, salary_range, apply_url, posted_at, is_active")
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .order("id", { ascending: true })
      .range(3000, 3999),
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
      .order("id", { ascending: true })
      .range(0, 999),
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
      .order("id", { ascending: true })
      .range(1000, 1999),
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
      .order("id", { ascending: true })
      .range(2000, 2999),
  ]);

  const rawJobs = [
    ...(jobsPage1.data || []),
    ...(jobsPage2.data || []),
    ...(jobsPage3.data || []),
    ...(jobsPage4.data || []),
  ];

  const rawListings = [
    ...(listingsPage1.data || []),
    ...(listingsPage2.data || []),
    ...(listingsPage3.data || []),
  ];

  // Group jobs by listing_id
  const jobsByListing = new Map<string, CompanyJob[]>();
  (rawJobs || []).forEach((job: any) => {
    if (job.listing_id) {
      const existing = jobsByListing.get(job.listing_id) || [];
      existing.push(job);
      jobsByListing.set(job.listing_id, existing);
    }
  });

  const initialCompanies: CompanyDetail[] = (rawListings || []).map((l: any) => {
    const compJobs = jobsByListing.get(l.id) || [];
    const localJobs = l.city
      ? compJobs.filter((j) => jobMatchesLocation(j.location_name, l.city))
      : compJobs;
    const accurateJobCount =
      compJobs.length > 0
        ? localJobs.length
        : (l.active_jobs_count || 0);

    return {
      id: l.id,
      title: l.title,
      slug: l.slug,
      short_description: l.short_description,
      address_line_1: l.address_line_1,
      locality: l.locality,
      city: l.city,
      latitude: l.latitude,
      longitude: l.longitude,
      website: l.website,
      careers_url: l.careers_url,
      company_type: l.company_type || "product_saas",
      funding_stage: l.funding_stage || "Product",
      employee_range: l.employee_range,
      tech_stack: l.tech_stack || [],
      founded_year: l.founded_year,
      active_jobs_count: accurateJobCount,
      jobs: compJobs,
    };
  });

  const companyInfoMap = new Map<string, any>();
  (rawListings || []).forEach((l: any) => {
    companyInfoMap.set(l.id, l);
  });

  const initialJobs: UnifiedJob[] = (rawJobs || []).map((j: any) => {
    const comp = companyInfoMap.get(j.listing_id);
    return {
      id: j.id,
      title: j.title,
      department: j.department || "Engineering",
      location_name: j.location_name || "Remote",
      workplace_type: (j.workplace_type || "hybrid") as "on_site" | "hybrid" | "remote",
      experience_level: j.experience_level || "mid",
      salary_range: j.salary_range,
      apply_url: j.apply_url,
      company_careers_url: comp?.careers_url || comp?.website || null,
      posted_at: j.posted_at,
      listing_id: j.listing_id,
      company_title: comp?.title || "Technology Company",
      company_slug: comp?.slug || "",
      company_type: comp?.company_type || "product_saas",
      funding_stage: comp?.funding_stage || "Product",
      locality: comp?.locality || hub.name,
      city: comp?.city || hub.name,
    };
  });

  // Filter top companies belonging to this hub for SSR
  const hubCompanies = initialCompanies.filter((c) => matchesHub(c, hub));
  const hubLocalities = KNOWN_HUB_LOCALITIES[hub.id] || [];

  return (
    <>
      {/* 1. Fast Interactive Client Atlas Application Pre-Focused on this Hub */}
      <GlobalTechExplorer
        initialCompanies={initialCompanies}
        initialJobs={initialJobs}
        totalDatabaseCompanies={totalTechCount || 19095}
        currentHub={hub.id}
        knownHubCounts={KNOWN_HUB_COUNTS}
      />

      {/* 2. Semantic Crawlable SSR Architecture for Search Engines & Robots */}
      <section className="sr-only" aria-label={`${hub.name} Tech Directory Index`}>
        {/* Breadcrumb Hierarchy */}
        <nav aria-label="Breadcrumb">
          <ol itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a itemProp="item" href="/">
                <span itemProp="name">LocaToGo</span>
              </a>
              <meta itemProp="position" content="1" />
            </li>
            <li> › </li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a itemProp="item" href={`/${hub.id}`}>
                <span itemProp="name">{hub.name}</span>
              </a>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>

        <h1>{hub.flag} {hub.name} Tech Companies, Startups &amp; GCCs Directory</h1>
        <p>
          Directory of verified technology companies, global research and engineering centers,
          artificial intelligence labs, and funded startups based in {hub.name}, {hub.country}.
          Discover office locations, engineering tech stacks, and active verified job openings.
        </p>

        {/* Localities / Neighborhoods in this Hub */}
        {hubLocalities.length > 0 && (
          <div>
            <h2>Popular Tech Clusters &amp; Neighborhoods in {hub.name}</h2>
            <ul>
              {hubLocalities.map((loc) => (
                <li key={loc.slug}>
                  <a href={`/${hub.id}/${loc.slug}`}>
                    Tech Companies in {loc.name}, {hub.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Index of Tech Companies in this Hub */}
        <h2>Verified Companies Hiring in {hub.name}</h2>
        <ul>
          {hubCompanies.slice(0, 50).map((c) => (
            <li key={c.id}>
              <article itemScope itemType="https://schema.org/Organization">
                <h3 itemProp="name">
                  <a href={`/company/${c.slug}`}>{c.title}</a>
                </h3>
                <p itemProp="description">{c.short_description}</p>
                <p>
                  Location: {c.locality ? `${c.locality}, ` : ""}{c.city || hub.name}
                </p>
                <p>
                  Category: {(c.company_type || "Tech").replace(/_/g, " ")} | Stage: {c.funding_stage || "Product"}
                </p>
                {(c.active_jobs_count ?? 0) > 0 && (
                  <p>Open Positions: {c.active_jobs_count} verified roles</p>
                )}
              </article>
            </li>
          ))}
        </ul>

        {/* JSON-LD Collection & ItemList Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "CollectionPage",
                  "@id": `https://locatogo.com/${hub.id}#webpage`,
                  "url": `https://locatogo.com/${hub.id}`,
                  "name": `${hub.name} Tech Companies & Startup Directory`,
                  "description": `Comprehensive directory of verified tech companies and live openings in ${hub.name}.`,
                  "about": {
                    "@type": "Place",
                    "name": hub.name,
                    "address": {
                      "@type": "PostalAddress",
                      "addressLocality": hub.name,
                      "addressCountry": hub.country,
                    },
                    "geo": {
                      "@type": "GeoCoordinates",
                      "latitude": hub.lat,
                      "longitude": hub.lng,
                    },
                  },
                },
                {
                  "@type": "ItemList",
                  "name": `Top Tech Companies in ${hub.name}`,
                  "itemListElement": hubCompanies.slice(0, 30).map((c, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                      "@type": "Organization",
                      "name": c.title,
                      "url": `https://locatogo.com/company/${c.slug}`,
                      "description": c.short_description,
                    },
                  })),
                },
              ],
            }),
          }}
        />
      </section>
    </>
  );
}
