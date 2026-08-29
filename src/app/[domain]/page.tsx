import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ModernDirectoryExplorer,
  type PlaceListing,
  type Category,
} from "@/components/modern-directory-explorer";

type Props = {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ q?: string; category?: string; location?: string }>;
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
    description: data?.description ?? "Explore places on Locatogo.",
  };
}

export default async function DirectoryPage({ params, searchParams }: Props) {
  const { domain: rawSlug } = await params;
  const cleanSlug = decodeURIComponent(rawSlug).trim().toLowerCase();
  const filters = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: domain } = await supabase
    .from("domains")
    .select("id, name, description, slug")
    .or(`slug.eq.${cleanSlug},slug.ilike.${cleanSlug}`)
    .eq("status", "published")
    .maybeSingle();

  // If not a domain, check if this is a direct place/listing slug (e.g. /truffles-koramangala)
  if (!domain) {
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

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-10 text-center bg-white font-sans">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Directory or Place Not Found</h1>
        <p className="mt-2 text-sm text-gray-500">
          This atlas or place link could not be resolved.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-md bg-[#e26a4f] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#d8583c] transition-colors"
        >
          Back to Live Atlas
        </Link>
      </main>
    );
  }

  const [{ data: categories }, { data: rawListings }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, icon, pin_color")
      .eq("domain_id", domain.id)
      .order("sort_order"),
    supabase
      .from("listings")
      .select(
        "id, title, slug, short_description, address_line_1, address_line_2, locality, city, postal_code, phone, website, latitude, longitude, is_featured, verification_status, category_id, categories:categories!listings_category_id_domain_id_fkey(name, icon, pin_color)"
      )
      .eq("domain_id", domain.id)
      .eq("status", "published")
      .order("is_featured", { ascending: false }),
  ]);

  const listings: PlaceListing[] = (rawListings ?? []).map((l) => {
    const cat = Array.isArray(l.categories)
      ? l.categories[0]
      : (l.categories as { name?: string; icon?: string; pin_color?: string } | null);

    return {
      id: l.id,
      title: l.title,
      slug: l.slug,
      short_description: l.short_description,
      address_line_1: l.address_line_1,
      address_line_2: l.address_line_2,
      locality: l.locality,
      city: l.city,
      postal_code: l.postal_code,
      phone: l.phone,
      website: l.website,
      latitude: l.latitude,
      longitude: l.longitude,
      is_featured: l.is_featured,
      verification_status: l.verification_status,
      category_id: l.category_id,
      category_name: cat?.name,
      category_icon: cat?.icon,
      pin_color: cat?.pin_color,
    };
  });

  const availableLocations = Array.from(
    new Set(
      listings
        .map((l) => l.locality)
        .filter((loc): loc is string => Boolean(loc && loc.trim().length > 0))
    )
  ).sort();

  return (
    <ModernDirectoryExplorer
      domain={{
        name: domain.name,
        slug: domain.slug,
        description: domain.description,
      }}
      categories={(categories as Category[]) ?? []}
      initialListings={listings}
      availableLocations={availableLocations}
      initialCategory={filters.category}
      initialQuery={filters.q}
    />
  );
}
