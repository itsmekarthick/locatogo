import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();

  const [
    { data: domains },
    { data: listings },
    { data: categories },
  ] = await Promise.all([
    supabase.from("domains").select("id, slug, updated_at").eq("status", "published"),
    supabase.from("listings").select("slug, updated_at").eq("status", "published"),
    supabase.from("categories").select("id, slug, updated_at").eq("is_active", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/landing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const categoryUrls: MetadataRoute.Sitemap = (categories ?? []).map((cat) => ({
    url: `${baseUrl}/?category=${cat.id}`,
    lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const domainUrls: MetadataRoute.Sitemap = (domains ?? []).map((domain) => ({
    url: `${baseUrl}/${domain.slug}`,
    lastModified: domain.updated_at ? new Date(domain.updated_at) : new Date(),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  const listingUrls: MetadataRoute.Sitemap = (listings ?? []).map((listing) => ({
    url: `${baseUrl}/listing/${listing.slug}`,
    lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryUrls, ...domainUrls, ...listingUrls];
}
