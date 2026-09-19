import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GlobalTechExplorer, type UnifiedJob } from "@/components/global-tech-explorer";
import type { CompanyDetail, CompanyJob } from "@/components/company-detail-drawer";

export const metadata: Metadata = {
  title: "LocaToGo | Global Tech Atlas & Startup Map",
  description: "Interactive directory and live map of 19,000+ verified IT companies, startups, AI ventures, and MNC GCCs across India's top metro hubs with real-time job openings.",
};

const KNOWN_HUB_COUNTS: Record<string, number> = {
  "bengaluru": 3484,
  "delhi-ncr": 4873,
  "mumbai": 2386,
  "pune": 2149,
  "chennai": 2128,
  "hyderabad": 1939,
  "kolkata": 1278,
  "kochi": 858,
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

  // 1. Get exact total count and active jobs in parallel
  const [{ count: totalTechCount }, { data: rawJobs }] = await Promise.all([
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
      .limit(10000),
  ]);

  // 2. High-Speed Initial Paint Hydration (Loads in <100ms)
  const { data: rawListings } = await supabase
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
    .limit(3000);

  // Group jobs by listing_id
  const jobsByListing = new Map<string, CompanyJob[]>();
  (rawJobs || []).forEach((job: any) => {
    if (job.listing_id) {
      const existing = jobsByListing.get(job.listing_id) || [];
      existing.push(job);
      jobsByListing.set(job.listing_id, existing);
    }
  });

  const initialCompanies: CompanyDetail[] = (rawListings || []).map((l: any) => ({
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
    active_jobs_count: Math.max(l.active_jobs_count || 0, jobsByListing.get(l.id)?.length || 0),
    jobs: jobsByListing.get(l.id) || [],
  }));

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
    };
  });

  return (
    <GlobalTechExplorer
      initialCompanies={initialCompanies}
      initialJobs={initialJobs}
      totalDatabaseCompanies={totalTechCount || 19095}
      currentHub={params.hub || "bengaluru"}
      knownHubCounts={KNOWN_HUB_COUNTS}
    />
  );
}
