"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Pagination } from "@/components/ui/pagination";
import { generateUberRideLink, generateWhatsAppInquiryLink } from "@/lib/services/transit-links";
import { Google3DMap } from "@/components/google-3d-map";

// Dynamically import interactive Leaflet map canvas without SSR
const InteractiveLeafletCanvas = dynamic(
  () => import("@/components/interactive-leaflet-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#f0f4f8] text-xs font-semibold text-gray-500">
        <span className="animate-pulse">Loading Interactive Map & Coordinates...</span>
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
  if (lower.includes("restaurant") || lower.includes("cafe") || lower.includes("food") || lower.includes("dine")) return "🍽️";
  if (lower.includes("school") || lower.includes("education") || lower.includes("college") || lower.includes("academy")) return "🎓";
  if (lower.includes("hospital") || lower.includes("health") || lower.includes("clinic") || lower.includes("medical")) return "➕";
  if (lower.includes("art") || lower.includes("creative") || lower.includes("design") || lower.includes("culture")) return "🎨";
  if (lower.includes("retail") || lower.includes("shop") || lower.includes("store") || lower.includes("market")) return "🏬";
  if (lower.includes("tech") || lower.includes("cowork") || lower.includes("startup") || lower.includes("hub")) return "💻";
  if (lower.includes("petrol") || lower.includes("fuel") || lower.includes("bunk") || lower.includes("pump") || lower.includes("gas")) return "⛽";
  return "📍";
}

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
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  
  // Layout mode: "immersive" (Hero map + 3-col grid), "3d" (Google 3D Vector/Satellite + 3-col grid), "split" (Side-by-side), or "fullscreen" (100% full map viewport)
  const [viewMode, setViewMode] = useState<"immersive" | "3d" | "split" | "fullscreen">("immersive");
  const [isFullscreenDrawerOpen, setIsFullscreenDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = (viewMode === "immersive" || viewMode === "3d") ? 6 : 5;

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [flyToUserTrigger, setFlyToUserTrigger] = useState(0);
  const [locationErrorNotice, setLocationErrorNotice] = useState<string | null>(null);

  // Handle user clicking 'My Location' with automatic IP Geolocation fallback
  const handleLocateMe = useCallback(() => {
    setLocationErrorNotice(null);
    setIsLocating(true);

    const fallbackToIp = async (reason?: string) => {
      try {
        const res = await fetch("/api/geolocation");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.latitude && data.longitude) {
            const loc = { lat: data.latitude, lng: data.longitude };
            setUserLocation(loc);
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

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      fallbackToIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setIsLocating(false);
        setLocationErrorNotice(null);
        setFlyToUserTrigger((prev) => prev + 1);
      },
      (err) => {
        console.warn("Browser GPS failed or blocked (code " + err.code + "), falling back to network IP location...");
        fallbackToIp(
          err.code === 1
            ? "Browser/OS location was restricted. Positioned using your network area instead."
            : undefined
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
    );
  }, []);

  // Auto-detect user geolocation on initial mount (GPS first, then IP fallback)
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Silent fallback to IP on mount
          fetch("/api/geolocation")
            .then((r) => r.json())
            .then((data) => {
              if (data.success && data.latitude && data.longitude) {
                setUserLocation({ lat: data.latitude, lng: data.longitude });
              }
            })
            .catch(() => {});
        },
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
      );
    }
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLocation, viewMode]);

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
    const list = initialListings.filter((place) => {
      // 1. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = place.title.toLowerCase().includes(q);
        const matchesDesc = place.short_description?.toLowerCase().includes(q);
        const matchesLoc = place.locality?.toLowerCase().includes(q) || place.city?.toLowerCase().includes(q);
        const matchesCat = place.category_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesCat) return false;
      }

      // 2. Category Filter
      if (selectedCategory && place.category_id !== selectedCategory) {
        return false;
      }

      // 3. Location Filter
      if (selectedLocation) {
        const loc = selectedLocation.toLowerCase();
        const matchesLocality = place.locality?.toLowerCase().includes(loc);
        const matchesCity = place.city?.toLowerCase().includes(loc);
        if (!matchesLocality && !matchesCity) return false;
      }

      return true;
    });

    // Add distance if user location is known
    return list
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
      .sort((a, b) => {
        if (typeof a.distanceKm === "number" && typeof b.distanceKm === "number") {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
  }, [initialListings, searchQuery, selectedCategory, selectedLocation, userLocation]);

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
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              locatogo<span className="text-[#e26a4f]">.</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-50/60 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              <span className="text-sm">📍</span>
              <span>{domain?.name ? `${domain.name} Atlas` : "Global Atlas"}</span>
            </div>
          </div>

          {/* Center: Detect My Location */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-gray-950 transition-colors cursor-pointer"
            >
              <span className="text-[#e26a4f] text-sm">🎯</span>
              <span>{isLocating ? "Detecting Location..." : userLocation ? "Location Active (Nearby)" : "Detect My Location"}</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/submit"
              className="rounded-full sm:rounded-md bg-[#e26a4f] px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[#d8583c] hover:shadow-sm"
            >
              <span className="hidden sm:inline">+ ADD PLACE</span>
              <span className="sm:hidden inline">+ ADD</span>
            </Link>
            <Link
              href="/admin"
              className="hidden sm:inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

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
          {/* Top Interactive Hero Map with Floating Overlapping Search Card */}
          <div className="relative w-full h-[460px] sm:h-[500px] bg-[#e8eef5]">
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
              onMapClick={(loc) => {
                setUserLocation(loc);
                setFlyToUserTrigger((prev) => prev + 1);
              }}
            />

            {/* Floating Overlapping Search & Categories Card */}
            <div className="absolute -bottom-28 sm:-bottom-24 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-[400]">
              <div className="rounded-3xl border border-gray-100 bg-white/95 p-4 sm:p-6 shadow-xl backdrop-blur-md">
                {/* Search Bar + Neighborhood Dropdown */}
                <div className="flex flex-col sm:flex-row items-center rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xs focus-within:border-gray-400 transition-all">
                  <div className="relative flex-1 w-full flex items-center pl-3">
                    <span className="text-gray-400 text-sm">🔍</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name (e.g. Edify School, Narayana Hospital, Sparsh)..."
                      className="w-full bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="pr-3 text-xs text-gray-400 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-gray-200 pt-2 sm:pt-0 sm:pl-2">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full sm:w-auto rounded-xl bg-transparent px-4 py-2 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                    >
                      <option value="">All Neighborhoods</option>
                      {availableLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category Pills Row */}
                <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap sm:justify-center pb-1">
                  <button
                    onClick={() => handleSelectCategory("")}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
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
          <section className="mx-auto w-full max-w-[1400px] px-6 mt-32 sm:mt-28 pb-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-950">
                  {filteredListings.length} Places Found
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Explore locations on the map above or browse details below.
                </p>
              </div>

              {/* View Switcher: Split View / Immersive Map / 3D Satellite / Fullscreen */}
              {renderViewSwitcher(viewMode)}
            </div>

            {/* 3-COLUMN CARDS GRID */}
            <div className="mt-6">
              {paginatedListings.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginatedListings.map((place) => {
                      const isSelected = activePlaceId === place.id;
                      const catName = (place.category_name || "General").toUpperCase();

                      return (
                        <article
                          key={place.id}
                          onClick={() => setActivePlaceId(place.id)}
                          className={`group cursor-pointer rounded-2xl border bg-white p-5 transition-all duration-200 shadow-xs hover:shadow-md ${
                            isSelected
                              ? "border-[#e26a4f] ring-2 ring-[#e26a4f]/20 bg-orange-50/20"
                              : "border-gray-200/90 hover:border-gray-400"
                          }`}
                        >
                          {/* Top Badge Row */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded bg-blue-50/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                              {catName}
                            </span>

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
                                  className="rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-900 px-1.5 py-0.5 text-[10px] text-gray-500 font-medium cursor-pointer transition-colors"
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

                          {/* Title & Locality */}
                          <div className="mt-3">
                            <h3 className="font-serif text-xl font-bold text-gray-950 group-hover:text-[#e26a4f] transition-colors leading-snug">
                              <Link href={`/listing/${place.slug}`}>
                                {place.title}
                              </Link>
                            </h3>

                            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                              <span className="text-[#e26a4f]">📍</span>
                              <span>
                                {[place.locality, place.city].filter(Boolean).join(", ") || "Verified Location"}
                              </span>
                            </p>
                          </div>

                          {/* Description */}
                          {place.short_description && (
                            <p className="mt-2.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {place.short_description}
                            </p>
                          )}

                          {/* Card Action Footer */}
                          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3.5 text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
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
                              {place.website && (
                                <a
                                  href={place.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <span>🌐</span>
                                  <span>Web</span>
                                </a>
                              )}
                            </div>

                            <Link
                              href={`/listing/${place.slug}`}
                              className="font-bold text-xs text-[#e26a4f] hover:underline flex items-center gap-1 shrink-0"
                            >
                              <span>Details</span>
                              <span>→</span>
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {filteredListings.length > pageSize && (
                    <div className="mt-8 pt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredListings.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
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

      {/* VIEW MODE 2: SPLIT VIEW (Screen: a0e8ce36fb92445f8f631c1494a3f4f7) */}
      {viewMode === "split" && (
        <>
          {/* HERO SECTION WITH SEARCH & CATEGORY PILLS */}
          <section className="bg-white px-6 py-10 sm:py-14">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e26a4f]">
                EXPLORE & DISCOVER
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl lg:text-[54px] leading-tight">
                Find Places, Schools, Hospitals & Venues
              </h1>
              <p className="mt-3 text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
                Global interactive map directory with verified GPS coordinates, operating hours, and direct routes.
              </p>

              {/* Search Box with Integrated Location Dropdown */}
              <div className="mt-8 flex flex-col sm:flex-row items-center rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xs focus-within:border-gray-400 transition-all">
                <div className="relative flex-1 w-full flex items-center pl-3">
                  <span className="text-gray-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name (e.g. Edify School, Narayana Hospital, Sparsh).."
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="pr-3 text-xs text-gray-400 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-gray-200 pt-2 sm:pt-0 sm:pl-2">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full sm:w-auto rounded-xl bg-transparent px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">All Neighborhoods</option>
                    {availableLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Filter Chips Row */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => handleSelectCategory("")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
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
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
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
          <section className="mx-auto w-full max-w-[1400px] px-6 pt-2 pb-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-950">
                  {filteredListings.length} Places Found
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing matching locations on the interactive map with coordinates.
                </p>
              </div>

              {/* View Switcher Controls */}
              {renderViewSwitcher(viewMode)}
            </div>

            {/* MAIN RESULTS DISPLAY: CARDS + MAP */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr] min-h-[640px]">
              {/* LEFT: PLACE CARDS */}
              <div className="flex flex-col space-y-4">
                {paginatedListings.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1">
                    {paginatedListings.map((place) => {
                      const isSelected = activePlaceId === place.id;
                      const catName = (place.category_name || "General").toUpperCase();

                      return (
                        <article
                          key={place.id}
                          onClick={() => setActivePlaceId(place.id)}
                          className={`group cursor-pointer rounded-2xl border bg-white p-5 transition-all duration-200 shadow-xs hover:shadow-md ${
                            isSelected
                              ? "border-[#e26a4f] ring-2 ring-[#e26a4f]/20 bg-orange-50/20"
                              : "border-gray-200/90 hover:border-gray-400"
                          }`}
                        >
                          {/* Top Badge Row */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded bg-blue-50/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                              {catName}
                            </span>

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
                                  className="rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-900 px-1.5 py-0.5 text-[10px] text-gray-500 font-medium cursor-pointer transition-colors"
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

                          {/* Title & Locality */}
                          <div className="mt-3">
                            <h3 className="font-serif text-xl font-bold text-gray-950 group-hover:text-[#e26a4f] transition-colors leading-snug">
                              <Link href={`/listing/${place.slug}`}>
                                {place.title}
                              </Link>
                            </h3>

                            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                              <span className="text-[#e26a4f]">📍</span>
                              <span>
                                {[place.locality, place.city].filter(Boolean).join(", ") || "Verified Location"}
                              </span>
                            </p>
                          </div>

                          {/* Description */}
                          {place.short_description && (
                            <p className="mt-2.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {place.short_description}
                            </p>
                          )}

                          {/* Card Action Footer */}
                          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3.5 text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
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
                              {place.website && (
                                <a
                                  href={place.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <span>🌐</span>
                                  <span>Web</span>
                                </a>
                              )}
                            </div>

                            <Link
                              href={`/listing/${place.slug}`}
                              className="font-bold text-xs text-[#e26a4f] hover:underline flex items-center gap-1 shrink-0"
                            >
                              <span>Details</span>
                              <span>→</span>
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
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

                {/* Pagination Controls */}
                {filteredListings.length > pageSize && (
                  <div className="mt-2 pt-2">
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

              {/* RIGHT: MAP CANVAS */}
              <div className="relative h-[560px] lg:h-full min-h-[500px] w-full overflow-hidden rounded-2xl border border-gray-200 shadow-xs">
                <InteractiveLeafletCanvas
                  locatedListings={locatedListings}
                  activePlaceId={activePlaceId}
                  setActivePlaceId={setActivePlaceId}
                  userLocation={userLocation}
                  onLocateMe={handleLocateMe}
                  flyToUserTrigger={flyToUserTrigger}
                  onToggleFullscreen={handleToggleFullscreen}
                  isFullscreen={false}
                  onMapClick={(loc) => {
                    setUserLocation(loc);
                    setFlyToUserTrigger((prev) => prev + 1);
                  }}
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* VIEW MODE 3: 100% FULL SCREEN MAP VIEW */}
      {viewMode === "fullscreen" && (
        <div className="relative h-[calc(100vh-65px)] w-full flex overflow-hidden">
          {/* Full-width Map Canvas */}
          <main className="relative flex-1 h-full w-full bg-[#e8eef5]">
            <InteractiveLeafletCanvas
              locatedListings={locatedListings}
              activePlaceId={activePlaceId}
              setActivePlaceId={handleSelectPlace}
              userLocation={userLocation}
              onLocateMe={handleLocateMe}
              flyToUserTrigger={flyToUserTrigger}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={true}
              onMapClick={(loc) => {
                setUserLocation(loc);
                setFlyToUserTrigger((prev) => prev + 1);
              }}
            />

            {/* Top-Left Floating Unified Search & Category Controls on Map */}
            <div className="absolute top-4 left-4 z-[400] max-w-[calc(100vw-32px)] sm:max-w-xl space-y-2">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
                <div className="relative flex-1 flex items-center pl-3">
                  <span className="text-gray-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim()) setIsFullscreenDrawerOpen(true);
                    }}
                    placeholder="Search places by name, category or city..."
                    className="w-full bg-transparent px-2.5 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="pr-2 text-xs text-gray-400 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Locations</option>
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floating Category Pills on Map */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
                <button
                  onClick={() => handleSelectCategory("")}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold shadow-md transition-all cursor-pointer ${
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
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold shadow-md transition-all cursor-pointer ${
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

            {/* Top-Right Drawer Toggle on Fullscreen Map */}
            <div className="absolute top-4 right-72 z-[400] hidden md:flex items-center gap-2">
              <button
                onClick={() => setIsFullscreenDrawerOpen(!isFullscreenDrawerOpen)}
                className="flex items-center gap-1.5 rounded-2xl border border-gray-200/90 bg-white/95 px-3.5 py-2 text-xs font-bold text-gray-800 shadow-xl backdrop-blur-md hover:bg-gray-50 transition-all cursor-pointer"
              >
                <span>📋</span>
                <span>{isFullscreenDrawerOpen ? "Hide List" : `Places (${filteredListings.length})`}</span>
              </button>
            </div>
          </main>

          {/* Collapsible Sliding Place Drawer on the Right */}
          {isFullscreenDrawerOpen && (
            <aside className="z-30 w-full sm:w-[420px] lg:w-[460px] h-full flex flex-col border-l border-gray-200 bg-white shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-gray-50/70">
                <div>
                  <h3 className="font-serif text-lg font-bold text-gray-950">
                    {filteredListings.length} Places Found
                  </h3>
                  <p className="text-xs text-gray-500">Coordinates on live map</p>
                </div>
                <button
                  onClick={() => setIsFullscreenDrawerOpen(false)}
                  className="rounded-full bg-white border border-gray-200 p-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {paginatedListings.map((place) => {
                  const isSelected = activePlaceId === place.id;
                  const catName = (place.category_name || "General").toUpperCase();

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
                        <span className="rounded bg-blue-50/90 px-2 py-0.5 text-[9px] font-bold tracking-wider text-blue-800 uppercase">
                          {catName}
                        </span>
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
                      <p className="text-xs text-gray-500 mt-0.5">
                        📍 {[place.locality, place.city].filter(Boolean).join(", ")}
                      </p>

                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs">
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
