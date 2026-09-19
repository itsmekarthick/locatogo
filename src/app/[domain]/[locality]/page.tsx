import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GlobalTechExplorer } from "@/components/global-tech-explorer";
import {
  GLOBAL_TECH_HUBS,
  KNOWN_HUB_LOCALITIES,
  matchesHub,
  type TechHub,
  type UnifiedJob,
} from "@/lib/constants/tech-hubs";
import { type CompanyDetail, type CompanyJob } from "@/components/company-detail-drawer";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";


export const revalidate = 3600;

const LOCALITY_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "whitefield": { lat: 12.9698, lng: 77.75, zoom: 14 },
  "koramangala": { lat: 12.9352, lng: 77.6245, zoom: 14 },
  "electronic-city": { lat: 12.8399, lng: 77.677, zoom: 14 },
  "outer-ring-road": { lat: 12.9279, lng: 77.6833, zoom: 14 },
  "bellandur": { lat: 12.926, lng: 77.6762, zoom: 14 },
  "indiranagar": { lat: 12.9784, lng: 77.6408, zoom: 14 },
  "adugodi": { lat: 12.9438, lng: 77.6074, zoom: 14 },
  "manyata": { lat: 13.0489, lng: 77.62, zoom: 14 },
  "marathahalli": { lat: 12.9591, lng: 77.6974, zoom: 14 },
  "hebbal": { lat: 13.0358, lng: 77.597, zoom: 14 },
  "hitec-city": { lat: 17.4435, lng: 78.3772, zoom: 14 },
  "gachibowli": { lat: 17.4401, lng: 78.3489, zoom: 14 },
  "financial-district": { lat: 17.4156, lng: 78.3428, zoom: 14 },
  "madhapur": { lat: 17.4483, lng: 78.3915, zoom: 14 },
  "raidurg": { lat: 17.4339, lng: 78.3758, zoom: 14 },
  "cyber-city": { lat: 28.495, lng: 77.089, zoom: 14 },
  "sector-62-noida": { lat: 28.6258, lng: 77.3653, zoom: 14 },
  "bkc": { lat: 19.0657, lng: 72.8687, zoom: 14 },
  "powai": { lat: 19.1176, lng: 72.906, zoom: 14 },
  "lower-parel": { lat: 18.9977, lng: 72.8311, zoom: 14 },
  "hinjewadi": { lat: 18.5913, lng: 73.7389, zoom: 14 },
  "kharadi": { lat: 18.5514, lng: 73.9348, zoom: 14 },
  "magarpatta": { lat: 18.5158, lng: 73.9272, zoom: 14 },
  "baner": { lat: 18.559, lng: 73.7868, zoom: 14 },
  "omr": { lat: 12.901, lng: 80.2279, zoom: 14 },
  "taramani": { lat: 12.9863, lng: 80.2432, zoom: 14 },
  "siruseri": { lat: 12.8285, lng: 80.2185, zoom: 14 },
  "sector-v": { lat: 22.5804, lng: 88.4378, zoom: 14 },
  "infopark": { lat: 10.0104, lng: 76.3608, zoom: 14 },
};

function matchLocality(c: any, localitySlug: string): boolean {
  const q = localitySlug.toLowerCase().replace(/-/g, " ").trim();
  const text = `${c.title || ""} ${c.locality || ""} ${c.address_line_1 || ""} ${c.short_description || ""}`.toLowerCase();
  if (text.includes(q)) return true;
  if (q === "whitefield" && (text.includes("itpb") || text.includes("international tech park") || text.includes("kadugodi"))) return true;
  if (q === "electronic city" && (text.includes("ecity") || text.includes("e-city"))) return true;
  if (q === "outer ring road" && (text.includes("orr") || text.includes("kadubeesanahalli") || text.includes("bellandur") || text.includes("devarabisanahalli"))) return true;
  if (q === "hitec city" && (text.includes("hitec") || text.includes("cyberabad") || text.includes("madhapur") || text.includes("knowledge city"))) return true;
  if (q === "hinjewadi" && (text.includes("hinjewadi") || text.includes("hinjawadi") || text.includes("rajiv gandhi infotech"))) return true;
  if (q === "bkc" && (text.includes("bkc") || text.includes("bandra kurla"))) return true;
  if (q === "omr" && (text.includes("omr") || text.includes("old mahabalipuram") || text.includes("sholinganallur") || text.includes("taramani") || text.includes("siruseri"))) return true;
  return false;
}

type Props = {
  params: Promise<{ domain: string; locality: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain: rawHub, locality: rawLocality } = await params;
  const hubSlug = decodeURIComponent(rawHub).trim().toLowerCase();
  const locSlug = decodeURIComponent(rawLocality).trim().toLowerCase();

  const hub = GLOBAL_TECH_HUBS.find((h) => h.id === hubSlug || h.name.toLowerCase() === hubSlug);
  const localities = hub ? KNOWN_HUB_LOCALITIES[hub.id] || [] : [];
  const locInfo = localities.find((l) => l.slug === locSlug) || {
    slug: locSlug,
    name: locSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  };

  if (!hub) {
    return { title: "Directory | LocaToGo" };
  }

  const title = `Tech Companies in ${locInfo.name}, ${hub.name} | Startups, GCCs & Jobs | LocaToGo`;
  const description = `Directory of verified technology companies, software development firms, and active hiring positions in ${locInfo.name}, ${hub.name}. View tech stacks, office locations, and career openings.`;
  const url = `https://locatogo.com/${hub.id}/${locSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${hub.id}/${locSlug}`,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "LocaToGo",
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(locInfo.name)}%20Tech%20Cluster&category=${encodeURIComponent(hub.name)}&locality=${encodeURIComponent(hub.country)}`,
          width: 1200,
          height: 630,
          alt: `${locInfo.name} Tech Directory`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og?title=${encodeURIComponent(locInfo.name)}%20Tech%20Cluster&category=${encodeURIComponent(hub.name)}&locality=${encodeURIComponent(hub.country)}`],
    },
  };
}

export default async function LocalityDirectoryPage({ params }: Props) {
  const { domain: rawHub, locality: rawLocality } = await params;
  const hubSlug = decodeURIComponent(rawHub).trim().toLowerCase();
  const locSlug = decodeURIComponent(rawLocality).trim().toLowerCase();

  const hub = GLOBAL_TECH_HUBS.find((h) => h.id === hubSlug || h.name.toLowerCase() === hubSlug);
  if (!hub) {
    redirect("/");
  }

  const localities = KNOWN_HUB_LOCALITIES[hub.id] || [];
  const locInfo = localities.find((l) => l.slug === locSlug) || {
    slug: locSlug,
    name: locSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  };

  let supabase: any;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  // Fetch listings and jobs with deterministic pagination
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

  // Filter companies matching this specific locality
  const hubCompanies = initialCompanies.filter((c) => matchesHub(c, hub));
  const localityCompanies = hubCompanies.filter((c) => matchLocality(c, locSlug));
  // If few direct locality matches, fall back to top hub companies so page is never empty
  const displayCompanies = localityCompanies.length > 0 ? localityCompanies : hubCompanies.slice(0, 20);

  // Coordinate override for this locality
  const customCoords = LOCALITY_COORDS[locSlug];
  const focusedHub: TechHub = customCoords
    ? {
        ...hub,
        lat: customCoords.lat,
        lng: customCoords.lng,
        zoom: customCoords.zoom,
      }
    : hub;

  return (
    <>
      {/* 1. Fast Interactive Client Atlas Application Pre-Centered on this Locality */}
      <GlobalTechExplorer
        initialCompanies={initialCompanies}
        initialJobs={initialJobs}
        totalDatabaseCompanies={totalTechCount || 19095}
        currentHub={focusedHub.id}
      />

      {/* 2. Semantic Crawlable SSR Architecture for Search Engines & Robots */}
      <section className="sr-only" aria-label={`${locInfo.name} Tech Directory`}>
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
            <li> › </li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a itemProp="item" href={`/${hub.id}/${locSlug}`}>
                <span itemProp="name">{locInfo.name}</span>
              </a>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

        <h1>Tech Companies in {locInfo.name}, {hub.name}</h1>
        <p>
          Directory of technology companies, MNC engineering centers, AI ventures, and high-growth startups
          located in {locInfo.name}, {hub.name}, {hub.country}.
        </p>

        {/* Index of Tech Companies in this Locality */}
        <h2>Companies in {locInfo.name}</h2>
        <ul>
          {displayCompanies.map((c) => (
            <li key={c.id}>
              <article itemScope itemType="https://schema.org/Organization">
                <h3 itemProp="name">
                  <a href={`/company/${c.slug}`}>{c.title}</a>
                </h3>
                <p itemProp="description">{c.short_description}</p>
                <p>
                  Address: {c.address_line_1 ? `${c.address_line_1}, ` : ""}{c.locality ? `${c.locality}, ` : ""}{c.city || hub.name}
                </p>
                <p>
                  Type: {(c.company_type || "Tech").replace(/_/g, " ")} | Stage: {c.funding_stage || "Product"}
                </p>
                {(c.active_jobs_count ?? 0) > 0 && (
                  <p>Openings: {c.active_jobs_count} verified roles</p>
                )}
              </article>
            </li>
          ))}
        </ul>

        {/* Neighboring Localities */}
        {localities.length > 0 && (
          <div>
            <h2>Other Popular Tech Clusters in {hub.name}</h2>
            <ul>
              {localities
                .filter((l) => l.slug !== locSlug)
                .map((l) => (
                  <li key={l.slug}>
                    <a href={`/${hub.id}/${l.slug}`}>
                      Tech Companies in {l.name}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "CollectionPage",
                  "@id": `https://locatogo.com/${hub.id}/${locSlug}#webpage`,
                  "url": `https://locatogo.com/${hub.id}/${locSlug}`,
                  "name": `Tech Companies in ${locInfo.name}, ${hub.name}`,
                  "description": `Verified tech companies, startups, and live jobs in ${locInfo.name}.`,
                },
                {
                  "@type": "ItemList",
                  "name": `Companies in ${locInfo.name}, ${hub.name}`,
                  "itemListElement": displayCompanies.slice(0, 25).map((c, index) => ({
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
