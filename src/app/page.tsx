import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GlobalTechExplorer, type UnifiedJob } from "@/components/global-tech-explorer";
import { CompanyDetailDrawer, type CompanyDetail, type CompanyJob } from "@/components/company-detail-drawer";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";

export const metadata: Metadata = {
  title: "Global Tech Atlas: Tech Companies, Startups & Live Jobs | LocaToGo",
  description:
    "Search a live map of technology companies, startups, AI ventures, MNC GCCs, and active jobs across global tech hubs.",
  keywords: [
    "technology companies by city",
    "startup map",
    "global tech companies",
    "AI companies",
    "SaaS startups",
    "GCC companies",
    "tech jobs by location",
    "Bengaluru tech companies",
    "New York tech companies",
  ],
  authors: [{ name: "LocaToGo" }],
  creator: "LocaToGo",
  publisher: "LocaToGo",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Global Tech Atlas: Tech Companies, Startups & Live Jobs | LocaToGo",
    description:
      "Explore tech companies, MNC GCCs, AI labs, startups, and live job openings across Bengaluru, Hyderabad, Delhi NCR, Mumbai, and global hubs.",
    url: "https://locatogo.com",
    siteName: "LocaToGo",
    images: [
      {
        url: "/api/og?title=LocaToGo%20Tech%20Atlas&category=Global%20Directory&locality=19,000%2B%20Companies",
        width: 1200,
        height: 630,
        alt: "LocaToGo Tech Atlas",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Tech Atlas: Tech Companies, Startups & Live Jobs | LocaToGo",
    description:
      "Interactive directory of tech companies and live openings across Bengaluru, Hyderabad, Delhi NCR, and global hubs.",
    images: ["/api/og?title=LocaToGo%20Tech%20Atlas&category=Global%20Directory&locality=19,000%2B%20Companies"],
  },
};

const KNOWN_HUB_COUNTS: Record<string, number> = {
  "bengaluru": 0,
  "delhi-ncr": 0,
  "mumbai": 0,
  "pune": 0,
  "chennai": 0,
  "hyderabad": 0,
  "kolkata": 0,
  "kochi": 0,
  "silicon-valley": 0,
  "new-york": 0,
  "seattle": 0,
  "austin": 0,
  "boston": 0,
  "los-angeles": 0,
};

type Props = {
  searchParams: Promise<{ q?: string; type?: string; stage?: string; hub?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  let supabase: any;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  // 1. Get exact total count, all active jobs (bypassing PostgREST 1000-row cap via parallel ranges), and listings in parallel
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
        active_jobs_count,
        country_code
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
        active_jobs_count,
        country_code
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
        active_jobs_count,
        country_code
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
    // Use overall open jobs only (no city filtering reduction)
    const accurateJobCount = compJobs.length > 0 ? compJobs.length : (l.active_jobs_count || 0);

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
      country_code: l.country_code || "IN",
      jobs: compJobs,
    };
  });

  // 3. Build unified job listings for the Live Jobs Board
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
      locality: comp?.locality || "Bengaluru",
      city: comp?.city || "Bengaluru",
      country_code: comp?.country_code || "IN",
    };
  });

  return (
    <>
      {/* 1. Fast Interactive Client Atlas Application */}
      <GlobalTechExplorer
        initialCompanies={initialCompanies}
        initialJobs={initialJobs}
        totalDatabaseCompanies={totalTechCount || 19095}
        knownHubCounts={KNOWN_HUB_COUNTS}
        currentHub={params.hub || "bengaluru"}
        initialType={params.type || "all"}
        isRootPage={true}
      />

      {/* 2. Semantic Crawlable SSR Architecture for Search Engines & Robots */}
      <section className="sr-only" aria-label="Global Tech Atlas Directory Index">
        <h1>LocaToGo — Global Tech Atlas &amp; Startup Directory</h1>
        <p>
          Interactive directory and live ecosystem map of over 19,000+ verified technology companies,
          MNC Global Capability Centers (GCCs), artificial intelligence labs, SaaS enterprises, and funded startups
          with real-time verified hiring positions.
        </p>

        {/* Index of Top Metro Tech Hubs */}
        <h2>Explore Top Metro Tech Hubs</h2>
        <nav aria-label="Metro Tech Hubs">
          <ul>
            <li><a href="/bengaluru">Bengaluru Tech Companies &amp; Startup Directory</a></li>
            <li><a href="/hyderabad">Hyderabad Tech Companies &amp; HITEC City GCCs</a></li>
            <li><a href="/delhi-ncr">Delhi NCR, Gurugram &amp; Noida Tech Companies</a></li>
            <li><a href="/mumbai">Mumbai &amp; BKC Tech Companies &amp; FinTech Hubs</a></li>
            <li><a href="/pune">Pune Tech Companies &amp; Hinjewadi IT Park</a></li>
            <li><a href="/chennai">Chennai Tech Companies &amp; OMR IT Corridor</a></li>
            <li><a href="/kolkata">Kolkata Tech Companies &amp; Salt Lake Sector V</a></li>
            <li><a href="/kochi">Kochi Tech Companies &amp; Infopark Startups</a></li>
            <li><a href="/silicon-valley">Silicon Valley &amp; San Francisco Tech Companies</a></li>
            <li><a href="/new-york">New York City Tech Companies &amp; FinTech Hubs</a></li>
            <li><a href="/seattle">Seattle Tech Companies &amp; Cloud Giants</a></li>
            <li><a href="/austin">Austin Tech Companies &amp; Silicon Hills Startups</a></li>
            <li><a href="/boston">Boston Tech Companies &amp; Innovation Cluster</a></li>
            <li><a href="/los-angeles">Los Angeles Tech Companies &amp; Silicon Beach</a></li>
            <li><a href="/london">London Tech Companies &amp; FinTech Ventures</a></li>
          </ul>
        </nav>

        {/* Index of Top Verified Tech Companies with links to /company/[slug] */}
        <h2>Featured Tech Companies &amp; Open Positions</h2>
        <ul>
          {initialCompanies.slice(0, 40).map((c) => (
            <li key={c.id}>
              <article>
                <h3><a href={`/company/${c.slug}`}>{c.title}</a></h3>
                <p>{c.short_description}</p>
                <p>Location: {c.locality ? `${c.locality}, ` : ""}{c.city || "Bengaluru"}</p>
                <p>Type: {(c.company_type || "Tech").replace(/_/g, " ")} | Stage: {c.funding_stage || "Established"}</p>
                {(c.active_jobs_count ?? 0) > 0 && <p>Openings: {c.active_jobs_count} verified jobs</p>}
              </article>
            </li>
          ))}
        </ul>

        {/* Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://locatogo.com/#website",
                  "url": "https://locatogo.com",
                  "name": "LocaToGo",
                  "description": "Global Tech Atlas & Startup Directory",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://locatogo.com/?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "ItemList",
                  "itemListElement": initialCompanies.slice(0, 30).map((c, index) => ({
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
