import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  const { data: domains } = await supabase.from("domains").select("id, slug, updated_at").eq("status", "published");
  const urls: MetadataRoute.Sitemap = (domains ?? []).map((domain) => ({ url: `${baseUrl}/${domain.slug}`, lastModified: domain.updated_at }));
  for (const domain of domains ?? []) {
    const { data: listings } = await supabase.from("listings").select("slug, updated_at").eq("domain_id", domain.id).eq("status", "published");
    urls.push(...(listings ?? []).map((listing) => ({ url: `${baseUrl}/listing/${listing.slug}`, lastModified: listing.updated_at })));
    urls.push(...(listings ?? []).map((listing) => ({ url: `${baseUrl}/${domain.slug}/listing/${listing.slug}`, lastModified: listing.updated_at })));
  }
  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/listings`, lastModified: new Date() },
    ...urls
  ];
}
