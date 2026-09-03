"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useCallback } from "react";
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

// Dynamically import interactive Leaflet map canvas without SSR
const InteractiveLeafletCanvas = dynamic(
  () => import("@/components/interactive-leaflet-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-500 overflow-hidden">
        <div className="absolute h-32 w-32 rounded-full bg-indigo-500/10 animate-ping" />
        <div className="absolute h-20 w-20 rounded-full bg-indigo-500/20 animate-pulse" />
        <div className="relative flex flex-col items-center gap-2 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xl animate-bounce">📍</span>
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
            Loading Interactive Atlas...
          </span>
        </div>
      </div>
    ),
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

export function ModernDirectoryExplorer({
  domain,
  initialListings,
  categories,
  availableLocations,
  initialCategory = "",
  initialLocation = "",
  initialQuery = "",
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

  const [selectedCategory, setSelectedCategory] = useState(resolvedInitialCat);
  const [selectedAmenity, setSelectedAmenity] = useState<string>("");
  const [mobileSheetSnap, setMobileSheetSnap] = useState<"peek" | "half" | "full">("peek");
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "distance" | "name" | "featured">("default");
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  // Layout mode: "immersive" (Hero map + 3-col grid), "3d" (Google 3D Vector/Satellite + 3-col grid), "split" (Side-by-side), or "fullscreen" (100% full map viewport)
  const [viewMode, setViewMode] = useState<"immersive" | "3d" | "split" | "fullscreen">("immersive");
  const [isFullscreenDrawerOpen, setIsFullscreenDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // 5 place listings + 1 in-feed ad = exactly 6 cards (2 complete 3-column rows) on every page
  const pageSize = 5;

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

  // Progressive background streaming: Loads remaining places smoothly without blocking main thread
  useEffect(() => {
    let isCancelled = false;

    async function streamMoreListings() {
      for (let page = 1; page < 8; page++) {
        if (isCancelled) break;
        try {
          const url = domain?.id
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

    const fallbackToIp = async () => {
      try {
        const res = await fetch("/api/geolocation");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.latitude && data.longitude) {
            setUserLocation({ lat: data.latitude, lng: data.longitude });
            setIsLocating(false);
            setLocationErrorNotice(null);
            setFlyToUserTrigger((prev) => prev + 1);
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
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
          setLocationErrorNotice(null);
          setFlyToUserTrigger((prev) => prev + 1);
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
  }, []);

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
    const list = allListings.filter((place) => {
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

      // 6. Amenity Filter
      if (selectedAmenity) {
        const amenityObj = AMENITIES_LIST.find((a) => a.id === selectedAmenity);
        if (amenityObj) {
          const textToSearch = `${place.title} ${place.short_description || ""} ${place.category_name || ""}`.toLowerCase();
          const hasAmenity = amenityObj.keywords.some((kw) => textToSearch.includes(kw));
          if (!hasAmenity) return false;
        }
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
  }, [allListings, searchQuery, selectedCategory, selectedLocation, userLocation, radiusKm, sortBy, featuredOnly, verifiedOnly]);

  const locatedListings = useMemo(
    () =>
      filteredListings.filter(
        (p): p is PlaceListing & { latitude: number; longitude: number } =>
          p.latitude !== null && p.longitude !== null
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
    if (availableLocations && availableLocations.length > 0) {
      return availableLocations.slice(0, 10);
    }
    const unique = Array.from(
      new Set(
        initialListings
          .map((l) => l.locality || l.city)
          .filter((loc): loc is string => typeof loc === "string" && loc.trim().length > 0)
      )
    );
    return unique.slice(0, 10);
  }, [availableLocations, initialListings]);

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

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans antialiased text-[#111827]">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] sticky top-0 z-[1000] shadow-2xs">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 gap-3">
          {/* Logo & Dual Atlas Switcher */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group" title="locatogo">
              <BrandLogo size={32} className="group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                locatogo<span className="text-[#e26a4f]">.</span>
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
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
              >
                <span>💼</span>
                <span className="hidden md:inline">Tech Atlas</span>
                <span className="md:hidden">Tech</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              </Link>
            </div>
          </div>

          {/* Desktop Center: Search Bar + Neighborhood Dropdown */}
          <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-2">
            <div className="w-full flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-3.5 py-1.5 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-md transition-all">
              <span className="text-slate-400 text-xs mr-2 shrink-0">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places, restaurants, hospitals..."
                className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 pr-1.5 cursor-pointer shrink-0"
                >
                  ✕
                </button>
              )}

              {/* Neighborhood Selector in Top Navbar */}
              <div className="border-l border-slate-200 dark:border-slate-700 pl-2 shrink-0">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="rounded-lg bg-transparent px-1.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="">All Areas</option>
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Link
              href="/submit"
              title="Add a New Place"
              className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#e26a4f] to-[#d8583c] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow-md hover:scale-[1.02] transition-all"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span className="hidden sm:inline">Add Place</span>
            </Link>
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </div>

        {/* Dedicated Mobile Search & Neighborhood Bar */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800/60 px-3 py-1.5 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 shadow-2xs">
            <div className="relative flex-1 flex items-center min-w-0">
              <span className="text-slate-400 text-xs mr-1.5 shrink-0">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 pr-1 cursor-pointer shrink-0"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="border-l border-slate-200 dark:border-slate-700 pl-1.5 shrink-0">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="rounded-lg bg-transparent px-1 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer max-w-[105px] truncate"
              >
                <option value="">All Areas</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Top Flash Announcement Ad Banner Placement */}
      <AdBannerSlot slotType="flash_banner" variant="flash" />

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
          <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] bg-[#e8eef5]">
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
            <div className="absolute -bottom-14 sm:-bottom-14 left-1/2 -translate-x-1/2 w-full max-w-4xl px-3 sm:px-4 z-[400]">
              <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white/95 p-2.5 sm:p-4 shadow-xl backdrop-blur-md">
                {/* Category Pills Row */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
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

                  {categories.map((cat) => {
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

                {/* Amenity Filter Chips Row */}
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                  <span className="text-gray-400 font-semibold shrink-0">✨ Amenities:</span>
                  {AMENITIES_LIST.map((amenity) => {
                    const isSelected = selectedAmenity === amenity.id;
                    return (
                      <button
                        key={amenity.id}
                        onClick={() => setSelectedAmenity(isSelected ? "" : amenity.id)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-0.5 font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-2xs font-bold"
                            : "bg-gray-100 hover:bg-gray-200 border border-gray-200/80 text-gray-700"
                        }`}
                      >
                        <span>{amenity.icon}</span>
                        <span>{amenity.label}</span>
                      </button>
                    );
                  })}
                  {selectedAmenity && (
                    <button
                      onClick={() => setSelectedAmenity("")}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-1.5 py-0.5 cursor-pointer shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results Header & 3-Column Places Grid Below Map */}
          <section className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 mt-20 sm:mt-24 pb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-950">
                    {filteredListings.length} Places Found
                  </h2>
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

            {/* Toolbar: Sorting & Radius Filter & Verification Toggles */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 py-2 border-b border-gray-100/80 text-xs">
              {/* Radius Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-gray-400 font-semibold text-[11px] shrink-0">📍 Radius:</span>
                {[
                  { label: "Any", val: null },
                  { label: "1 km", val: 1 },
                  { label: "3 km", val: 3 },
                  { label: "5 km", val: 5 },
                  { label: "10 km", val: 10 },
                  { label: "25 km", val: 25 },
                ].map((r) => {
                  const isSelected = radiusKm === r.val;
                  return (
                    <button
                      key={r.label}
                      onClick={() => setRadiusKm(r.val)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? "bg-[var(--coral)] text-white shadow-2xs font-bold"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
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
                      ? "bg-blue-100 border border-blue-300 text-blue-900 font-bold"
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
                      const catName = (place.category_name || "General").toUpperCase();
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
                          <article
                            onClick={() => setActivePlaceId(place.id)}
                          className={`group cursor-pointer rounded-2xl border bg-white p-4 sm:p-5 transition-all duration-200 shadow-xs hover:shadow-md ${
                            isSelected
                              ? "border-[#e26a4f] ring-2 ring-[#e26a4f]/20 bg-orange-50/20"
                              : "border-gray-200/90 hover:border-gray-400"
                          }`}
                        >
                          {/* Top Badge Row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="rounded bg-blue-50/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                                {catName}
                              </span>
                              <span className="rounded bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 flex items-center gap-1 shadow-2xs">
                                <span className="text-amber-500">★</span>
                                <span>{ratingInfo.rating.toFixed(1)}</span>
                                <span className="text-[9px] text-amber-700/80">({ratingInfo.reviewCount})</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {place.distanceKm !== null && place.distanceKm !== undefined ? (
                                <span className="rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 flex items-center gap-1 shadow-2xs">
                                  <span>🚗</span>
                                  <span>{place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)}m` : `${place.distanceKm.toFixed(1)} km`}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLocateMe();
                                  }}
                                  className="rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-900 px-2 py-0.5 text-[10px] text-gray-500 font-medium cursor-pointer transition-colors"
                                >
                                  📍 Distance
                                </button>
                              )}
                              {place.is_featured && (
                                <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#e26a4f] uppercase flex items-center gap-1">
                                  <span>☆</span>
                                  <span>FEATURED</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Place Title + Brand Avatar */}
                          <div className="flex items-center gap-3 mt-3">
                            <CompanyBrandAvatar title={place.title} website={place.website} size={38} />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-serif text-base sm:text-lg font-bold text-gray-950 group-hover:text-[#e26a4f] transition-colors truncate">
                                <Link href={`/listing/${place.slug}`}>{place.title}</Link>
                              </h3>
                              {/* Rating Stars Line */}
                              <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                                <span className="text-amber-500 text-xs tracking-tight">{ratingInfo.starsText}</span>
                                <span className="text-xs font-bold text-gray-800">{ratingInfo.rating.toFixed(1)}</span>
                                <span className="text-[11px] text-gray-500 font-medium">({ratingInfo.reviewCount} verified ratings)</span>
                              </div>
                            </div>
                          </div>

                          {/* Address & Locality */}
                          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1 line-clamp-1">
                            <span className="text-[#e26a4f]">📍</span>
                            <span>{[place.locality, place.city].filter(Boolean).join(", ") || "Verified Location"}</span>
                          </p>

                          {/* Short Description */}
                          {place.short_description && (
                            <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {place.short_description}
                            </p>
                          )}

                          {/* Tech Park / SEZ Campus Badge & Cross-Atlas Link */}
                          {(place.category_name?.toLowerCase().includes("tech park") ||
                            place.title.toLowerCase().includes("tech park") ||
                            place.title.toLowerCase().includes("business park") ||
                            place.title.toLowerCase().includes("sez")) && (
                            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 px-2.5 py-1.5 text-[11px]">
                              <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                                <span>🏢</span>
                                <span>Tech Campus</span>
                              </div>
                              <Link
                                href={`/tech-atlas?q=${encodeURIComponent(place.title.split(" ")[0])}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                <span>Explore Tech MNCs</span>
                                <span>↗</span>
                              </Link>
                            </div>
                          )}

                          {/* Coworking Space Badge */}
                          {(place.category_name?.toLowerCase().includes("cowork") ||
                            place.title.toLowerCase().includes("wework") ||
                            place.title.toLowerCase().includes("91springboard") ||
                            place.title.toLowerCase().includes("innov8") ||
                            place.title.toLowerCase().includes("indiqube") ||
                            place.title.toLowerCase().includes("bhive") ||
                            place.title.toLowerCase().includes("cowrks") ||
                            place.title.toLowerCase().includes("awfis")) && (
                            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-1.5 text-[11px]">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                                <span>💻</span>
                                <span>Coworking Hub</span>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                Hot Desks & Cabins
                              </span>
                            </div>
                          )}

                          {/* Action Bar with Uber, WhatsApp & View */}
                          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              {place.phone && (
                                <a
                                  href={generateWhatsAppInquiryLink(place.phone, place.title, place.category_name) || `tel:${place.phone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                                >
                                  <span>💬</span>
                                  <span>WA</span>
                                </a>
                              )}
                              {place.latitude && place.longitude && (
                                <a
                                  href={generateUberRideLink(place.latitude, place.longitude, place.title, place.locality)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 rounded-full border border-gray-900 bg-black px-2.5 py-1 text-[11px] font-bold text-white hover:bg-gray-800 transition-colors shadow-2xs"
                                >
                                  <span>🚕</span>
                                  <span>Uber</span>
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div onClick={(e) => e.stopPropagation()}>
                                <FavoriteButton listingId={place.id} className="py-1! px-2! text-xs!" />
                              </div>
                              <Link
                                href={`/listing/${place.slug}`}
                                className="font-bold text-xs text-[#e26a4f] hover:underline flex items-center gap-1 shrink-0"
                              >
                                <span>Details</span>
                                <span>→</span>
                              </Link>
                            </div>
                          </div>
                        </article>
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
          {/* HERO SECTION WITH CATEGORY PILLS */}
          <section className="bg-white px-4 sm:px-6 py-6 sm:py-10">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#e26a4f]">
                EXPLORE & DISCOVER
              </p>
              <h1 className="mt-2 font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-950 leading-tight">
                Find Places, Schools, Hospitals & Venues
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
                Global interactive map directory with verified GPS coordinates, operating hours, and direct routes.
              </p>

              {/* Category Filter Chips Row */}
              <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
                <button
                  onClick={() => handleSelectCategory("")}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold transition-all cursor-pointer ${
                    !selectedCategory
                      ? "bg-[#18181b] text-white shadow-xs"
                      : "border border-gray-200/90 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <span>🌐</span>
                  <span>All Places</span>
                </button>

                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const icon = getCategoryIcon(cat.name);

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#18181b] text-white shadow-xs"
                          : "border border-gray-200/90 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <span>{icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SPLIT VIEW RESULTS */}
          <section className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 pt-2 pb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-950">
                  {filteredListings.length} Places Found
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing matching locations on the interactive map with coordinates.
                </p>
              </div>

              {renderViewSwitcher(viewMode)}
            </div>

            {/* TWO-COLUMN SPLIT: LEFT LISTINGS, RIGHT INTERACTIVE MAP */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: LISTINGS COLUMN */}
              <div className="lg:col-span-6 space-y-4">
                {paginatedListings.length > 0 ? (
<>
                    <div className="space-y-3.5">
                      {paginatedListings.map((place, index) => {
                        const isSelected = activePlaceId === place.id;
                        const catName = (place.category_name || "General").toUpperCase();
                        const ratingInfo = getPlaceRating(place);

                        return (
                          <div key={place.id} className="space-y-3.5">
                            {index === 2 && (
                              <AdBannerSlot
                                placementLocation="in_feed"
                                variant="in_feed"
                                itemIndex={currentPage - 1}
                                categoryId={selectedCategory || null}
                                className="mb-3.5"
                              />
                            )}
                            <article
                              onClick={() => setActivePlaceId(place.id)}
                            className={`group cursor-pointer rounded-2xl border bg-white p-4 sm:p-5 transition-all duration-200 shadow-xs hover:shadow-md ${
                              isSelected
                                ? "border-[#e26a4f] ring-2 ring-[#e26a4f]/20 bg-orange-50/20"
                                : "border-gray-200/90 hover:border-gray-400"
                            }`}
                          >
                            {/* Top Badge Row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="rounded bg-blue-50/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                                  {catName}
                                </span>
                                <span className="rounded bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 flex items-center gap-1 shadow-2xs">
                                  <span className="text-amber-500">★</span>
                                  <span>{ratingInfo.rating.toFixed(1)}</span>
                                  <span className="text-[9px] text-amber-700/80">({ratingInfo.reviewCount})</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {place.distanceKm !== null && place.distanceKm !== undefined ? (
                                  <span className="rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 flex items-center gap-1 shadow-2xs">
                                    <span>🚗</span>
                                    <span>{place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)}m` : `${place.distanceKm.toFixed(1)} km`}</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLocateMe();
                                    }}
                                    className="rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-900 px-2 py-0.5 text-[10px] text-gray-500 font-medium cursor-pointer transition-colors"
                                  >
                                    📍 Distance
                                  </button>
                                )}
                              {place.is_featured && (
                                <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#e26a4f] uppercase flex items-center gap-1">
                                  <span>☆</span>
                                  <span>FEATURED</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Place Title */}
                          <h3 className="font-serif text-lg font-bold text-gray-950 group-hover:text-[#e26a4f] transition-colors mt-3">
                            <Link href={`/listing/${place.slug}`}>{place.title}</Link>
                          </h3>

                          {/* Rating Stars Line */}
                          <div className="mt-1 flex items-center gap-1.5 text-xs">
                            <span className="text-amber-500 text-xs tracking-tight">{ratingInfo.starsText}</span>
                            <span className="text-xs font-bold text-gray-800">{ratingInfo.rating.toFixed(1)}</span>
                            <span className="text-[11px] text-gray-500 font-medium">({ratingInfo.reviewCount} verified ratings)</span>
                          </div>

                          {/* Address & Locality */}
                          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1 line-clamp-1">
                            <span className="text-[#e26a4f]">📍</span>
                            <span>{[place.locality, place.city].filter(Boolean).join(", ") || "Verified Location"}</span>
                          </p>

                          {place.short_description && (
                            <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {place.short_description}
                            </p>
                          )}

                          <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              {place.phone && (
                                <a
                                  href={generateWhatsAppInquiryLink(place.phone, place.title, place.category_name) || `tel:${place.phone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                                >
                                  <span>💬</span>
                                  <span>WA</span>
                                </a>
                              )}
                              {place.latitude && place.longitude && (
                                <a
                                  href={generateUberRideLink(place.latitude, place.longitude, place.title, place.locality)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 rounded-full border border-gray-900 bg-black px-2.5 py-1 text-[11px] font-bold text-white hover:bg-gray-800 transition-colors shadow-2xs"
                                >
                                  <span>🚕</span>
                                  <span>Uber</span>
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div onClick={(e) => e.stopPropagation()}>
                                <FavoriteButton listingId={place.id} className="py-1! px-2! text-xs!" />
                              </div>
                              <Link
                                href={`/listing/${place.slug}`}
                                className="font-bold text-xs text-[#e26a4f] hover:underline flex items-center gap-1 shrink-0"
                              >
                                <span>Details</span>
                                <span>→</span>
                              </Link>
                            </div>
                          </div>
                        </article>
                      </div>
                    );
                    })}
                  </div>

                  {/* Pagination */}
                  {filteredListings.length > pageSize && (
                    <div className="mt-6 flex justify-center">
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
                  <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                    <span className="text-3xl">🔍</span>
                    <h3 className="mt-3 font-serif text-lg font-bold text-gray-900">
                      No places found
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Try clearing the filters or searching another area.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("");
                        setSelectedLocation("");
                      }}
                      className="mt-4 rounded-full bg-gray-900 px-5 py-2 text-xs font-bold text-white cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT: MAP CANVAS */}
              <div className="lg:col-span-6 relative h-[380px] sm:h-[500px] lg:h-[650px] w-full overflow-hidden rounded-2xl border border-gray-200 shadow-xs lg:sticky lg:top-24">
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
                onMapClick={(loc) => {
                  setUserLocation(loc);
                  setFlyToUserTrigger((prev) => prev + 1);
                }}
              />
            </MapErrorBoundary>

            {/* Top-Left Floating Category Controls on Map */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-[400] max-w-[calc(100vw-190px)] sm:max-w-xl">
              {/* Floating Category Pills on Map */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 no-scrollbar max-w-full">
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
                {categories.map((cat) => {
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
                  const catName = (place.category_name || "General").toUpperCase();
                  const ratingInfo = getPlaceRating(place);

                  return (
                    <article
                      key={place.id}
                      onClick={() => setActivePlaceId(place.id)}
                      className={`group cursor-pointer rounded-2xl border bg-white p-4 transition-all duration-200 shadow-xs hover:shadow-md ${
                        isSelected
                          ? "border-[#e26a4f] ring-2 ring-[#e26a4f]/20 bg-orange-50/20"
                          : "border-gray-200/90 hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded bg-blue-50/90 px-2 py-0.5 text-[9px] font-bold tracking-wider text-blue-800 uppercase">
                            {catName}
                          </span>
                          <span className="rounded bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 flex items-center gap-0.5 shadow-2xs">
                            <span className="text-amber-500">★</span>
                            <span>{ratingInfo.rating.toFixed(1)}</span>
                          </span>
                        </div>

                        {place.distanceKm !== null && place.distanceKm !== undefined ? (
                          <span className="rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1 shadow-2xs">
                            <span>🚗</span>
                            <span>{place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)}m` : `${place.distanceKm.toFixed(1)} km`}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLocateMe();
                            }}
                            className="rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-900 px-1.5 py-0.5 text-[9px] text-gray-500 font-medium cursor-pointer transition-colors"
                          >
                            📍 Distance
                          </button>
                        )}
                      </div>

                      <h4 className="font-serif text-base font-bold text-gray-950 group-hover:text-[#e26a4f] transition-colors mt-2">
                        <Link href={`/listing/${place.slug}`}>{place.title}</Link>
                      </h4>

                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <span className="text-amber-500 text-xs tracking-tight">{ratingInfo.starsText}</span>
                        <span className="text-[11px] font-bold text-gray-800">{ratingInfo.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-500 font-medium">({ratingInfo.reviewCount} reviews)</span>
                      </div>

                      <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-[#e26a4f]">📍</span>
                        <span>{place.locality || place.city || "Bangalore, India"}</span>
                      </p>

                      {place.short_description && (
                        <p className="mt-1.5 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {place.short_description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
                        <div className="flex items-center gap-2">
                          {place.phone && (
                            <a
                              href={`tel:${place.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-gray-700"
                            >
                              📞 Call
                            </a>
                          )}
                          {place.latitude && place.longitude && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-gray-700"
                            >
                              🧭 Route
                            </a>
                          )}
                        </div>
                        <Link href={`/listing/${place.slug}`} className="font-bold text-xs text-[#e26a4f] hover:underline">
                          Details →
                        </Link>
                      </div>
                    </article>
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
                <span className="rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold">
                  Filtered
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#e26a4f]">
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
                  onClick={() => {
                    setActivePlaceId(place.id);
                    if (place.latitude && place.longitude) {
                      setUserLocation({ lat: place.latitude, lng: place.longitude });
                      setFlyToUserTrigger((prev) => prev + 1);
                    }
                  }}
                  className={`rounded-xl border p-3 bg-white dark:bg-slate-800 transition-all ${
                    isSelected
                      ? "border-[#e26a4f] bg-orange-50/20 ring-1 ring-[#e26a4f]"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
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
                      className="font-bold text-[#e26a4f]"
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
              locatogo<span className="text-[#e26a4f]">.</span>
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
              © 2026 locatogo. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
