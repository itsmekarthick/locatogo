import type { Metadata } from "next";
import Link from "next/link";
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
    description: data?.description ?? "Explore places on Mapora.",
  };
}

export default async function DirectoryPage({ params, searchParams }: Props) {
  const { domain: slug } = await params;
  const filters = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: domain } = await supabase
    .from("domains")
    .select("id, name, description, slug")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!domain) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-10 text-center bg-[var(--background)]">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Directory Not Found</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          This atlas does not exist or has not been published yet.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-semibold text-[var(--paper)]"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  const [{ data: categories }, { data: rawListings }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("domain_id", domain.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("listings")
      .select(
        "id, title, slug, short_description, locality, city, administrative_area, country_code, latitude, longitude, is_featured, verification_status, category_id, phone, website, categories:categories!listings_category_id_domain_id_fkey(name)"
      )
      .eq("domain_id", domain.id)
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("title"),
  ]);

  // Format listings with category name
  const listings: PlaceListing[] = (rawListings ?? []).map((l) => {
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
      domain={domain}
      initialListings={listings}
      categories={(categories as Category[]) ?? []}
      availableLocations={availableLocations}
      initialCategory={filters.category ?? ""}
      initialLocation={filters.location ?? ""}
      initialQuery={filters.q ?? ""}
    />
  );
}
