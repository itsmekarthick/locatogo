import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GLOBAL_TECH_HUBS, KNOWN_HUB_LOCALITIES } from "@/lib/constants/tech-hubs";

export const revalidate = 86400; // Cache sitemap for 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://locatogo.com";
  let supabase: any;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  // Fetch tech listings with pagination up to 3000
  const [
    listingsPage1,
    listingsPage2,
    listingsPage3,
    { data: blogs },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("slug, company_type, active_jobs_count, updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(0, 999),
    supabase
      .from("listings")
      .select("slug, company_type, active_jobs_count, updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(1000, 1999),
    supabase
      .from("listings")
      .select("slug, company_type, active_jobs_count, updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(2000, 2999),
    supabase
      .from("blogs")
      .select("slug, updated_at")
      .eq("status", "published"),
  ]);

  const rawListings = [
    ...(listingsPage1.data || []),
    ...(listingsPage2.data || []),
    ...(listingsPage3.data || []),
  ];

  // 1. Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  // 2. All 14 Global Tech Hubs (e.g. /bengaluru, /hyderabad, /delhi-ncr)
  const hubRoutes: MetadataRoute.Sitemap = GLOBAL_TECH_HUBS.map((hub) => ({
    url: `${baseUrl}/${hub.id}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  }));

  // 3. Top Tech Locality Clusters (e.g. /bengaluru/whitefield, /bengaluru/koramangala)
  const localityRoutes: MetadataRoute.Sitemap = [];
  Object.entries(KNOWN_HUB_LOCALITIES).forEach(([hubId, localities]) => {
    localities.forEach((loc) => {
      localityRoutes.push({
        url: `${baseUrl}/${hubId}/${loc.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    });
  });

  // 4. All Published Company Profiles (/company/[slug])
  const companyRoutes: MetadataRoute.Sitemap = [];
  const legacyListingRoutes: MetadataRoute.Sitemap = [];

  rawListings.forEach((listing: any) => {
    if (!listing.slug) return;
    const lastMod = listing.updated_at ? new Date(listing.updated_at) : new Date();

    if (listing.company_type) {
      companyRoutes.push({
        url: `${baseUrl}/company/${listing.slug}`,
        lastModified: lastMod,
        changeFrequency: listing.active_jobs_count > 0 ? "daily" : "weekly",
        priority: listing.active_jobs_count > 0 ? 0.9 : 0.75,
      });
    } else {
      legacyListingRoutes.push({
        url: `${baseUrl}/listing/${listing.slug}`,
        lastModified: lastMod,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  });

  // 5. Blog articles
  const blogRoutes: MetadataRoute.Sitemap = (blogs || []).map((blog: any) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updated_at ? new Date(blog.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...hubRoutes,
    ...localityRoutes,
    ...companyRoutes,
    ...legacyListingRoutes,
    ...blogRoutes,
  ];
}
