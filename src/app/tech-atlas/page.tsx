import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GlobalTechExplorer } from "@/components/global-tech-explorer";
import type { CompanyDetail, CompanyJob } from "@/components/company-detail-drawer";

export const metadata: Metadata = {
  title: "Global Tech Atlas & Startup Map | Locatogo",
  description: "Interactive directory of IT companies, startups, and MNC GCCs across major tech hubs worldwide with real-time job openings.",
};

export default async function TechAtlasPage() {
  const supabase = await createSupabaseServerClient();

  // Query tech listings and company jobs
  const [
    { data: rawListings },
    { data: rawJobs },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select(`
        id,
        title,
        slug,
        short_description,
        description,
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
        category:categories!listings_category_id_domain_id_fkey(name, slug)
      `)
      .eq("status", "published")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(10000),
    supabase
      .from("company_jobs")
      .select("*")
      .eq("is_active", true)
      .order("posted_at", { ascending: false }),
  ]);

  // Group jobs by listing_id
  const jobsByListing = new Map<string, CompanyJob[]>();
  (rawJobs || []).forEach((job: any) => {
    if (job.listing_id) {
      const existing = jobsByListing.get(job.listing_id) || [];
      existing.push(job);
      jobsByListing.set(job.listing_id, existing);
    }
  });

  // Strict Filter: Only include IT companies, Startups, GCCs, and Tech categories
  const techListings = (rawListings || []).filter((l: any) => {
    // 1. Check if explicitly marked as a company entity
    if (l.company_type || l.funding_stage || l.careers_url || (l.active_jobs_count && l.active_jobs_count > 0)) {
      return true;
    }

    // 2. Check if listing has active job openings
    if (jobsByListing.has(l.id) && (jobsByListing.get(l.id)?.length || 0) > 0) {
      return true;
    }

    // 3. Check if category is tech/software/startup
    const catName = (l.category?.name || "").toLowerCase();
    const catSlug = (l.category?.slug || "").toLowerCase();
    const isTechCat =
      catName.includes("tech") ||
      catName.includes("software") ||
      catName.includes("startup") ||
      catName.includes("it ") ||
      catName.includes("consulting") ||
      catSlug.includes("tech") ||
      catSlug.includes("software") ||
      catSlug.includes("startup");

    if (isTechCat) return true;

    // Exclude general non-tech places (hospitals, cafes, restaurants, salons, parks, etc.)
    return false;
  });

  const companies: CompanyDetail[] = techListings.map((l: any) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    short_description: l.short_description,
    description: l.description,
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

  return <GlobalTechExplorer initialCompanies={companies} currentHub="bengaluru" />;
}
