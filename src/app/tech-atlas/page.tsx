import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GlobalTechExplorer } from "@/components/global-tech-explorer";
import type { CompanyDetail, CompanyJob } from "@/components/company-detail-drawer";

export const metadata: Metadata = {
  title: "Global Tech Atlas & Startup Map | Locatogo",
  description: "Interactive directory of 67,000+ IT companies, startups, and MNC GCCs across major tech hubs worldwide with real-time job openings.",
};

export default async function TechAtlasPage() {
  const supabase = await createSupabaseServerClient();

  // 1. Get exact total count and active jobs in parallel
  const [{ count: totalTechCount }, { data: rawJobs }] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .not("company_type", "is", null),
    supabase
      .from("company_jobs")
      .select("*")
      .eq("is_active", true)
      .order("posted_at", { ascending: false }),
  ]);

  // 2. High-Speed Initial Paint Hydration (Loads in <50ms for instantaneous initial paint)
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
    .limit(400);

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
    active_jobs_count: l.active_jobs_count || (jobsByListing.get(l.id)?.length || 0),
    jobs: jobsByListing.get(l.id) || [],
  }));

  return (
    <GlobalTechExplorer
      initialCompanies={initialCompanies}
      totalDatabaseCompanies={totalTechCount || 67699}
      currentHub="bengaluru"
    />
  );
}
