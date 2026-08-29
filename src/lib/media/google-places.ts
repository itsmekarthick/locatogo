// Google Places API (New) & Rich Place Intelligence Client

export type GooglePlacePhoto = {
  url: string;
  alt: string;
  caption: string;
  source: "google_places" | "wikipedia" | "curated";
};

export type GooglePlaceReview = {
  author: string;
  authorPhoto?: string;
  rating: number;
  relativeTime: string;
  text: string;
};

export type GooglePlaceDetails = {
  photos: GooglePlacePhoto[];
  rating?: number;
  userRatingCount?: number;
  formattedAddress?: string;
  isOpenNow?: boolean;
  openingHoursText?: string[];
  currentHoursStatus?: string;
  reviews?: GooglePlaceReview[];
  editorialSummary?: string;
  priceLevel?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
};

// In-memory cache to avoid repeated API calls
const placeCache = new Map<string, GooglePlaceDetails>();

/**
 * Dynamically fetches authentic place details, live opening hours, reviews, and high-res photos
 * from Google Places API (New) with fallback to Wikipedia Commons.
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
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos,places.currentOpeningHours,places.regularOpeningHours,places.reviews,places.editorialSummary,places.priceLevel,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri",
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
        next: { revalidate: 43200 }, // Cache 12 hours
      });

      if (res.ok) {
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          const photos: GooglePlacePhoto[] = [];

          if (place.photos && place.photos.length > 0) {
            for (const photo of place.photos.slice(0, 6)) {
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

          const reviews: GooglePlaceReview[] = [];
          if (place.reviews && Array.isArray(place.reviews)) {
            for (const rev of place.reviews.slice(0, 5)) {
              if (rev.text?.text) {
                reviews.push({
                  author: rev.authorAttribution?.displayName || "Google Reviewer",
                  authorPhoto: rev.authorAttribution?.photoUri,
                  rating: rev.rating || 5,
                  relativeTime: rev.relativePublishTimeDescription || "Recently",
                  text: rev.text.text,
                });
              }
            }
          }

          const isOpenNow =
            place.currentOpeningHours?.openNow ??
            place.regularOpeningHours?.openNow ??
            undefined;

          const openingHoursText =
            place.currentOpeningHours?.weekdayDescriptions ||
            place.regularOpeningHours?.weekdayDescriptions ||
            [];

          const details: GooglePlaceDetails = {
            photos,
            rating: place.rating,
            userRatingCount: place.userRatingCount,
            formattedAddress: place.formattedAddress,
            isOpenNow,
            openingHoursText,
            currentHoursStatus: isOpenNow !== undefined ? (isOpenNow ? "Open Now" : "Closed") : undefined,
            reviews: reviews.length > 0 ? reviews : undefined,
            editorialSummary: place.editorialSummary?.text,
            priceLevel: place.priceLevel,
            googleMapsUri: place.googleMapsUri,
            websiteUri: place.websiteUri,
            nationalPhoneNumber: place.nationalPhoneNumber,
          };

          placeCache.set(cacheKey, details);
          return details;
        }
      }
    } catch (err) {
      console.warn(`[Google Places API (New)] Could not fetch details for ${title}:`, err);
    }
  }

  // 2. Wikipedia Media Fallback
  try {
    const wikiPhotos = await fetchWikipediaPhotos(title);
    if (wikiPhotos.length > 0) {
      const details: GooglePlaceDetails = { photos: wikiPhotos };
      placeCache.set(cacheKey, details);
      return details;
    }
  } catch (e) {
    // Ignore
  }

  return { photos: [] };
}

/**
 * Searches Wikipedia Commons for real imagery if Google Places returned no photos.
 */
async function fetchWikipediaPhotos(query: string): Promise<GooglePlacePhoto[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query + " Bangalore"
    )}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } });
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();

    const pages = searchData.query?.search;
    if (!pages || pages.length === 0) return [];

    const pageId = pages[0].pageid;
    const pageTitle = pages[0].title;

    const imgQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=pageimages|images&pithumbsize=1000&format=json&origin=*`;
    const imgRes = await fetch(imgQueryUrl, { next: { revalidate: 86400 } });
    if (!imgRes.ok) return [];
    const imgData = await imgRes.json();

    const page = imgData.query?.pages?.[pageId];
    if (!page?.thumbnail?.source) return [];

    return [
      {
        url: page.thumbnail.source,
        alt: `${pageTitle} - Wikipedia`,
        caption: `${pageTitle} (Wikimedia Commons)`,
        source: "wikipedia",
      },
    ];
  } catch {
    return [];
  }
}
