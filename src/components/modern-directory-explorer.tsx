"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Pagination } from "@/components/ui/pagination";
import { generateUberRideLink, generateWhatsAppInquiryLink } from "@/lib/services/transit-links";
import { Google3DMap } from "@/components/google-3d-map";
import { FavoriteButton } from "@/components/favorite-button";
import { PlaceWeatherBadge } from "@/components/place-weather-badge";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { getPlaceRating } from "@/lib/services/place-rating";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { trackEvent } from "@/lib/analytics/tracker";
import type { PlaceWeather, WeatherType } from "@/lib/services/weather";
import { MapErrorBoundary } from "@/components/map-error-boundary";
import { AdBannerSlot } from "@/components/ad-banner-slot";
import { AirbnbSearchBar } from "@/components/airbnb-search-bar";
import { AirbnbCategoryCarousel } from "@/components/airbnb-category-carousel";
import { AirbnbFiltersModal, type FilterState } from "@/components/airbnb-filters-modal";
import { AirbnbListingCard } from "@/components/airbnb-listing-card";
import type { MapViewportBounds } from "@/components/interactive-leaflet-canvas";
import { MapCanvasSkeleton } from "@/components/tech-atlas-skeleton";

// Dynamically import interactive Leaflet map canvas without SSR
const InteractiveLeafletCanvas = dynamic(
  () => import("@/components/interactive-leaflet-canvas"),
  {
    ssr: false,
    loading: () => <MapCanvasSkeleton title="Loading Interactive Atlas..." subtitle="Calibrating city coordinates and verified listings..." />,
  }
);

export type PlaceListing = {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  locality?: string | null;
  city?: string | null;
  administrative_area?: string | null;
  country_code?: string | null;
  latitude: number | null;
  longitude: number | null;
  is_featured?: boolean;
  verification_status?: string;
  category_id?: string;
  category_name?: string | null;
  phone?: string | null;
  website?: string | null;
  distanceKm?: number | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  domain?: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string | null;
  };
  initialListings: PlaceListing[];
  categories: Category[];
  availableLocations: string[];
  initialCategory?: string;
  initialLocation?: string;
  initialQuery?: string;
  isRootHome?: boolean;
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
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

function deduplicateListings(listings: PlaceListing[]) {
  const seen = new Set<string>();
  return listings.filter((listing) => {
    const coordinateKey =
      typeof listing.latitude === "number" && typeof listing.longitude === "number"
        ? `${listing.latitude.toFixed(5)},${listing.longitude.toFixed(5)}`
        : listing.id;
    const key = `${listing.title.trim().toLowerCase()}|${coordinateKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getDisplayCategory(place: PlaceListing) {
  if (place.category_name?.trim()) return place.category_name;
  const text = `${place.title} ${place.short_description || ""}`.toLowerCase();
  if (/hospital|clinic|health|medical|pharmacy|dentist/.test(text)) return "Healthcare";
  if (/hotel|resort|hostel|accommodation/.test(text)) return "Hospitality";
  if (/restaurant|cafe|bakery|food|dining/.test(text)) return "Food & Dining";
  if (/tech|software|computer|it company|coworking|engineering/.test(text)) return "Technology";
  if (/car|auto|motor|fuel|petrol|vehicle/.test(text)) return "Automotive";
  if (/shop|store|retail|mall|market/.test(text)) return "Retail";
  if (/school|college|university|academy|education/.test(text)) return "Education";
  return "Local Business";
}

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("tech park") || lower.includes("sez") || lower.includes("business park") || lower.includes("campus")) return "🏢";
  if (lower.includes("cowork") || lower.includes("shared office") || lower.includes("workspace") || lower.includes("wework")) return "💻";
  if (lower.includes("restaurant") || lower.includes("cafe") || lower.includes("food") || lower.includes("dine") || lower.includes("bakery")) return "☕";
  if (lower.includes("school") || lower.includes("education") || lower.includes("college") || lower.includes("academy") || lower.includes("university")) return "🎓";
  if (lower.includes("hospital") || lower.includes("health") || lower.includes("clinic") || lower.includes("medical") || lower.includes("pharmacy")) return "🏥";
  if (lower.includes("art") || lower.includes("creative") || lower.includes("design") || lower.includes("culture")) return "🎨";
  if (lower.includes("mall") || lower.includes("retail") || lower.includes("shop") || lower.includes("store") || lower.includes("market")) return "🏬";
  if (lower.includes("petrol") || lower.includes("fuel") || lower.includes("bunk") || lower.includes("pump") || lower.includes("gas") || lower.includes("ev")) return "⛽";
  return "📍";
}

export const AMENITIES_LIST = [
  { id: "wifi", label: "WiFi", icon: "📶", keywords: ["wifi", "internet", "fiber", "broadband", "cowork", "tech park"] },
  { id: "ev", label: "EV Charging", icon: "⚡", keywords: ["ev charging", "electric", "charger", "fast charging", "charging"] },
  { id: "parking", label: "Parking", icon: "🅿️", keywords: ["parking", "valet", "garage", "multi-level"] },
  { id: "accessibility", label: "Accessible", icon: "♿", keywords: ["wheelchair", "accessible", "ramp", "elevator"] },
  { id: "24x7", label: "Open 24/7", icon: "🕒", keywords: ["24x7", "24/7", "24 hours", "round the clock", "emergency"] },
  { id: "metro", label: "Near Metro", icon: "🚇", keywords: ["metro", "station", "subway", "transit"] },
];

export const METRO_DOMAINS = [
  { name: "All India", slug: "", domain_id: "", lat: 20.5937, lng: 78.9629 },
  { name: "Bangalore", slug: "bangalore", domain_id: "461e4ee7-7a16-43b3-b342-5a968e44f306", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", slug: "chennai", domain_id: "5f4cdbe4-d2c6-45f1-9812-6c8114c62c8b", lat: 13.0827, lng: 80.2707 },
  { name: "Delhi NCR", slug: "delhi", domain_id: "09f2c99c-be3c-4272-b217-6de226d9edc1", lat: 28.6139, lng: 77.2090 },
  { name: "Hyderabad", slug: "hyderabad", domain_id: "c0441a34-5395-4462-9492-e982ab9035c0", lat: 17.3850, lng: 78.4867 },
  { name: "Kochi", slug: "kochi", domain_id: "2cf6a26b-5672-400e-ac9d-75361d56a842", lat: 9.9312, lng: 76.2673 },
  { name: "Kolkata", slug: "kolkata", domain_id: "4071b01b-b555-4a6a-b92a-4feda0679cac", lat: 22.5726, lng: 88.3639 },
  { name: "Mumbai", slug: "mumbai", domain_id: "cbe0a7d8-63d8-4c5b-9a72-4cef88922272", lat: 19.0760, lng: 72.8777 },
  { name: "Pune", slug: "pune", domain_id: "f3ae324b-fa4d-4556-af94-f9a5e343cc41", lat: 18.5204, lng: 73.8567 },
];

const VISIBLE_CATEGORY_SLUGS = new Set([
  "schools-education",
  "restaurants-cafes",
  "hospitals-clinics",
  "hotels-accommodation",
  "shopping-malls",
  "tech-coworking",
]);

const BANGALORE_MICRO_MARKETS = [
  "Koramangala", "Indiranagar", "Jayanagar", "Whitefield", "Electronic City",
  "Bommasandra", "HSR Layout", "Marathahalli", "Bellandur", "Hebbal",
  "JP Nagar", "Banashankari", "Rajajinagar", "BTM Layout", "Sarjapur Road",
  "Manyata Tech Park",
];

export function ModernDirectoryExplorer({
  domain,
  initialListings,
  categories,
  availableLocations,
  initialCategory = "",
  initialLocation = "",
  initialQuery = "",
  isRootHome = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Resolve initialCategory which might be a slug or a UUID
  const resolvedInitialCat = useMemo(() => {
    if (!initialCategory) return "";
    const match = categories.find(
      (c) => c.id === initialCategory || c.slug?.toLowerCase() === initialCategory.toLowerCase()
    );
    return match ? match.id : initialCategory;
  }, [initialCategory, categories]);

  // Canonical deduplicated categories list
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter((c) => {
      const key = (c.slug || c.name || c.id).toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);
  const visibleCategories = useMemo(
    () => uniqueCategories.filter((category) => VISIBLE_CATEGORY_SLUGS.has(category.slug)),
    [uniqueCategories]
  );
  const additionalCategories = useMemo(
    () => uniqueCategories.filter((category) => !VISIBLE_CATEGORY_SLUGS.has(category.slug)),
    [uniqueCategories]
  );
  const areaOptions = useMemo(() => {
    const locations = Array.from(new Set(availableLocations.filter(Boolean)));
    if (domain?.slug !== "bangalore") return locations;
    const priority = BANGALORE_MICRO_MARKETS.filter((market) =>
      locations.some((location) => location.toLowerCase().includes(market.toLowerCase()))
    );
    const prioritySet = new Set(priority.map((market) => market.toLowerCase()));
    const remaining = locations
      .filter((location) => !prioritySet.has(location.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
    return [...priority, ...remaining];
  }, [availableLocations, domain?.slug]);

  const [selectedCategory, setSelectedCategory] = useState(resolvedInitialCat);
  const [selectedAmenity, setSelectedAmenity] = useState<string>("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [mobileSheetSnap, setMobileSheetSnap] = useState<"peek" | "half" | "full">("peek");
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const cardInteractionRef = useRef(false);
  const [sortBy, setSortBy] = useState<"default" | "distance" | "name" | "featured">("default");
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeMapBounds, setActiveMapBounds] = useState<MapViewportBounds | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [mobileShowMap, setMobileShowMap] = useState(false);
  
  // Layout mode: "split" (Default Airbnb split view), "immersive" (Hero map + grid), "3d", or "fullscreen"
  const [viewMode, setViewMode] = useState<"immersive" | "3d" | "split" | "fullscreen">("split");
  const [isFullscreenDrawerOpen, setIsFullscreenDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const el = document.getElementById("listings-grid-top");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [flyToUserTrigger, setFlyToUserTrigger] = useState(0);
  const [locationErrorNotice, setLocationErrorNotice] = useState<string | null>(null);

  // Live Weather & Weather Atmospheric Simulation
  const [liveWeather, setLiveWeather] = useState<PlaceWeather | null>(null);
  const [simulatedWeather, setSimulatedWeather] = useState<WeatherType | null>(null);

  const [allListings, setAllListings] = useState<PlaceListing[]>(initialListings);

  useEffect(() => {
    if (!activePlaceId || typeof document === "undefined") return;
    if (cardInteractionRef.current) {
      cardInteractionRef.current = false;
      return;
    }
    const card = document.querySelector(`[data-listing-id="${activePlaceId}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activePlaceId]);

  // Progressive background streaming: Loads remaining places smoothly without blocking main thread
  useEffect(() => {
    let isCancelled = false;

    async function streamMoreListings() {
      for (let page = 0; page < 8; page++) {
        if (isCancelled) break;
        try {
          const url = (domain?.id && !isRootHome)
            ? `/api/listings?domain_id=${domain.id}&page=${page}&limit=1000`
            : `/api/listings?page=${page}&limit=1000`;
          const res = await fetch(url);
          if (!res.ok) break;
          const data = await res.json();
          if (!data.listings || data.listings.length === 0) break;

          if (isCancelled) break;

          if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            (window as any).requestIdleCallback(() => {
              if (!isCancelled) {
                setAllListings((prev) => {
                  const existingIds = new Set(prev.map((l) => l.id));
                  const uniqueNew = data.listings.filter((l: PlaceListing) => !existingIds.has(l.id));
                  return [...prev, ...uniqueNew];
                });
              }
            });
          } else {
            setAllListings((prev) => {
              const existingIds = new Set(prev.map((l) => l.id));
              const uniqueNew = data.listings.filter((l: PlaceListing) => !existingIds.has(l.id));
              return [...prev, ...uniqueNew];
            });
          }

          // Yield CPU to maintain 60 FPS
          await new Promise((r) => setTimeout(r, 800));
        } catch {
          break;
        }
      }
    }

    const timer = setTimeout(() => {
      streamMoreListings();
    }, 1500);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [domain?.id]);

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      try {
        const lat = userLocation?.lat || (initialListings[0]?.latitude ?? 12.9716);
        const lng = userLocation?.lng || (initialListings[0]?.longitude ?? 77.5946);
        const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.weather) {
            setLiveWeather(data.weather);
          }
        }
      } catch (err) {
        console.warn("Could not fetch live weather:", err);
      }
    };

    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [userLocation, initialListings]);

  // Log directory page view analytics
  useEffect(() => {
    trackEvent("page_view", {
      domainSlug: domain?.slug || "default",
      domainId: domain?.id,
    });
  }, [domain?.id, domain?.slug]);

  // Handle user clicking 'My Location' with automatic IP Geolocation fallback
  const handleLocateMe = useCallback(() => {
    setLocationErrorNotice(null);
    setIsLocating(true);

    const applyUserMetro = (lat: number, lng: number) => {
      let nearest = METRO_DOMAINS[1]; // default Bangalore
      let minDistance = Infinity;
      for (const m of METRO_DOMAINS) {
        if (!m.slug) continue;
        const dist = calculateDistanceKm(lat, lng, m.lat, m.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = m;
        }
      }

      if (typeof document !== "undefined") {
        document.cookie = `locatogo_city=${nearest.slug}; path=/; max-age=31536000; SameSite=Lax`;
      }

      if (!domain?.slug && !initialLocation) {
        setSelectedLocation(nearest.name);
        fetch(`/api/listings?domain_id=${nearest.domain_id}&page=0&limit=1000`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.listings && data.listings.length > 0) {
              setAllListings((prev) => {
                const existingIds = new Set(data.listings.map((l: PlaceListing) => l.id));
                const otherListings = prev.filter((l) => !existingIds.has(l.id));
                return [...data.listings, ...otherListings];
              });
            }
          })
          .catch((err) => console.warn("Could not fetch local city places:", err));
      }
    };

    const onLocationResolved = (coords: { lat: number; lng: number }) => {
      setUserLocation(coords);
      setIsLocating(false);
      setLocationErrorNotice(null);
      setFlyToUserTrigger((prev) => prev + 1);
      applyUserMetro(coords.lat, coords.lng);
    };

    const fallbackToIp = async () => {
      try {
        const res = await fetch("/api/geolocation");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.latitude && data.longitude) {
            onLocationResolved({ lat: data.latitude, lng: data.longitude });
            return;
          }
        }
      } catch (e) {
        console.warn("IP Geolocation fallback failed:", e);
      }
      setIsLocating(false);
      setLocationErrorNotice(
        "Could not detect GPS coordinates. Click anywhere on the map to drop a pin and set your location."
      );
    };

    const doGpsLookup = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onLocationResolved({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("GPS failed (code " + err.code + "), falling back to IP...");
          fallbackToIp();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      fallbackToIp();
      return;
    }

    // Use Permissions API to avoid a long GPS timeout when already denied
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (result.state === "denied") {
            console.warn("Geolocation permission denied by OS/browser, using IP fallback...");
            fallbackToIp();
          } else {
            // "granted" or "prompt" — trigger the real GPS call (shows popup if "prompt")
            doGpsLookup();
          }
        })
        .catch(() => doGpsLookup());
    } else {
      doGpsLookup();
    }
  }, [domain?.slug, initialLocation]);

  // Request browser location immediately on initial mount
  useEffect(() => {
    handleLocateMe();
  }, [handleLocateMe]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLocation, selectedAmenity, viewMode]);

  // Category select handler
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(selectedCategory === catId ? "" : catId);
    if (viewMode === "fullscreen") {
      setIsFullscreenDrawerOpen(true);
    }
  };

  // Select place handler
  const handleSelectPlace = (id: string | null) => {
    setActivePlaceId(id);
    if (id && viewMode === "fullscreen") {
      setIsFullscreenDrawerOpen(true);
    }
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = () => {
    setViewMode((prev) => (prev === "fullscreen" ? "immersive" : "fullscreen"));
  };

  // Filter and calculate distances
  const filteredListings = useMemo(() => {
    const list = deduplicateListings(allListings).filter((place) => {
      // 1. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = place.title.toLowerCase().includes(q);
        const matchesDesc = place.short_description?.toLowerCase().includes(q);
        const matchesLoc = place.locality?.toLowerCase().includes(q) || place.city?.toLowerCase().includes(q);
        const matchesCat = place.category_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesCat) return false;
      }

      // 2. Category Filter (Supports matching by UUID or slug)
      if (selectedCategory) {
        const matchedCategory = categories.find(
          (c) => c.id === selectedCategory || c.slug?.toLowerCase() === selectedCategory.toLowerCase()
        );
        const targetId = matchedCategory ? matchedCategory.id : selectedCategory;
        const targetSlug = matchedCategory?.slug?.toLowerCase();
        const matchesCatId = place.category_id === targetId;
        const matchesCatSlug = targetSlug && place.category_name?.toLowerCase().includes(targetSlug.replace(/-/g, " "));
        if (!matchesCatId && !matchesCatSlug) return false;
      }

      // 3. Location Filter
      if (selectedLocation) {
        const loc = selectedLocation.toLowerCase();
        const matchesLocality = place.locality?.toLowerCase().includes(loc);
        const matchesCity = place.city?.toLowerCase().includes(loc);
        if (!matchesLocality && !matchesCity) return false;
      }

      // 4. Featured Only Filter
      if (featuredOnly && !place.is_featured) {
        return false;
      }

      // 5. Verified Only Filter
      if (verifiedOnly && place.verification_status !== "verified") {
        return false;
      }

      // 6. Minimum Star Rating Filter
      if (minRating !== null) {
        const ratingInfo = getPlaceRating(place);
        if (ratingInfo.rating < minRating) return false;
      }

      // 7. Amenities Multi-Select Filter
      if (selectedAmenities.length > 0) {
        const textToSearch = `${place.title} ${place.short_description || ""} ${place.category_name || ""}`.toLowerCase();
        const hasAllAmenities = selectedAmenities.every((amenityId) => {
          const amenityObj = AMENITIES_LIST.find((a) => a.id === amenityId);
          if (!amenityObj) return true;
          return amenityObj.keywords.some((kw) => textToSearch.includes(kw));
        });
        if (!hasAllAmenities) return false;
      } else if (selectedAmenity) {
        const amenityObj = AMENITIES_LIST.find((a) => a.id === selectedAmenity);
        if (amenityObj) {
          const textToSearch = `${place.title} ${place.short_description || ""} ${place.category_name || ""}`.toLowerCase();
          const hasAmenity = amenityObj.keywords.some((kw) => textToSearch.includes(kw));
          if (!hasAmenity) return false;
        }
      }

      // 8. Active Map Bounds Filter ("Search this area")
      if (activeMapBounds && typeof place.latitude === "number" && typeof place.longitude === "number") {
        const inLat = place.latitude <= activeMapBounds.north && place.latitude >= activeMapBounds.south;
        const inLng = place.longitude <= activeMapBounds.east && place.longitude >= activeMapBounds.west;
        if (!inLat || !inLng) return false;
      }

      return true;
    });

    // Add distance if user location is known
    const withDistance = list
      .map((place): PlaceListing => {
        let distanceKm: number | null = null;
        if (userLocation && place.latitude && place.longitude) {
          distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, place.latitude, place.longitude);
        }
        return {
          ...place,
          distanceKm,
        };
      })
      .filter((place) => {
        // Radius filter if specified and distance is known
        if (radiusKm !== null && typeof place.distanceKm === "number") {
          return place.distanceKm <= radiusKm;
        }
        return true;
      });

    // Sort listings
    return withDistance.sort((a, b) => {
      if (sortBy === "distance") {
        if (typeof a.distanceKm === "number" && typeof b.distanceKm === "number") {
          return a.distanceKm - b.distanceKm;
        }
        if (typeof a.distanceKm === "number") return -1;
        if (typeof b.distanceKm === "number") return 1;
      } else if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "featured") {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
      }

      // Default sorting: Featured first, then closest distance if available
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      if (typeof a.distanceKm === "number" && typeof b.distanceKm === "number") {
        return a.distanceKm - b.distanceKm;
      }
      return a.title.localeCompare(b.title);
    });
  }, [
    allListings,
    searchQuery,
    selectedCategory,
    selectedLocation,
    userLocation,
    radiusKm,
    sortBy,
    featuredOnly,
    verifiedOnly,
    minRating,
    selectedAmenities,
    selectedAmenity,
    activeMapBounds,
  ]);

  const locatedListings = useMemo(
    () =>
      filteredListings.filter(
        (p): p is PlaceListing & { latitude: number; longitude: number } =>
          typeof p.latitude === "number" &&
          Number.isFinite(p.latitude) &&
          p.latitude >= -90 &&
          p.latitude <= 90 &&
          typeof p.longitude === "number" &&
          Number.isFinite(p.longitude) &&
          p.longitude >= -180 &&
          p.longitude <= 180
      ),
    [filteredListings]
  );

  const totalPages = Math.ceil(filteredListings.length / pageSize) || 1;
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredListings.slice(start, start + pageSize);
  }, [filteredListings, currentPage, pageSize]);

  // Dynamic top locations derived from available locations or listings
  const topLocations = useMemo(() => {
    if (areaOptions.length > 0) {
      return areaOptions.slice(0, 10);
    }
    const unique = Array.from(
      new Set(
        initialListings
          .map((l) => l.locality || l.city)
          .filter((loc): loc is string => typeof loc === "string" && loc.trim().length > 0)
      )
    );
    return unique.slice(0, 10);
  }, [areaOptions, initialListings]);

  const handleSelectQuickLocation = (locName: string) => {
    if (selectedLocation === locName) {
      setSelectedLocation("");
      return;
    }
    setSelectedLocation(locName);
    const targetPlace = locatedListings.find(
      (p) =>
        p.locality?.toLowerCase().includes(locName.toLowerCase()) ||
        p.city?.toLowerCase().includes(locName.toLowerCase())
    );
    if (targetPlace) {
      setUserLocation({ lat: targetPlace.latitude, lng: targetPlace.longitude });
      setFlyToUserTrigger((prev) => prev + 1);
    }
  };

  const renderResultsCategoryFilters = () => (
    <div className="mt-4 flex min-w-0 items-center gap-1.5 overflow-x-auto border-b border-gray-100 pb-3 no-scrollbar">
      <span className="shrink-0 text-[11px] font-semibold text-gray-400">Categories:</span>
      <button
        onClick={() => handleSelectCategory("")}
        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
          !selectedCategory ? "bg-[#18181b] text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        All
      </button>
      {visibleCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleSelectCategory(category.id)}
          className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
            selectedCategory === category.id ? "bg-[#18181b] text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>{getCategoryIcon(category.name)}</span>
          {category.name}
        </button>
      ))}
      {additionalCategories.length > 0 && (
        <select
          value={additionalCategories.some((category) => category.id === selectedCategory) ? selectedCategory : ""}
          onChange={(event) => handleSelectCategory(event.target.value)}
          className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-700 outline-none cursor-pointer"
        >
          <option value="">More categories</option>
          {additionalCategories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      )}
    </div>
  );

  const renderViewSwitcher = (currentMode: string) => (
    <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50/50 p-1 self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
      <button
        onClick={() => setViewMode("split")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
          currentMode === "split" ? "bg-[#18181b] text-white shadow-xs" : "text-gray-600 hover:text-gray-950"
        }`}
      >
        <span>🗖</span>
        <span>Split View</span>
      </button>
      <button
        onClick={() => setViewMode("immersive")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
          currentMode === "immersive" ? "bg-[#18181b] text-white shadow-xs" : "text-gray-600 hover:text-gray-950"
        }`}
      >
        <span>🗺️</span>
        <span>Street Map</span>
      </button>
      <button
        onClick={() => setViewMode("3d")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
          currentMode === "3d" ? "bg-[#18181b] text-white shadow-xs" : "text-gray-600 hover:text-gray-950"
        }`}
      >
        <span>🛰️</span>
        <span>Satellite</span>
      </button>
      <button
        onClick={() => setViewMode("fullscreen")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
          currentMode === "fullscreen" ? "bg-[#18181b] text-white shadow-xs" : "text-gray-600 hover:text-gray-950"
        }`}
      >
        <span>⛶</span>
        <span>Full Map</span>
      </button>
    </div>
  );

  const activeMetro = METRO_DOMAINS.find((m) => m.slug === domain?.slug) || METRO_DOMAINS[0];

  const handleSelectMetro = (metro: (typeof METRO_DOMAINS)[0]) => {
    if (typeof window !== "undefined") {
      if (metro.slug) {
        window.location.href = `/${metro.slug}`;
      } else {
        window.location.href = `/`;
      }
    }
  };

  const activeFilterCount =
    (minRating ? 1 : 0) +
    (radiusKm ? 1 : 0) +
    selectedAmenities.length +
    (featuredOnly ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (selectedLocation ? 1 : 0) +
    (activeMapBounds ? 1 : 0);

  const handleApplyFilters = (newFilters: FilterState) => {
    setMinRating(newFilters.minRating);
    setRadiusKm(newFilters.radiusKm);
    setSelectedAmenities(newFilters.selectedAmenities);
    setFeaturedOnly(newFilters.featuredOnly);
    setVerifiedOnly(newFilters.verifiedOnly);
    setSelectedLocation(newFilters.selectedArea);
  };

  const handleResetFilters = () => {
    setMinRating(null);
    setRadiusKm(null);
    setSelectedAmenities([]);
    setFeaturedOnly(false);
    setVerifiedOnly(false);
    setSelectedLocation("");
    setActiveMapBounds(null);
  };

  const handleSearchArea = useCallback((bounds: MapViewportBounds) => {
    setActiveMapBounds(bounds);
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans antialiased text-[#111827]">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] sticky top-0 z-[1000] shadow-2xs">
        <div className="mx-auto flex min-w-0 max-w-[1440px] items-center justify-between px-2.5 sm:px-6 py-2.5 sm:py-3 gap-2 sm:gap-3">
          {/* Logo & Dual Atlas Switcher */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group" title="LocaToGo">
              <BrandLogo size={32} className="group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                LocaToGo<span className="text-[#06b6d4]">.</span>
              </span>
            </Link>

            {/* Dual Atlas Mode Segmented Pill */}
            <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-0.5 shadow-2xs">
              <Link
                href={`/${domain?.slug || "bangalore"}`}
                className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-900 dark:text-white shadow-xs transition-all"
              >
                <span>🏙️</span>
                <span className="hidden md:inline">{domain?.name ? `${domain.name}` : "City"} Atlas</span>
                <span className="md:hidden">City</span>
              </Link>
              <Link
                href="/tech-atlas"
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors group"
              >
                <span>💼</span>
                <span className="hidden md:inline">Tech Atlas</span>
                <span className="md:hidden">Tech</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-600 animate-pulse"></span>
              </Link>
              <Link
                href="/blog"
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors group"
                title="City Guides & Stories"
              >
                <span>📖</span>
                <span className="hidden lg:inline">Stories</span>
              </Link>
            </div>
          </div>

          {/* Desktop Center: Airbnb Unified Search Pill */}
          <div className="hidden md:flex flex-1 max-w-xl mx-2 justify-center">
            <AirbnbSearchBar
              activeMetroName={domain?.name || activeMetro.name}
              onSelectMetro={handleSelectMetro}
              selectedCategory={selectedCategory}
              categories={uniqueCategories}
              onSelectCategory={handleSelectCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectPlace={(id) => {
                cardInteractionRef.current = true;
                setActivePlaceId(id);
              }}
              places={allListings}
              onLocateMe={handleLocateMe}
              isLocating={isLocating}
            />
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <Link
              href="/submit"
              title="Add a New Place"
              className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow-md hover:scale-[1.02] transition-all"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span className="hidden sm:inline">Add Place</span>
            </Link>
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </div>

        {/* Dedicated Mobile Search & Neighborhood Bar */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800/60 px-2.5 py-1.5 bg-slate-50/70 dark:bg-slate-900/70">
          <AirbnbSearchBar
            activeMetroName={domain?.name || activeMetro.name}
            onSelectMetro={handleSelectMetro}
            selectedCategory={selectedCategory}
            categories={uniqueCategories}
            onSelectCategory={handleSelectCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectPlace={(id) => {
              cardInteractionRef.current = true;
              setActivePlaceId(id);
            }}
            places={allListings}
            onLocateMe={handleLocateMe}
            isLocating={isLocating}
          />
        </div>
      </header>

      {/* Airbnb Horizontal Category Icon Carousel */}
      <AirbnbCategoryCarousel
        categories={uniqueCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setIsFilterModalOpen(true)}
      />

      {/* Airbnb Comprehensive Filters Modal */}
      <AirbnbFiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={{
          minRating,
          radiusKm,
          selectedAmenities,
          featuredOnly,
          verifiedOnly,
          selectedArea: selectedLocation,
        }}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        totalMatchingPlaces={filteredListings.length}
        availableAreas={areaOptions}
        hasUserLocation={Boolean(userLocation)}
        onLocateMe={handleLocateMe}
      />

      {/* Top Flash Announcement Ad Banner Placement (only on immersive mode) */}
      {viewMode !== "split" && <AdBannerSlot slotType="flash_banner" variant="flash" />}

      {/* Location Permission Guidance Toast */}
      {locationErrorNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3 sticky top-14 z-50 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <p className="font-medium">{locationErrorNotice}</p>
          </div>
          <button
            onClick={() => setLocationErrorNotice(null)}
            className="text-amber-700 hover:text-amber-950 font-bold px-2 py-0.5 rounded-lg hover:bg-amber-100/60"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW MODE 1: IMMERSIVE HERO MAP / 3D SATELLITE VIEW */}
      {(viewMode === "immersive" || viewMode === "3d") && (
        <>
          {/* Top Interactive Hero Map with Floating Overlapping Categories Card */}
          <div className="relative mx-auto w-full max-w-[1440px] h-[380px] sm:h-[460px] md:h-[500px] overflow-visible bg-[#e8eef5] sm:rounded-3xl sm:shadow-[0_18px_50px_rgba(15,23,42,0.14)] sm:ring-1 sm:ring-slate-200/80">
            <MapErrorBoundary fallbackText="The city atlas map canvas encountered an issue. Click below to reload.">
              <InteractiveLeafletCanvas
                key={`hero-canvas-${viewMode}`}
                locatedListings={locatedListings}
                activePlaceId={activePlaceId}
                setActivePlaceId={setActivePlaceId}
                userLocation={userLocation}
                onLocateMe={handleLocateMe}
                flyToUserTrigger={flyToUserTrigger}
                onToggleFullscreen={handleToggleFullscreen}
                isFullscreen={false}
                initialPerspective={viewMode === "3d" ? "satellite" : "street"}
                weatherType={simulatedWeather || liveWeather?.weatherType}
                searchQuery={searchQuery}
                radiusKm={radiusKm ?? 5}
                onSearchArea={handleSearchArea}
                onMapClick={(loc) => {
                  setUserLocation(loc);
                  setFlyToUserTrigger((prev) => prev + 1);
                }}
              />
            </MapErrorBoundary>

            {/* Floating Live Weather & Air Quality Badge on Map Top-Left (Opposite side from top-right layer controls) */}
            {liveWeather && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[400] drop-shadow-md">
                <PlaceWeatherBadge
                  weather={liveWeather}
                  compact
                  onSimulateWeather={setSimulatedWeather}
                  currentSimulated={simulatedWeather}
                />
              </div>
            )}

            {/* Floating Map Canvas Sponsor Card */}
            <div className="absolute bottom-20 left-3 sm:left-4 z-[400] max-w-[240px] sm:max-w-xs drop-shadow-md">
              <AdBannerSlot placementLocation="map_overlay" variant="map_overlay" />
            </div>

            {/* Floating Overlapping Category Pills Card */}
            <div className="absolute -bottom-14 sm:-bottom-14 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-4xl px-0 sm:w-full sm:px-4 z-[400]">
              <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white/95 p-2 sm:p-4 shadow-xl backdrop-blur-md">
                {/* Category Pills Row */}
                <div className="flex flex-wrap items-center gap-1 pb-0.5 sm:gap-1.5">
                  <button
                    onClick={() => handleSelectCategory("")}
                    className={`flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      !selectedCategory
                        ? "bg-[#18181b] text-white shadow-xs"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>🌐</span>
                    <span>All Places</span>
                  </button>

                  {visibleCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const icon = getCategoryIcon(cat.name);

                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                          isSelected
                            ? "bg-[#18181b] text-white shadow-xs"
                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span>{icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                  {additionalCategories.length > 0 && (
                    <select
                      value={additionalCategories.some((cat) => cat.id === selectedCategory) ? selectedCategory : ""}
                      onChange={(event) => handleSelectCategory(event.target.value)}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-2xs outline-none cursor-pointer"
                    >
                      <option value="">More categories</option>
                      {additionalCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Dynamic Quick Area / City Jump Presets */}
                {topLocations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                    <span className="text-gray-400 font-semibold shrink-0">📍 Popular:</span>
                    {topLocations.map((locName) => {
                      const isSelected = selectedLocation.toLowerCase() === locName.toLowerCase();
                      return (
                        <button
                          key={locName}
                          onClick={() => handleSelectQuickLocation(locName)}
                          className={`shrink-0 rounded-lg px-2.5 py-0.5 font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-gray-950 text-white shadow-2xs font-bold"
                              : "bg-gray-100 hover:bg-gray-200 border border-gray-200/80 text-gray-700"
                          }`}
                        >
                          {locName}
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Results Header & 3-Column Places Grid Below Map */}
          <section className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 mt-20 sm:mt-24 pb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-950">
                    {filteredListings.length} Places Found
                  </h2>
                  {userLocation && (
                    <span className="rounded-full bg-cyan-50 border border-cyan-200/80 px-2.5 py-0.5 text-xs font-semibold text-cyan-700 flex items-center gap-1">
                      <span>📍</span> Zoomed to 5 km around you · Zoom out to explore further
                    </span>
                  )}
                  {(radiusKm !== null || featuredOnly || verifiedOnly || sortBy !== "default") && (
                    <button
                      onClick={() => {
                        setRadiusKm(null);
                        setFeaturedOnly(false);
                        setVerifiedOnly(false);
                        setSortBy("default");
                      }}
                      className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-200 cursor-pointer"
                    >
                      Reset Filters ✕
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Explore locations on the map above or browse details below.
                </p>
              </div>

              {/* View Switcher: Split View / Immersive Map / 3D Satellite / Fullscreen */}
              {renderViewSwitcher(viewMode)}
            </div>

            {renderResultsCategoryFilters()}

            {/* Toolbar: Sorting & Radius Filter & Verification Toggles */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 py-2 border-b border-gray-100/80 text-xs">
              {/* Radius Pills */}
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-sm">
                <span className="shrink-0 text-[11px] font-semibold text-gray-400">📍 Radius</span>
                <input
                  aria-label="Search radius in kilometres"
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={radiusKm ?? 25}
                  onChange={(event) => setRadiusKm(Number(event.target.value))}
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[var(--coral)]"
                />
                <span className="w-10 shrink-0 text-right text-[11px] font-bold text-gray-700">
                  {radiusKm === null ? "Any" : `${radiusKm} km`}
                </span>
                {radiusKm !== null && (
                  <button
                    type="button"
                    onClick={() => setRadiusKm(null)}
                    className="shrink-0 text-[11px] font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Right side: Sorting + Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Featured toggle */}
                <button
                  onClick={() => setFeaturedOnly(!featuredOnly)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    featuredOnly
                      ? "bg-amber-100 border border-amber-300 text-amber-900 font-bold"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <span>⭐</span>
                  <span>Featured</span>
                </button>

                {/* Verified toggle */}
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    verifiedOnly
                      ? "bg-cyan-100 border border-cyan-300 text-cyan-900 font-bold"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <span>✓</span>
                  <span>Verified</span>
                </button>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 font-semibold text-[11px]">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="default">Default (Featured)</option>
                    <option value="distance">Nearest First</option>
                    <option value="name">Name (A–Z)</option>
                    <option value="featured">Featured First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3-COLUMN CARDS GRID */}
            <div id="listings-grid-top" className="mt-5 sm:mt-6 scroll-mt-24">
              {paginatedListings.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {paginatedListings.map((place, index) => {
                      const isSelected = activePlaceId === place.id;
                      const catName = getDisplayCategory(place).toUpperCase();
                      const ratingInfo = getPlaceRating(place);

                      return (
                        <div key={place.id} className="contents">
                          {index === 2 && (
                            <AdBannerSlot
                              key={`grid_ad_p${currentPage}`}
                              placementLocation="in_feed"
                              variant="in_feed"
                              itemIndex={currentPage - 1}
                              categoryId={selectedCategory || null}
                            />
                          )}
                          <AirbnbListingCard
                            place={place}
                            isSelected={isSelected}
                            onHover={(id) => {
                              cardInteractionRef.current = true;
                              setActivePlaceId(id);
                            }}
                            onSelect={(id) => {
                              cardInteractionRef.current = true;
                              setActivePlaceId(id);
                            }}
                          />
                      </div>
                    );
                    })}
                  </div>

                  {/* Pagination Control Bar */}
                  {filteredListings.length > pageSize && (
                    <div className="mt-8 pt-4 flex justify-center">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredListings.length}
                        pageSize={pageSize}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <span className="text-3xl">🔍</span>
                  <h3 className="mt-3 font-serif text-lg font-bold text-gray-900">
                    No places found matching your search
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Try clearing the keyword filter or selecting another neighborhood.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("");
                      setSelectedLocation("");
                    }}
                    className="mt-4 rounded-full bg-gray-900 px-5 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* VIEW MODE 2: SPLIT VIEW */}
      {viewMode === "split" && (
        <>
          {/* SPLIT VIEW RESULTS */}
          <section className="mx-auto w-full max-w-[1440px] px-3 sm:px-6 pt-2.5 pb-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-slate-800/80 pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-lg sm:text-xl font-bold text-gray-950 dark:text-white">
                  {filteredListings.length} Places in {domain?.name || "India"}
                </h1>
                {userLocation && (
                  <span className="rounded-full bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200/80 dark:border-cyan-800 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                    <span>📍</span> 5 km radius
                  </span>
                )}
              </div>

              {renderViewSwitcher(viewMode)}
            </div>

            {/* TWO-COLUMN SPLIT: LEFT LISTINGS, RIGHT INTERACTIVE MAP */}
            <div className="mt-3.5 sm:mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT: LISTINGS COLUMN */}
              <div className={`lg:col-span-7 ${mobileShowMap ? "hidden lg:block" : "block"}`}>
                {paginatedListings.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {paginatedListings.map((place, index) => {
                        const isSelected = activePlaceId === place.id;
                        return (
                          <div key={place.id} className="contents">
                            {index === 2 && (
                              <div className="col-span-full">
                                <AdBannerSlot
                                  placementLocation="in_feed"
                                  variant="in_feed"
                                  itemIndex={currentPage - 1}
                                  categoryId={selectedCategory || null}
                                />
                              </div>
                            )}
                            <AirbnbListingCard
                              place={place}
                              isSelected={isSelected}
                              onHover={(id) => {
                                cardInteractionRef.current = true;
                                setActivePlaceId(id);
                              }}
                              onSelect={(id) => {
                                cardInteractionRef.current = true;
                                setActivePlaceId(id);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {filteredListings.length > pageSize && (
                      <div className="mt-8 flex justify-center">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={filteredListings.length}
                          pageSize={pageSize}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-4xl">🔍</span>
                    <h3 className="mt-3 font-serif text-lg font-bold text-slate-900 dark:text-white">
                      No places found in this view
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Try clearing filters or moving the map to another area.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-4 rounded-full bg-slate-950 dark:bg-white px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT: STICKY MAP CANVAS */}
              <div className={`lg:col-span-5 relative w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md ${
                mobileShowMap
                  ? "block h-[calc(100vh-180px)]"
                  : "hidden lg:block lg:sticky lg:top-[105px] lg:h-[calc(100vh-120px)]"
              }`}>
                <MapErrorBoundary fallbackText="Split map view encountered an issue. Click below to reload.">
                  <InteractiveLeafletCanvas
                    locatedListings={locatedListings}
                    activePlaceId={activePlaceId}
                    setActivePlaceId={setActivePlaceId}
                    userLocation={userLocation}
                    onLocateMe={handleLocateMe}
                    flyToUserTrigger={flyToUserTrigger}
                    onToggleFullscreen={handleToggleFullscreen}
                    isFullscreen={false}
                    weatherType={simulatedWeather || liveWeather?.weatherType}
                    searchQuery={searchQuery}
                    radiusKm={radiusKm ?? 5}
                    onSearchArea={handleSearchArea}
                    onMapClick={(loc) => {
                      setUserLocation(loc);
                      setFlyToUserTrigger((prev) => prev + 1);
                    }}
                  />
                </MapErrorBoundary>

                {/* Floating Map Canvas Sponsor Card */}
                <div className="absolute bottom-4 left-4 z-[400] max-w-[240px] sm:max-w-xs drop-shadow-md">
                  <AdBannerSlot placementLocation="map_overlay" variant="map_overlay" />
                </div>
              </div>
            </div>

            {/* Mobile Floating Map/List Pill */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[500]">
              <button
                type="button"
                onClick={() => setMobileShowMap((prev) => !prev)}
                className="flex items-center gap-2 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-5 py-3 text-xs font-bold shadow-2xl hover:scale-105 transition-all cursor-pointer"
              >
                <span>{mobileShowMap ? "📋" : "🗺️"}</span>
                <span>{mobileShowMap ? "Show List" : "Show Map"}</span>
              </button>
            </div>
          </section>
        </>
      )}

      {/* VIEW MODE 3: 100% FULL SCREEN MAP VIEW */}
      {viewMode === "fullscreen" && (
        <div className="relative h-[calc(100vh-105px)] sm:h-[calc(100vh-65px)] w-full flex overflow-hidden">
          {/* Full-width Map Canvas */}
          <main className="relative flex-1 h-full w-full bg-[#e8eef5]">
            <MapErrorBoundary fallbackText="Fullscreen map view encountered an issue. Click below to reload.">
              <InteractiveLeafletCanvas
                locatedListings={locatedListings}
                activePlaceId={activePlaceId}
                setActivePlaceId={handleSelectPlace}
                userLocation={userLocation}
                onLocateMe={handleLocateMe}
                flyToUserTrigger={flyToUserTrigger}
                onToggleFullscreen={handleToggleFullscreen}
                isFullscreen={true}
                weatherType={simulatedWeather || liveWeather?.weatherType}
                searchQuery={searchQuery}
                radiusKm={radiusKm ?? 5}
                onSearchArea={handleSearchArea}
                onMapClick={(loc) => {
                  setUserLocation(loc);
                  setFlyToUserTrigger((prev) => prev + 1);
                }}
              />
            </MapErrorBoundary>

            {/* Top-Left Floating Category Controls on Map */}
            <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto z-[400] max-w-[calc(100vw-1rem)] sm:max-w-xl">
              {/* Floating Category Pills on Map */}
              <div className="flex flex-wrap items-center gap-1 pb-1 max-w-full sm:gap-1.5">
                <button
                  onClick={() => handleSelectCategory("")}
                  className={`whitespace-nowrap rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold shadow-md transition-all cursor-pointer ${
                    !selectedCategory
                      ? "bg-[#18181b] text-white"
                      : "bg-white/95 text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  🌐 All Places
                </button>
                {visibleCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const icon = getCategoryIcon(cat.name);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`whitespace-nowrap rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold shadow-md transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#18181b] text-white"
                          : "bg-white/95 text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {icon} {cat.name}
                    </button>
                  );
                })}
                {additionalCategories.length > 0 && (
                  <select
                    value={additionalCategories.some((cat) => cat.id === selectedCategory) ? selectedCategory : ""}
                    onChange={(event) => handleSelectCategory(event.target.value)}
                    className="rounded-full border border-gray-200 bg-white/95 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-gray-700 shadow-md outline-none cursor-pointer"
                  >
                    <option value="">More categories</option>
                    {additionalCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Top-Right Drawer Toggle on Fullscreen Map (Desktop) */}
            <div className="absolute top-4 right-72 z-[400] hidden md:flex items-center gap-2">
              <button
                onClick={() => setIsFullscreenDrawerOpen(!isFullscreenDrawerOpen)}
                className="flex items-center gap-1.5 rounded-2xl border border-gray-200/90 bg-white/95 px-3.5 py-2 text-xs font-bold text-gray-800 shadow-xl backdrop-blur-md hover:bg-gray-50 transition-all cursor-pointer"
              >
                <span>📋</span>
                <span>{isFullscreenDrawerOpen ? "Hide List" : `Places (${filteredListings.length})`}</span>
              </button>
            </div>

            {/* Mobile Bottom Drawer Toggle Button */}
            <div className="absolute bottom-5 left-3 z-[400] md:hidden">
              <button
                onClick={() => setIsFullscreenDrawerOpen(!isFullscreenDrawerOpen)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200/90 bg-white/95 px-3.5 py-2 text-xs font-bold text-gray-800 shadow-xl backdrop-blur-md hover:bg-gray-50 transition-all cursor-pointer"
              >
                <span>📋</span>
                <span>{isFullscreenDrawerOpen ? "Hide List" : `Places (${filteredListings.length})`}</span>
              </button>
            </div>
          </main>

          {/* Collapsible Sliding Place Drawer on the Right */}
          {isFullscreenDrawerOpen && (
            <aside className="absolute inset-0 z-50 sm:relative sm:inset-auto sm:z-30 w-full sm:w-[420px] lg:w-[460px] h-full flex flex-col border-l border-gray-200 bg-white shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-gray-50/70">
                <div>
                  <h3 className="font-serif text-lg font-bold text-gray-950">
                    {filteredListings.length} Places Found
                  </h3>
                  <p className="text-xs text-gray-500">Coordinates on live map</p>
                </div>
                <button
                  onClick={() => setIsFullscreenDrawerOpen(false)}
                  className="rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {paginatedListings.map((place) => {
                  const isSelected = activePlaceId === place.id;
                  const catName = getDisplayCategory(place).toUpperCase();
                  const ratingInfo = getPlaceRating(place);

                  return (
                    <AirbnbListingCard
                      key={place.id}
                      place={place}
                      isSelected={isSelected}
                      onHover={(id) => {
                        cardInteractionRef.current = true;
                        setActivePlaceId(id);
                      }}
                      onSelect={(id) => {
                        cardInteractionRef.current = true;
                        setActivePlaceId(id);
                      }}
                    />
                  );
                })}

                {filteredListings.length > pageSize && (
                  <div className="pt-2">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredListings.length}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}

      {/* MOBILE DRAGGABLE BOTTOM SHEET (Phones & Small Tablets) */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-[500] bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 flex flex-col ${
          mobileSheetSnap === "peek"
            ? "h-[74px]"
            : mobileSheetSnap === "half"
            ? "h-[54vh]"
            : "h-[88vh]"
        }`}
      >
        {/* Drag Handle & Quick Stats Header */}
        <div
          onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (touchStartY === null) return;
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            if (diff > 40) {
              setMobileSheetSnap((prev) => (prev === "peek" ? "half" : "full"));
            } else if (diff < -40) {
              setMobileSheetSnap((prev) => (prev === "full" ? "half" : "peek"));
            }
            setTouchStartY(null);
          }}
          onClick={() => {
            setMobileSheetSnap((prev) => (prev === "peek" ? "half" : prev === "half" ? "full" : "peek"));
          }}
          className="pt-2.5 pb-2 px-4 cursor-pointer select-none shrink-0 border-b border-slate-100 dark:border-slate-800"
        >
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                📍 {filteredListings.length} Places Found
              </span>
              {selectedCategory && (
                <span className="rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 text-[10px] font-bold">
                  Filtered
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#06b6d4]">
              <span>{mobileSheetSnap === "full" ? "Slide Down ↓" : mobileSheetSnap === "half" ? "Expand ↑" : "Slide Up ↑"}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Listings Content in Mobile Sheet */}
        {mobileSheetSnap !== "peek" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 overscroll-contain">
            {filteredListings.slice(0, 16).map((place) => {
              const ratingInfo = getPlaceRating(place);
              const isSelected = activePlaceId === place.id;
              return (
                <article
                  key={`mobile-sheet-${place.id}`}
                  data-listing-id={place.id}
                  onClick={() => {
                    cardInteractionRef.current = true;
                    setActivePlaceId(place.id);
                    if (place.latitude && place.longitude) {
                      setUserLocation({ lat: place.latitude, lng: place.longitude });
                      setFlyToUserTrigger((prev) => prev + 1);
                    }
                  }}
                  className={`rounded-xl border p-3 bg-white dark:bg-slate-800 transition-all ${
                    isSelected
                      ? "border-[#06b6d4] bg-orange-50/20 ring-1 ring-[#06b6d4]"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded">
                      {place.category_name || "Place"}
                    </span>
                    <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      ★ {ratingInfo.rating.toFixed(1)}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">
                    <Link href={`/listing/${place.slug}`} onClick={(e) => e.stopPropagation()}>
                      {place.title}
                    </Link>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    📍 {place.locality || place.city || "Bangalore"}
                  </p>
                  <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700 text-[11px]">
                    {place.phone ? (
                      <a
                        href={`tel:${place.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-slate-700 dark:text-slate-300"
                      >
                        📞 Call
                      </a>
                    ) : <span />}
                    <Link
                      href={`/listing/${place.slug}`}
                      className="font-bold text-[#06b6d4]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      {viewMode !== "fullscreen" && (
        <footer className="mt-auto border-t border-gray-200 bg-white py-8">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 sm:flex-row text-xs text-gray-500">
            <Link href="/" className="font-serif text-xl font-bold tracking-tight text-gray-900">
              LocaToGo<span className="text-[#06b6d4]">.</span>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-gray-600">
              <Link href="/about" className="hover:text-gray-900 transition-colors">
                About
              </Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:text-gray-900 transition-colors">
                Contact Support
              </Link>
            </div>

            <p className="text-gray-400">
              © 2026 LocaToGo. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
