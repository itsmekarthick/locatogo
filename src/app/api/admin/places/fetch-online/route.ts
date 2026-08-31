import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

export async function GET(request: NextRequest) {
  try {
    // Ensure only authenticated workspace staff can fetch online place data
    await requireTenantContext();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const city = (searchParams.get("city") || "Bengaluru").trim();
    const requestedLimit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 10), 100);

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    // List of queries to execute to gather a comprehensive dataset across the city
    const subQueries = [
      `${query}, ${city}, Karnataka, India`,
      `${query}, Koramangala, ${city}, India`,
      `${query}, Indiranagar, ${city}, India`,
      `${query}, Whitefield, ${city}, India`,
      `${query}, HSR Layout, ${city}, India`,
      `${query}, Electronic City, ${city}, India`,
      `${query}, Malleswaram, ${city}, India`,
    ];

    const allRawItems: any[] = [];
    const seenNames = new Set<string>();

    for (const sq of subQueries) {
      if (allRawItems.length >= requestedLimit) break;

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        sq
      )}&format=json&addressdetails=1&limit=${Math.min(requestedLimit - allRawItems.length, 30)}`;

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
              const nameKey = (item.name || item.display_name.split(",")[0]).toLowerCase().trim();
              if (!seenNames.has(nameKey)) {
                seenNames.add(nameKey);
                allRawItems.push(item);
              }
              if (allRawItems.length >= requestedLimit) break;
            }
          }
        }
      } catch (err) {
        console.error("Subquery fetch failed:", sq, err);
      }
    }

    const places = allRawItems.map((item: any) => {
      const addressParts = item.display_name.split(", ");
      const rawTitle = item.name || addressParts[0];
      const street = item.address.road || item.address.pedestrian || addressParts[1] || "";
      const locality =
        item.address.suburb ||
        item.address.neighbourhood ||
        item.address.city_district ||
        item.address.residential ||
        "Bengaluru";
      const postalCode = item.address.postcode || "";

      const fullAddress = [street, locality, "Bengaluru", postalCode].filter(Boolean).join(", ");

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
        city: "Bengaluru",
        administrativeArea: "Karnataka",
        countryCode: "IN",
        postalCode: postalCode,
        rawCategory: item.type || item.category || "general",
        displayName: item.display_name,
      };
    });

    return NextResponse.json({ success: true, places, count: places.length });
  } catch (err) {
    console.error("[Online Place Fetcher] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch places" },
      { status: 500 }
    );
  }
}
