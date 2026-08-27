import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ModernDirectoryExplorer,
  type PlaceListing,
  type Category,
} from "@/components/modern-directory-explorer";

export const metadata: Metadata = {
  title: "Explore Places & Map Directory | Mapora",
  description: "Live interactive map and location-based directory.",
};

type Props = {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const filters = await searchParams;
  const supabase = await createSupabaseServerClient();

  // Find the primary published domain
  const { data: domain } = await supabase
    .from("domains")
    .select("id, name, description, slug")
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!domain) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-10 text-center bg-[var(--background)]">
        <div className="max-w-md rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-8 shadow-sm">
          <span className="text-4xl">🗺️</span>
          <h1 className="mt-4 font-display text-2xl font-bold text-[var(--foreground)]">Welcome to Mapora</h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            No published directory domain was found. Log in to your workspace to publish your first directory map.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/admin"
              className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-semibold text-[var(--paper)]"
            >
              Open Admin Workspace
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full border border-[var(--line)] px-5 py-2.5 text-xs font-semibold text-[var(--foreground)]"
            >
              Sign up
            </Link>
          </div>
        </div>
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
