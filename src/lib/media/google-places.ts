// Google Places API (New) & Real Location Photography Client

export type GooglePlacePhoto = {
  url: string;
  alt: string;
  caption: string;
  source: "google_places" | "wikipedia" | "curated";
};

export type GooglePlaceDetails = {
  photos: GooglePlacePhoto[];
  rating?: number;
  userRatingCount?: number;
  formattedAddress?: string;
};

// In-memory cache to avoid repeated API calls
const placeCache = new Map<string, GooglePlaceDetails>();

/**
 * Dynamically fetches authentic place details and photos from Google Places API (New) or Wikipedia Commons.
 */
export async function fetchLivePlaceDetails(
  title: string,
  locality?: string | null,
  latitude?: number | null,
  longitude?: number | null
): Promise<GooglePlaceDetails> {
  const cacheKey = `${title}_${locality || ""}`.toLowerCase();
  if (placeCache.has(cacheKey)) {
    return placeCache.get(cacheKey)!;
  }

  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 1. If Google Places API Key is present, query Google Places API (New)
  if (apiKey) {
    try {
      const textQuery = `${title} ${locality || "Bangalore"}`;
      const url = "https://places.googleapis.com/v1/places:searchText";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos",
        },
        body: JSON.stringify({
          textQuery,
          ...(latitude && longitude
            ? {
                locationBias: {
                  circle: {
                    center: { latitude, longitude },
                    radius: 5000.0,
                  },
                },
              }
            : {}),
        }),
        next: { revalidate: 86400 }, // Cache 24 hours
      });

      if (res.ok) {
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          const photos: GooglePlacePhoto[] = [];

          if (place.photos && place.photos.length > 0) {
            for (const photo of place.photos.slice(0, 5)) {
              if (photo.name) {
                photos.push({
                  url: `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=1000&maxWidthPx=1200&key=${apiKey}`,
                  alt: `${title} - Google Maps Photo`,
                  caption: `${title} (Google Maps)`,
                  source: "google_places",
                });
              }
            }
          }

          const details: GooglePlaceDetails = {
            photos,
            rating: place.rating,
            userRatingCount: place.userRatingCount,
            formattedAddress: place.formattedAddress,
          };

          placeCache.set(cacheKey, details);
          return details;
        }
      }
    } catch (err) {
      console.warn(`[Google Places API (New)] Could not fetch details for ${title}:`, err);
    }
  }

  // 2. Fetch authentic real-world photos from Wikipedia / Wikimedia Commons fallback
  try {
    const cleanTitle = title.replace(/\s+(Bangalore|Chandapura|Whitefield|Koramangala|Indiranagar|Hebbal|Anekal)/gi, "").trim();
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=pageimages|images&pithumbsize=1000&format=json&origin=*`;

    const wikiRes = await fetch(wikiUrl, { next: { revalidate: 86400 } });
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const pages = wikiData.query?.pages;
      if (pages) {
        const pageKey = Object.keys(pages)[0];
        if (pageKey && pageKey !== "-1" && pages[pageKey]?.thumbnail?.source) {
          const wikiDetails: GooglePlaceDetails = {
            photos: [
              {
                url: pages[pageKey].thumbnail.source,
                alt: `${title} - Verified Landmark Image`,
                caption: `${title} (Wikipedia Commons)`,
                source: "wikipedia",
              },
            ],
          };
          placeCache.set(cacheKey, wikiDetails);
          return wikiDetails;
        }
      }
    }
  } catch (err) {
    console.warn(`[Wikipedia] Could not fetch photos for ${title}:`, err);
  }

  return { photos: [] };
}

/**
 * Backward compatibility alias for photo fetching
 */
export async function fetchLivePlacePhotos(
  title: string,
  locality?: string | null,
  latitude?: number | null,
  longitude?: number | null
): Promise<GooglePlacePhoto[]> {
  const details = await fetchLivePlaceDetails(title, locality, latitude, longitude);
  return details.photos;
}
