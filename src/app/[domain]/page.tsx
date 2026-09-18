import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain: slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("domains")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return {
    title: data?.name ? `${data.name} | Map Directory` : "Map Directory",
    description: data?.description ?? "Explore places on LocaToGo.",
  };
}

export default async function DirectoryPage({ params }: Props) {
  const { domain: rawSlug } = await params;
  const cleanSlug = decodeURIComponent(rawSlug).trim().toLowerCase();
  const supabase = await createSupabaseServerClient();

  // 1. Check if this is a direct place/listing slug (e.g. /truffles-koramangala or listing uuid)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
  let listingQuery = supabase.from("listings").select("slug");
  if (isUuid) {
    listingQuery = listingQuery.or(`slug.eq.${cleanSlug},slug.ilike.${cleanSlug},id.eq.${cleanSlug}`);
  } else {
    listingQuery = listingQuery.or(`slug.eq.${cleanSlug},slug.ilike.${cleanSlug}`);
  }

  const { data: maybeListing } = await listingQuery.limit(1).maybeSingle();

  if (maybeListing?.slug) {
    redirect(`/listing/${maybeListing.slug}`);
  }

  // 2. City atlas domains are hidden for launch in favor of the Global Tech Atlas; redirect to home
  redirect("/");
}
