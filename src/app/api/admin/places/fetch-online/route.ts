import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

// Cache for geocoded city centers to avoid repeated lookups
const cityCenterCache = new Map<string, { lat: number; lon: number; countryCode?: string }>();

// Tag mapping for category queries
const CATEGORY_TAG_MAP: Record<string, { param: string; value: string }[]> = {
  hospital: [{ param: "amenity", value: "hospital" }, { param: "amenity", value: "clinic" }],
  hospitals: [{ param: "amenity", value: "hospital" }, { param: "amenity", value: "clinic" }],
  clinic: [{ param: "amenity", value: "clinic" }, { param: "amenity", value: "doctors" }],
  clinics: [{ param: "amenity", value: "clinic" }, { param: "amenity", value: "doctors" }],
  doctor: [{ param: "amenity", value: "doctors" }],
  pharmacy: [{ param: "amenity", value: "pharmacy" }],
  pharmacies: [{ param: "amenity", value: "pharmacy" }],
  cafe: [{ param: "amenity", value: "cafe" }],
  cafes: [{ param: "amenity", value: "cafe" }],
  coffee: [{ param: "amenity", value: "cafe" }],
  restaurant: [{ param: "amenity", value: "restaurant" }, { param: "amenity", value: "fast_food" }],
  restaurants: [{ param: "amenity", value: "restaurant" }, { param: "amenity", value: "fast_food" }],
  food: [{ param: "amenity", value: "restaurant" }, { param: "amenity", value: "cafe" }],
  dining: [{ param: "amenity", value: "restaurant" }],
  pub: [{ param: "amenity", value: "pub" }, { param: "amenity", value: "bar" }],
  pubs: [{ param: "amenity", value: "pub" }, { param: "amenity", value: "bar" }],
  bar: [{ param: "amenity", value: "bar" }, { param: "amenity", value: "pub" }],
  bars: [{ param: "amenity", value: "bar" }, { param: "amenity", value: "pub" }],
  bakery: [{ param: "shop", value: "bakery" }],
  bakeries: [{ param: "shop", value: "bakery" }],
  school: [{ param: "amenity", value: "school" }, { param: "amenity", value: "kindergarten" }],
  schools: [{ param: "amenity", value: "school" }],
  college: [{ param: "amenity", value: "college" }, { param: "amenity", value: "university" }],
  colleges: [{ param: "amenity", value: "college" }, { param: "amenity", value: "university" }],
  university: [{ param: "amenity", value: "university" }],
  universities: [{ param: "amenity", value: "university" }],
  education: [{ param: "amenity", value: "school" }, { param: "amenity", value: "college" }],
  gym: [{ param: "leisure", value: "fitness_centre" }],
  gyms: [{ param: "leisure", value: "fitness_centre" }],
  fitness: [{ param: "leisure", value: "fitness_centre" }],
  park: [{ param: "leisure", value: "park" }, { param: "leisure", value: "garden" }],
  parks: [{ param: "leisure", value: "park" }, { param: "leisure", value: "garden" }],
  garden: [{ param: "leisure", value: "garden" }],
  gardens: [{ param: "leisure", value: "garden" }],
  mall: [{ param: "shop", value: "mall" }, { param: "shop", value: "department_store" }],
  malls: [{ param: "shop", value: "mall" }],
  shopping: [{ param: "shop", value: "mall" }, { param: "shop", value: "supermarket" }],
  supermarket: [{ param: "shop", value: "supermarket" }],
  supermarkets: [{ param: "shop", value: "supermarket" }],
  hotel: [{ param: "tourism", value: "hotel" }, { param: "tourism", value: "guest_house" }],
  hotels: [{ param: "tourism", value: "hotel" }],
  metro: [{ param: "railway", value: "station" }],
  transit: [{ param: "railway", value: "station" }, { param: "amenity", value: "bus_station" }],
  bus: [{ param: "amenity", value: "bus_station" }],
  bank: [{ param: "amenity", value: "bank" }, { param: "amenity", value: "atm" }],
  banks: [{ param: "amenity", value: "bank" }],
  atm: [{ param: "amenity", value: "atm" }],
  tech: [{ param: "office", value: "company" }, { param: "office", value: "it" }],
  office: [{ param: "office", value: "company" }],
  offices: [{ param: "office", value: "company" }],
};

async function resolveCenterCoordinates(
  cityName: string,
  explicitLat?: number | null,
  explicitLon?: number | null
): Promise<{ lat: number; lon: number; countryCode: string }> {
  if (explicitLat && explicitLon) {
    return { lat: explicitLat, lon: explicitLon, countryCode: "in" };
  }

  const cleanCity = cityName.trim().toLowerCase();
  if (cityCenterCache.has(cleanCity)) {
    const cached = cityCenterCache.get(cleanCity)!;
    return { lat: cached.lat, lon: cached.lon, countryCode: cached.countryCode || "in" };
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        cityName
      )}&format=json&addressdetails=1&limit=1`,
      {
        headers: {
          "User-Agent": "Locatogo-Directory-Platform/1.0 (admin@locatogo.app)",
          "Accept-Language": "en",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const countryCode = item.address?.country_code?.toLowerCase() || "in";
        const center = { lat, lon, countryCode };
        cityCenterCache.set(cleanCity, center);
        return center;
      }
    }
  } catch (err) {
    console.error("Failed to geocode city center:", cityName, err);
  }

  // Default fallback (Bengaluru center coordinates)
  return { lat: 12.9716, lon: 77.5946, countryCode: "in" };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, tenant } = await requireTenantContext();

    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    const domainId = searchParams.get("domainId");
    const requestedLimit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 10), 100);

    if (!rawQuery) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    // Clean search text by removing fillers like "top", "best", "near me"
    const cleanedQuery = rawQuery
      .replace(/\b(top|best|popular|famous|near me|nearby|in|at)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim() || rawQuery;

    // 1. Fetch Target Domain details dynamically
    let targetCityName = "Bengaluru";
    let explicitLat: number | null = null;
    let explicitLon: number | null = null;

    if (domainId) {
      const { data: domain } = await supabase
        .from("domains")
        .select("name, slug, default_latitude, default_longitude")
        .eq("id", domainId)
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      if (domain) {
        targetCityName = domain.name.replace(/(atlas|directory|guide|portal)/gi, "").trim() || domain.name;
        explicitLat = domain.default_latitude ?? null;
        explicitLon = domain.default_longitude ?? null;
      }
    }

    // 2. Dynamically resolve center coordinates
    const center = await resolveCenterCoordinates(targetCityName, explicitLat, explicitLon);

    // 3. Dynamically compute the Bounding Box (~40km radius around city center)
    const delta = 0.35;
    const minLat = center.lat - delta;
    const maxLat = center.lat + delta;
    const minLon = center.lon - delta;
    const maxLon = center.lon + delta;

    // Viewbox format: left (minLon), top (maxLat), right (maxLon), bottom (minLat)
    const viewbox = `${minLon.toFixed(4)},${maxLat.toFixed(4)},${maxLon.toFixed(4)},${minLat.toFixed(4)}`;

    // 4. Build Multi-Strategy & Locality-Aware Search URLs
    const queryUrls: string[] = [];

    // Check for matched category tags (e.g. "hospital", "cafe", "school")
    const words = cleanedQuery.split(" ").filter(Boolean);
    for (const word of words) {
      const lower = word.toLowerCase();
      if (CATEGORY_TAG_MAP[lower]) {
        for (const tag of CATEGORY_TAG_MAP[lower]) {
          queryUrls.push(
            `https://nominatim.openstreetmap.org/search?${tag.param}=${encodeURIComponent(
              tag.value
            )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
          );
        }
      }
    }

    // Multi-token combinations for "<Brand> <Locality>" (e.g. "Truffles Koramangala", "Manipal Whitefield")
    if (words.length >= 2) {
      // 1. Comma-separated: "Truffles, Koramangala"
      queryUrls.push(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          words.join(", ")
        )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
      );
      // 2. Comma-separated with city: "Truffles, Koramangala, Bengaluru"
      queryUrls.push(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          `${words.join(", ")}, ${targetCityName}`
        )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
      );
      // 3. First token fallback with viewbox: e.g. "Truffles"
      queryUrls.push(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          words[0]
        )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
      );
    }

    // Strategy: Raw & Cleaned Keyword Queries
    queryUrls.push(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        cleanedQuery
      )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
    );
    queryUrls.push(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        `${cleanedQuery}, ${targetCityName}`
      )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
    );
    queryUrls.push(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        rawQuery
      )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
    );

    const allRawItems: any[] = [];
    const seenNames = new Set<string>();
    const seenCoordinates = new Set<string>();

    for (const url of queryUrls) {
      if (allRawItems.length >= requestedLimit) break;

      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Locatogo-Directory-Platform/1.0 (admin@locatogo.app)",
            "Accept-Language": "en",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            for (const item of data) {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);

              if (isNaN(lat) || isNaN(lon)) continue;

              // Geographic Boundary Check: Must fall within the domain's radius
              if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) {
                continue;
              }

              const nameKey = (item.name || item.display_name.split(",")[0]).toLowerCase().trim();
              const coordKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;

              if (!seenNames.has(nameKey) && !seenCoordinates.has(coordKey)) {
                seenNames.add(nameKey);
                seenCoordinates.add(coordKey);
                allRawItems.push(item);
              }
              if (allRawItems.length >= requestedLimit) break;
            }
          }
        }
      } catch (err) {
        console.error("Query URL fetch failed:", url, err);
      }
    }

    // Smart Locality Ranking: If user entered multiple words (e.g. "Truffles Koramangala"),
    // sort items matching the specific locality words to the very top!
    const queryTokens = words.map((w) => w.toLowerCase());
    const sortedItems = [...allRawItems].sort((a, b) => {
      const aFull = (a.display_name || "").toLowerCase();
      const bFull = (b.display_name || "").toLowerCase();

      const aMatches = queryTokens.filter((t) => aFull.includes(t)).length;
      const bMatches = queryTokens.filter((t) => bFull.includes(t)).length;

      return bMatches - aMatches;
    });

    const places = sortedItems.map((item: any) => {
      const addressParts = item.display_name.split(", ");
      const rawTitle = item.name || addressParts[0];
      const street = item.address.road || item.address.pedestrian || item.address.street || addressParts[1] || "";
      const locality =
        item.address.suburb ||
        item.address.neighbourhood ||
        item.address.city_district ||
        item.address.residential ||
        item.address.quarter ||
        item.address.town ||
        targetCityName;
      const city = item.address.city || item.address.town || item.address.county || targetCityName;
      const state = item.address.state || item.address.province || "";
      const countryCode = (item.address.country_code || center.countryCode || "in").toUpperCase();
      const postalCode = item.address.postcode || "";

      const fullAddress = [street, locality, city, postalCode].filter(Boolean).join(", ");

      const slug = rawTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      return {
        title: rawTitle,
        slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        addressLine1: street || fullAddress,
        locality: locality,
        city: city,
        administrativeArea: state,
        countryCode: countryCode,
        postalCode: postalCode,
        rawCategory: item.type || item.category || "general",
        displayName: item.display_name,
      };
    });

    return NextResponse.json({
      success: true,
      places,
      count: places.length,
      meta: {
        query: rawQuery,
        city: targetCityName,
        center: { lat: center.lat, lon: center.lon },
        bounds: { minLat, maxLat, minLon, maxLon },
      },
    });
  } catch (err) {
    console.error("[Online Place Fetcher] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch places" },
      { status: 500 }
    );
  }
}
