import type { MetadataRoute } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GLOBAL_TECH_HUBS, KNOWN_HUB_LOCALITIES } from "@/lib/constants/tech-hubs";

export const revalidate = 86400; // Cache sitemap for 24 hours

type PublishedListingRow = {
  id: string;
  slug: string;
  company_type: string | null;
  active_jobs_count: number;
  updated_at: string | null;
};

type PublishedBlogRow = {
  slug: string;
  updated_at: string | null;
};

async function fetchAllPublishedListings(supabase: SupabaseClient): Promise<PublishedListingRow[]> {
  const pageSize = 2000;
  const listings: PublishedListingRow[] = [];
  let lastId: string | null = null;

  while (true) {
    let query = supabase
      .from("listings")
      .select("id, slug, company_type, active_jobs_count, updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .limit(pageSize);

    if (lastId) {
      query = query.gt("id", lastId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[Sitemap] Error fetching listings batch:", error);
      break;
    }

    const page = (data || []) as unknown as PublishedListingRow[];
    listings.push(...page);

    if (page.length < pageSize) break;
    lastId = page[page.length - 1].id;
  }

  return listings;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://locatogo.com";
  let supabase: SupabaseClient;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  const [{ data: blogs }, rawListings] = await Promise.all([
    supabase.from("blogs").select("slug, updated_at").eq("status", "published"),
    fetchAllPublishedListings(supabase),
  ]);
  const blogList = (blogs || []) as unknown as PublishedBlogRow[];

  // 1. Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/map`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
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

  rawListings.forEach((listing: PublishedListingRow) => {
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
  const blogRoutes: MetadataRoute.Sitemap = blogList.map((blog) => ({
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
