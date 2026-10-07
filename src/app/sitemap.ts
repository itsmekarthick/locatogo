import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GLOBAL_TECH_HUBS, KNOWN_HUB_LOCALITIES } from "@/lib/constants/tech-hubs";

export const revalidate = 86400; // Cache sitemap for 24 hours

async function fetchAllPublishedListings(supabase: any) {
  const pageSize = 1000;
  const listings: any[] = [];

  for (let offset = 0; offset < 100000; offset += pageSize) {
    const { data } = await supabase
      .from("listings")
      .select("slug, company_type, active_jobs_count, updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    const page = data || [];
    listings.push(...page);
    if (page.length < pageSize) break;
  }

  return listings;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://locatogo.com";
  let supabase: any;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  const [{ data: blogs }, rawListings] = await Promise.all([
    supabase.from("blogs").select("slug, updated_at").eq("status", "published"),
    fetchAllPublishedListings(supabase),
  ]);

  // 1. Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/landing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  // 2. All Global Tech Hub SEO Landing Pages (/hub/[country]/[city] and /[city])
  const globalHubSeoRoutes: MetadataRoute.Sitemap = GLOBAL_TECH_HUBS.map((hub) => ({
    url: `${baseUrl}/hub/${hub.countryCode.toLowerCase()}/${hub.id}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  }));

  const directHubRoutes: MetadataRoute.Sitemap = GLOBAL_TECH_HUBS.map((hub) => ({
    url: `${baseUrl}/${hub.id}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.95,
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
  const seenUrls = new Set<string>();

  rawListings.forEach((listing: any) => {
    if (!listing.slug) return;
    const lastMod = listing.updated_at ? new Date(listing.updated_at) : new Date();

    if (listing.company_type) {
      const url = `${baseUrl}/company/${listing.slug}`;
      if (seenUrls.has(url)) return;
      seenUrls.add(url);

      companyRoutes.push({
        url,
        lastModified: lastMod,
        changeFrequency: listing.active_jobs_count > 0 ? "daily" : "weekly",
        priority: listing.active_jobs_count > 0 ? 0.9 : 0.75,
      });
    } else {
      const url = `${baseUrl}/listing/${listing.slug}`;
      if (seenUrls.has(url)) return;
      seenUrls.add(url);

      legacyListingRoutes.push({
        url,
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
    ...globalHubSeoRoutes,
    ...directHubRoutes,
    ...localityRoutes,
    ...companyRoutes,
    ...legacyListingRoutes,
    ...blogRoutes,
  ];
}
