import { cookies, headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ModernDirectoryExplorer, type Category, type PlaceListing } from "@/components/modern-directory-explorer";

type Props = {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>;
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function detectUserMetroDomain(
  headerList: Headers,
  domainList: Array<{ id: string; name: string; slug: string; default_latitude: number | null; default_longitude: number | null }>
) {
  const metroCities = domainList.filter(
    (d) => d.slug !== "india-atlas" && d.default_latitude && d.default_longitude
  );
  if (!metroCities.length) return null;

  try {
    const forwardedFor = headerList.get("x-forwarded-for");
    const realIp = headerList.get("x-real-ip");
    let ip = forwardedFor?.split(",")[0]?.trim() || realIp || "";
    if (
      !ip ||
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip === "unknown" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.16.")
    ) {
      ip = "";
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const ipApiUrl = ip ? `https://ipwho.is/${ip}` : "https://ipwho.is/";
    const res = await fetch(ipApiUrl, {
      signal: controller.signal,
      next: { revalidate: 3600 },
      headers: { "User-Agent": "LocatogoApp/1.0" },
    });
    clearTimeout(timer);

    if (res.ok) {
      const geo = await res.json();
      if (geo.success !== false && typeof geo.latitude === "number" && typeof geo.longitude === "number") {
        let nearest = metroCities[0];
        let minDistance = Infinity;
        for (const metro of metroCities) {
          const dist = calculateDistanceKm(
            geo.latitude,
            geo.longitude,
            metro.default_latitude!,
            metro.default_longitude!
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearest = metro;
          }
        }
        return nearest;
      }
    }
  } catch {
    // Network or timeout fallback
  }

  // Default to Bangalore (India's primary innovation & tech metro)
  return metroCities.find((m) => m.slug === "bangalore") || metroCities[0] || null;
}

export default async function Home({ searchParams }: Props) {
  const filters = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const savedCitySlug = cookieStore.get("locatogo_city")?.value;

  // 1. Fetch all published domains and categories
  const [{ data: domains }] = await Promise.all([
    supabase
      .from("domains")
      .select("id, name, slug, tenant_id, default_latitude, default_longitude")
      .eq("status", "published")
      .order("name"),
  ]);

  const domainList = domains ?? [];
  const metroTenantId = domainList.find((d) => d.slug !== "india-atlas")?.tenant_id;
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("tenant_id", metroTenantId ?? "")
    .eq("is_active", true)
    .order("sort_order");

  const categoryMap = new Map<string, Category>();
  (categories ?? []).forEach((c) => {
    if (c.slug && !categoryMap.has(c.slug)) categoryMap.set(c.slug, c as Category);
  });
  const uniqueCategories = Array.from(categoryMap.values());
  const localCityDomain =
    savedCitySlug === "all"
      ? null
      : savedCitySlug
      ? domainList.find((d) => d.slug === savedCitySlug) ?? null
      : await detectUserMetroDomain(headerList, domainList);

  // 2. Fetch listings:
  // - If search / location filters applied: query matching places
  // - Else if user's local city is detected: load that local city's places by default
  // - Else: load balanced sample across all 8 metros
  let rawListings: any[] = [];

  if (filters.q || filters.location || filters.category) {
    let query = supabase
      .from("listings")
      .select(
        "id, domain_id, title, slug, short_description, locality, city, administrative_area, country_code, latitude, longitude, is_featured, verification_status, category_id, phone, website, categories:categories!listings_category_id_fkey(name)"
      )
      .eq("status", "published")
      .is("company_type", null)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (filters.q?.trim()) {
      query = query.ilike("title", `%${filters.q.trim()}%`);
    }

    if (filters.location?.trim()) {
      const loc = filters.location.trim();
      query = query.or(`city.ilike.%${loc}%,locality.ilike.%${loc}%,administrative_area.ilike.%${loc}%`);
    }

    if (filters.category?.trim() && filters.category !== "all") {
      const cat = (categories ?? []).find(
        (c) => c.slug === filters.category || c.id === filters.category
      );
      if (cat) {
        query = query.eq("category_id", cat.id);
      }
    }

    const { data } = await query
      .order("is_featured", { ascending: false })
      .limit(400);

    rawListings = data ?? [];
  } else if (localCityDomain) {
    // Load local city places for the 5km focus, plus seed places across other metro domains for when user zooms out
    const otherDomains = domainList.filter((d) => d.id !== localCityDomain.id && d.slug !== "india-atlas");
    const [localResult, ...otherResults] = await Promise.all([
      supabase
        .from("listings")
        .select(
          "id, title, slug, short_description, locality, city, administrative_area, country_code, latitude, longitude, is_featured, verification_status, category_id, phone, website, categories:categories!listings_category_id_fkey(name)"
        )
        .eq("domain_id", localCityDomain.id)
        .eq("status", "published")
        .is("company_type", null)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("is_featured", { ascending: false })
        .limit(300),
      ...otherDomains.map((d) =>
        supabase
          .from("listings")
          .select(
            "id, domain_id, title, slug, short_description, locality, city, administrative_area, country_code, latitude, longitude, is_featured, verification_status, category_id, phone, website, categories:categories!listings_category_id_fkey(name)"
          )
          .eq("domain_id", d.id)
          .eq("status", "published")
          .is("company_type", null)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("is_featured", { ascending: false })
          .limit(25)
      ),
    ]);

    rawListings = [
      ...(localResult.data ?? []),
      ...otherResults.flatMap((r) => r.data ?? []),
    ];
  } else {
    // Pan-India balanced initial paint across all 8 metro domains
    const domainQueries = domainList.map((d) =>
      supabase
        .from("listings")
        .select(
          "id, domain_id, title, slug, short_description, locality, city, administrative_area, country_code, latitude, longitude, is_featured, verification_status, category_id, phone, website, categories:categories!listings_category_id_fkey(name)"
        )
        .eq("domain_id", d.id)
        .eq("status", "published")
        .is("company_type", null)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("is_featured", { ascending: false })
        .limit(125)
    );

    const domainResults = await Promise.all(domainQueries);
    rawListings = domainResults.flatMap((r) => r.data ?? []);
  }

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

  // Extract distinct locations (include all 8 metro names + localities)
  const locationSet = new Set<string>();
  domainList.forEach((d) => {
    if (d.name) locationSet.add(d.name);
  });
  const locationListings = localCityDomain
    ? listings.filter((item: any) => item.domain_id === localCityDomain.id)
    : listings;
  locationListings.forEach((item) => {
    if (item.locality) locationSet.add(item.locality);
    if (item.city) locationSet.add(item.city);
  });
  const availableLocations = Array.from(locationSet).filter(Boolean);

  return (
    <ModernDirectoryExplorer
      domain={
        localCityDomain
          ? { id: localCityDomain.id, name: localCityDomain.name, slug: localCityDomain.slug }
          : undefined
      }
      initialListings={listings}
      categories={uniqueCategories}
      availableLocations={availableLocations}
      initialCategory={filters.category}
      initialLocation={filters.location}
      initialQuery={filters.q}
      isRootHome={true}
    />
  );
}

