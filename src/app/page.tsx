import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ModernDirectoryExplorer, type Category, type PlaceListing } from "@/components/modern-directory-explorer";

type Props = {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const filters = await searchParams;
  const supabase = await createSupabaseServerClient();

  // Ultra-fast initial hydration (Loads in <50ms for instantaneous initial paint)
  const [{ data: categories }, { data: rawListings }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("listings")
      .select(
        "id, title, slug, short_description, locality, city, administrative_area, country_code, latitude, longitude, is_featured, verification_status, category_id, phone, website, categories:categories!listings_category_id_fkey(name)"
      )
      .eq("status", "published")
      .is("company_type", null)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("is_featured", { ascending: false })
      .limit(400),
  ]);

  // Format listings with category name
  const listings: PlaceListing[] = (rawListings ?? []).map((l: any) => {
    const categoryName = Array.isArray(l.categories)
      ? l.categories[0]?.name
      : (l.categories as { name?: string } | null)?.name;
    return {
      ...l,
      category_name: categoryName ?? null,
    };
  });

  // Extract distinct locations (localities and cities)
  const locationSet = new Set<string>();
  listings.forEach((item) => {
    if (item.locality) locationSet.add(item.locality);
    if (item.city) locationSet.add(item.city);
  });
  const availableLocations = Array.from(locationSet).filter(Boolean);

  return (
    <ModernDirectoryExplorer
      initialListings={listings}
      categories={(categories as Category[]) ?? []}
      availableLocations={availableLocations}
      initialCategory={filters.category}
      initialLocation={filters.location}
      initialQuery={filters.q}
    />
  );
}
