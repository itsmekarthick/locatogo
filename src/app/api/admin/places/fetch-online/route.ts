import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

// Cache for geocoded city centers to avoid repeated lookups
const cityCenterCache = new Map<string, { lat: number; lon: number; countryCode?: string }>();
// Cache for Wikidata enrichment results
const wikidataCache = new Map<string, { website?: string; description?: string }>();

function generateMockCompanyDetails() {
  const companyTypes = ["product_saas", "tech_giant_mnc", "it_services_consulting", "deeptech_hardware", "startup"];
  const stages = ["Series A", "Series B", "Series C+", "Public", "Bootstrapped", "Unicorn"];
  const stacks = [["React", "Node.js", "AWS"], ["Python", "Django", "PostgreSQL"], ["Java", "Spring Boot", "Microservices"], ["Go", "Kubernetes", "GCP"], ["C++", "CUDA", "Hardware"], ["TypeScript", "Next.js", "Vercel"]];
  
  const type = companyTypes[Math.floor(Math.random() * companyTypes.length)];
  const stage = stages[Math.floor(Math.random() * stages.length)];
  const techStack = stacks[Math.floor(Math.random() * stacks.length)];
  
  const jobs: {
    title: string;
    dept: string;
    type: "on_site" | "hybrid" | "remote";
    salary: string;
    apply: string;
  }[] = [
    {
      title: `Senior Software Engineer - ${techStack[0]}`,
      dept: "Engineering",
      type: "hybrid",
      salary: "₹30L - ₹50L",
      apply: "#"
    }
  ];

  if (Math.random() > 0.5) {
    jobs.push({
      title: "Product Manager",
      dept: "Product",
      type: "on_site",
      salary: "₹25L - ₹40L",
      apply: "#"
    });
  }

  return { companyType: type, fundingStage: stage, techStack, jobs };
}

/**
 * FREE: Wikidata API lookup — gets official website + description for well-known companies.
 * No auth required. Works great for large companies like Infosys, TCS, Freshworks, etc.
 */
async function enrichFromWikidata(companyName: string): Promise<{ website?: string; description?: string }> {
  const cacheKey = companyName.toLowerCase().trim();
  if (wikidataCache.has(cacheKey)) return wikidataCache.get(cacheKey)!;

  try {
    // Step 1: Search Wikidata for the entity
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(companyName)}&format=json&language=en&type=item&limit=1&origin=*`;
    const searchRes = await fetch(searchUrl, { headers: { "User-Agent": "LocaToGo/1.0 (admin@locatogo.app)" }, signal: AbortSignal.timeout(5000) });
    if (!searchRes.ok) return {};
    const searchData = await searchRes.json();
    const entity = searchData?.search?.[0];
    if (!entity?.id) return {};

    // Step 2: Fetch the entity's properties
    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entity.id}.json`;
    const entityRes = await fetch(entityUrl, { headers: { "User-Agent": "LocaToGo/1.0" }, signal: AbortSignal.timeout(5000) });
    if (!entityRes.ok) return {};
    const entityData = await entityRes.json();
    const claims = entityData?.entities?.[entity.id]?.claims;

    // P856 = official website
    const websiteClaim = claims?.P856?.[0]?.mainsnak?.datavalue?.value;
    // description from entity labels
    const description = entity.description || "";

    const result = { website: websiteClaim || undefined, description: description || undefined };
    wikidataCache.set(cacheKey, result);
    return result;
  } catch (_) {
    return {};
  }
}

/**
 * FREE: Test known ATS patterns to auto-discover a company's careers portal URL.
 * Tests Greenhouse, Lever, Workday, SmartRecruiters, Ashby patterns.
 */
async function findCareersUrl(website: string, companyName: string): Promise<string | undefined> {
  if (!website) return undefined;

  try {
    const domain = new URL(website).hostname.replace(/^www\./, "").split(".")[0];
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 30);

    const candidates = [
      `https://boards.greenhouse.io/${domain}`,
      `https://boards.greenhouse.io/${slug}`,
      `https://jobs.lever.co/${domain}`,
      `https://jobs.lever.co/${slug}`,
      `https://careers.smartrecruiters.com/${domain}`,
      `https://careers.smartrecruiters.com/${slug}`,
      `https://jobs.ashbyhq.com/${domain}`,
      `https://jobs.ashbyhq.com/${slug}`,
      `${website.replace(/\/$/, "")}/careers`,
      `${website.replace(/\/$/, "")}/jobs`,
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000), redirect: "follow" });
        if (res.ok && res.status < 400) return url;
      } catch (_) {}
    }
  } catch (_) {}
  return undefined;
}

// Tag mapping for category queries (strictly avoiding collision between tech parks and leisure parks)
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
          "User-Agent": "LocaToGo-Directory-Platform/1.0 (admin@locatogo.app)",
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

/**
 * Fetch IT Companies & Corporate Tech Offices from Overpass API
 */
async function fetchOverpassTechOffices(
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number,
  limit: number = 30
): Promise<any[]> {
  try {
    const query = `
      [out:json][timeout:20];
      (
        node["office"="company"](${minLat},${minLon},${maxLat},${maxLon});
        node["office"="it"](${minLat},${minLon},${maxLat},${maxLon});
        node["office"="coworking"](${minLat},${minLon},${maxLat},${maxLon});
        node["commercial"="tech_park"](${minLat},${minLon},${maxLat},${maxLon});
        way["office"="company"](${minLat},${minLon},${maxLat},${maxLon});
        way["office"="it"](${minLat},${minLon},${maxLat},${maxLon});
        way["commercial"="tech_park"](${minLat},${minLon},${maxLat},${maxLon});
      );
      out center ${limit};
    `;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: {
        "User-Agent": "LocaToGo-Directory-Platform/1.0 (admin@locatogo.app)",
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.elements)) return [];

    return data.elements
      .map((el: any) => {
        const name = el.tags?.name || el.tags?.["name:en"];
        if (!name) return null;

        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        if (!lat || !lon) return null;

        const street = el.tags?.["addr:street"] || el.tags?.["addr:road"] || "";
        const suburb = el.tags?.["addr:suburb"] || el.tags?.["addr:district"] || "";
        const city = el.tags?.["addr:city"] || "";
        const postcode = el.tags?.["addr:postcode"] || "";

        return {
          lat: String(lat),
          lon: String(lon),
          name: name,
          display_name: `${name}, ${street ? street + ", " : ""}${suburb ? suburb + ", " : ""}${city || "Bengaluru"}`,
          type: el.tags?.office || "company",
          category: "office",
          address: {
            road: street,
            suburb: suburb,
            city: city,
            postcode: postcode,
            country_code: "in",
          },
          website: el.tags?.website || el.tags?.["contact:website"] || "",
          phone: el.tags?.phone || el.tags?.["contact:phone"] || "",
          osmDescription: el.tags?.description || "",
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("[Overpass Tech Query Error]:", err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, tenant } = await requireTenantContext();

    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    const domainId = searchParams.get("domainId");
    const requestedLimit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 10), 500);

    if (!rawQuery) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const lowerQuery = rawQuery.toLowerCase();
    const isTechSearch =
      lowerQuery.includes("tech") ||
      lowerQuery.includes("software") ||
      lowerQuery.includes("company") ||
      lowerQuery.includes("companies") ||
      lowerQuery.includes("office") ||
      lowerQuery.includes("startup") ||
      lowerQuery.includes("it park") ||
      lowerQuery.includes("it companies") ||
      lowerQuery.includes("tech park");

    // Clean search text by removing fillers
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

    const allRawItems: any[] = [];
    const seenNames = new Set<string>();
    const seenCoordinates = new Set<string>();

    const addItem = (item: any) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (isNaN(lat) || isNaN(lon)) return;
      if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) return;

      const nameKey = (item.name || item.display_name.split(",")[0]).toLowerCase().trim();
      const coordKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;

      if (!seenNames.has(nameKey) && !seenCoordinates.has(coordKey)) {
        seenNames.add(nameKey);
        seenCoordinates.add(coordKey);
        allRawItems.push(item);
      }
    };

    // If search is for Tech Companies / Tech Parks / IT Offices, query Overpass directly first!
    if (isTechSearch) {
      const overpassItems = await fetchOverpassTechOffices(minLat, minLon, maxLat, maxLon, requestedLimit);
      for (const item of overpassItems) {
        addItem(item);
        if (allRawItems.length >= requestedLimit) break;
      }
    }

    // 4. Build Multi-Strategy & Locality-Aware Search URLs for Nominatim
    const queryUrls: string[] = [];

    // Check for matched category tags (excluding park if query is tech)
    const words = cleanedQuery.split(" ").filter(Boolean);
    for (const word of words) {
      const lower = word.toLowerCase();
      if (lower === "park" || lower === "parks") {
        // Only trigger leisure park if it's NOT a tech/office query
        if (!isTechSearch) {
          queryUrls.push(
            `https://nominatim.openstreetmap.org/search?leisure=park&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
          );
        }
      } else if (CATEGORY_TAG_MAP[lower]) {
        for (const tag of CATEGORY_TAG_MAP[lower]) {
          queryUrls.push(
            `https://nominatim.openstreetmap.org/search?${tag.param}=${encodeURIComponent(
              tag.value
            )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
          );
        }
      }
    }

    // Multi-token combinations for "<Brand> <Locality>"
    if (words.length >= 2) {
      queryUrls.push(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          words.join(", ")
        )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
      );
      queryUrls.push(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          `${words.join(", ")}, ${targetCityName}`
        )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&limit=30`
      );
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

    for (const url of queryUrls) {
      if (allRawItems.length >= requestedLimit) break;

      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "LocaToGo-Directory-Platform/1.0 (admin@locatogo.app)",
            "Accept-Language": "en",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            for (const item of data) {
              addItem(item);
              if (allRawItems.length >= requestedLimit) break;
            }
          }
        }
      } catch (err) {
        console.error("Query URL fetch failed:", url, err);
      }
    }

    // Smart Locality Ranking
    const queryTokens = words.map((w) => w.toLowerCase());
    const sortedItems = [...allRawItems].sort((a, b) => {
      const aFull = (a.display_name || "").toLowerCase();
      const bFull = (b.display_name || "").toLowerCase();

      const aMatches = queryTokens.filter((t) => aFull.includes(t)).length;
      const bMatches = queryTokens.filter((t) => bFull.includes(t)).length;

      return bMatches - aMatches;
    });

    // Enrich each place with Wikidata + ATS careers URL (parallel, capped at 10 concurrent)
    const ENRICH_CONCURRENCY = 10;
    const enriched: any[] = new Array(sortedItems.length);
    let enrichIdx = 0;

    async function enrichWorker() {
      while (enrichIdx < sortedItems.length) {
        const i = enrichIdx++;
        const item = sortedItems[i];
        const addressParts = item.display_name.split(", ");
        const rawTitle = item.name || addressParts[0];
        const street = item.address?.road || item.address?.pedestrian || item.address?.street || addressParts[1] || "";
        const locality =
          item.address?.suburb ||
          item.address?.neighbourhood ||
          item.address?.city_district ||
          item.address?.residential ||
          item.address?.quarter ||
          item.address?.town ||
          targetCityName;
        const city = item.address?.city || item.address?.town || item.address?.county || targetCityName;
        const state = item.address?.state || item.address?.province || "";
        const countryCode = (item.address?.country_code || center.countryCode || "in").toUpperCase();
        const postalCode = item.address?.postcode || "";
        const fullAddress = [street, locality, city, postalCode].filter(Boolean).join(", ");
        const slug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const rawCategory = item.type || item.category || "company";
        const isActuallyTech = isTechSearch || ["company", "office", "commercial", "it", "coworking"].includes(rawCategory.toLowerCase());

        // OSM website first
        let website: string = item.website || item.extratags?.website || item.extratags?.["contact:website"] || item.osmDescription || "";

        // Fallback: Wikidata lookup for well-known companies
        let description = "";
        if (isActuallyTech) {
          const wikidata = await enrichFromWikidata(rawTitle);
          if (!website && wikidata.website) website = wikidata.website;
          if (wikidata.description) description = wikidata.description;
        }

        // Find careers URL by testing ATS patterns against the website
        let careersUrl: string | undefined;
        if (isActuallyTech && website) {
          careersUrl = await findCareersUrl(website, rawTitle);
        }

        enriched[i] = {
          title: rawTitle,
          slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          addressLine1: street || fullAddress,
          locality,
          city,
          administrativeArea: state,
          countryCode,
          postalCode,
          rawCategory,
          displayName: item.display_name,
          website,
          careersUrl: careersUrl || "",
          shortDescription: description,
          phone: item.phone || "",
          ...(isActuallyTech ? generateMockCompanyDetails() : {}),
        };
      }
    }

    await Promise.all(Array.from({ length: ENRICH_CONCURRENCY }, enrichWorker));
    const places = enriched;

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
