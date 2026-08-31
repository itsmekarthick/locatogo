import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

// Cache for geocoded city centers to avoid repeated lookups
const cityCenterCache = new Map<string, { lat: number; lon: number; countryCode?: string }>();

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
    const query = (searchParams.get("q") || "").trim();
    const domainId = searchParams.get("domainId");
    const requestedLimit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 10), 100);

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

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

    // 3. Dynamically compute the Bounding Box (approx ~40km radius around city center)
    // 1 degree latitude ~ 111 km. 0.35 deg ~ 38 km radius.
    const delta = 0.35;
    const minLat = center.lat - delta;
    const maxLat = center.lat + delta;
    const minLon = center.lon - delta;
    const maxLon = center.lon + delta;

    // Viewbox format: left (minLon), top (maxLat), right (maxLon), bottom (minLat)
    const viewbox = `${minLon.toFixed(4)},${maxLat.toFixed(4)},${maxLon.toFixed(4)},${minLat.toFixed(4)}`;

    // 4. Construct search queries dynamically for this city
    const searchQueries = [
      `${query}, ${targetCityName}`,
      `${query} in ${targetCityName}`,
      `${query}`, // Raw query bounded by viewbox
    ];

    const allRawItems: any[] = [];
    const seenNames = new Set<string>();
    const seenCoordinates = new Set<string>();

    for (const sq of searchQueries) {
      if (allRawItems.length >= requestedLimit) break;

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        sq
      )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=${Math.min(
        requestedLimit - allRawItems.length,
        35
      )}`;

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

              // Dynamic Geographic Boundary Check: Must fall within the domain's radius
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
        console.error("Dynamic query failed:", sq, err);
      }
    }

    const places = allRawItems.map((item: any) => {
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
