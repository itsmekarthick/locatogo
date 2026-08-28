"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Pagination } from "@/components/ui/pagination";

// Dynamically import interactive Leaflet map canvas without SSR
const InteractiveLeafletCanvas = dynamic(
  () => import("@/components/interactive-leaflet-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#f4efe8] text-xs font-semibold text-[var(--ink-muted)]">
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

const PAGE_SIZE = 6;

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
  
  // Default: FULL SCREEN MAP (drawer opens when a category/filter/marker is selected)
  const [isPanelOpen, setIsPanelOpen] = useState(Boolean(initialCategory || initialQuery || initialLocation));
  const [currentPage, setCurrentPage] = useState(1);

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [flyToUserTrigger, setFlyToUserTrigger] = useState(0);

  // Auto-detect user current location on mount
  const handleLocateMe = useCallback(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setIsLocating(false);
          setFlyToUserTrigger((prev) => prev + 1);
        },
        (err) => {
          console.log("Geolocation permission skipped or unavailable:", err.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  useEffect(() => {
    handleLocateMe();
  }, [handleLocateMe]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLocation]);

  // Category select handler: selects category AND opens the drawer
  const handleSelectCategory = (catId: string) => {
    if (selectedCategory === catId) {
      setSelectedCategory("");
    } else {
      setSelectedCategory(catId);
      setIsPanelOpen(true); // Open drawer on selection
    }
  };

  // Marker click handler: selects place AND opens the drawer
  const handleSelectPlace = (id: string | null) => {
    setActivePlaceId(id);
    if (id) {
      setIsPanelOpen(true);
    }
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

  // Helper for category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialListings.forEach((place) => {
      if (place.category_id) {
        counts[place.category_id] = (counts[place.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [initialListings]);

  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.id === selectedCategory),
    [categories, selectedCategory]
  );

  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE) || 1;
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredListings.slice(start, start + PAGE_SIZE);
  }, [filteredListings, currentPage]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[var(--background)] font-sans antialiased text-[var(--foreground)]">
      {/* Top Glassmorphic Navigation Header */}
      <header className="z-30 shrink-0 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1720px] items-center justify-between px-4 py-2.5 sm:px-6">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-xl font-bold tracking-tight text-[var(--foreground)]">
              mapora<span className="text-[var(--coral)]">.</span>
            </Link>
            <span className="hidden text-sm text-[var(--line)] sm:inline">/</span>
            <div className="hidden items-center gap-1.5 rounded-full bg-[var(--leaf)] px-3 py-0.5 text-xs font-semibold text-[var(--leaf-dark)] sm:flex">
              <span>📍</span>
              <span className="font-bold">Bangalore Atlas</span>
            </div>
          </div>

          {/* Quick Search & Location Bar */}
          <div className="flex flex-1 max-w-xl items-center gap-2 mx-4">
            <div className="relative w-full">
              <span className="absolute left-3.5 top-2.5 text-xs text-[var(--ink-muted)]">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) setIsPanelOpen(true);
                }}
                placeholder="Search places, schools, hospitals in Bangalore..."
                className="w-full rounded-full border border-[var(--line)] bg-[var(--background)] pl-9 pr-8 py-2 text-xs text-[var(--foreground)] placeholder-[var(--ink-muted)] transition-all focus:border-[var(--foreground)] focus:bg-[var(--paper)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-[var(--ink-muted)] hover:text-[var(--foreground)]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Location Select Dropdown */}
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                if (e.target.value) setIsPanelOpen(true);
              }}
              className="hidden md:block rounded-full border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs font-semibold text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              <option value="">All Locations</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  📍 {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Right Action Buttons & Panel Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className={`rounded-full border border-[var(--line)] px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                isPanelOpen
                  ? "bg-[var(--foreground)] text-[var(--paper)] shadow-xs"
                  : "bg-[var(--paper)] text-[var(--foreground)] hover:bg-[var(--background)]"
              }`}
            >
              {isPanelOpen ? "🗺️ Full Map" : `📋 Places (${filteredListings.length})`}
            </button>
            <Link
              href="/submit"
              className="rounded-full bg-[var(--coral)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-[var(--coral)]/90 hover:shadow-sm"
            >
              + Add Place
            </Link>
            <Link
              href="/admin"
              className="hidden sm:inline-block rounded-full border border-[var(--line)] bg-[var(--paper)] px-3.5 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Full-Height App View */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* LEFT/MAIN CANVAS: Interactive Full Map */}
        <main className="relative flex-1 h-full w-full bg-[#f4efe8]">
          <InteractiveLeafletCanvas
            locatedListings={locatedListings}
            activePlaceId={activePlaceId}
            setActivePlaceId={handleSelectPlace}
            userLocation={userLocation}
            onLocateMe={handleLocateMe}
            flyToUserTrigger={flyToUserTrigger}
          />

          {/* Floating Category Tabs on Top-Left of Map */}
          <div className="absolute top-4 left-4 z-[400] flex items-center gap-1.5 overflow-x-auto max-w-[calc(100vw-32px)] sm:max-w-max rounded-full border border-[var(--line)]/80 bg-[var(--paper)]/95 p-1.5 shadow-lg backdrop-blur-md scrollbar-none">
            <button
              onClick={() => handleSelectCategory("")}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                !selectedCategory
                  ? "bg-[var(--foreground)] text-[var(--paper)] shadow-xs"
                  : "text-[var(--ink-muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/40"
              }`}
            >
              All ({initialListings.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-[var(--foreground)] text-[var(--paper)] shadow-xs"
                    : "text-[var(--ink-muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/40"
                }`}
              >
                {cat.name.includes("School") ? "🏫 " : cat.name.includes("Hospital") ? "🏥 " : "📍 "}
                {cat.name} ({categoryCounts[cat.id] || 0})
              </button>
            ))}
          </div>

          {/* Floating "Show Places List" Button when Drawer is Closed */}
          {!isPanelOpen && (
            <button
              onClick={() => setIsPanelOpen(true)}
              className="absolute top-4 right-4 z-[400] flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)]/95 px-4 py-2 text-xs font-bold text-[var(--foreground)] shadow-xl backdrop-blur-md hover:bg-[var(--background)] hover:scale-105 transition-all cursor-pointer"
            >
              <span>📋</span>
              <span>Explore Places ({filteredListings.length})</span>
            </button>
          )}

          {/* Location Detection Status Pill */}
          {userLocation && (
            <div className="absolute bottom-5 left-5 z-[400] hidden sm:flex items-center gap-2 rounded-full border border-blue-200 bg-white/95 px-3.5 py-1.5 text-[11px] font-semibold text-blue-700 shadow-md backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              <span>Location active</span>
            </div>
          )}
        </main>

        {/* RIGHT SIDE DRAWER: Category Tabs & Place Cards (Shown when selected) */}
        <aside
          className={`z-20 flex h-full flex-col border-l border-[var(--line)] bg-[var(--background)] transition-all duration-300 shrink-0 ${
            isPanelOpen
              ? "w-full md:w-[420px] lg:w-[460px] xl:w-[480px]"
              : "hidden"
          }`}
        >
          {/* Drawer Top Header with Category Tabs & Close Button */}
          <div className="border-b border-[var(--line)] bg-[var(--paper)] p-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--coral)]">
                Category Selection
              </p>
              <button
                onClick={() => setIsPanelOpen(false)}
                title="Minimize to Full Map"
                className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[11px] font-bold text-[var(--ink-muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)] transition-colors cursor-pointer"
              >
                ✕ Full Map
              </button>
            </div>

            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("")}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  !selectedCategory
                    ? "bg-[var(--foreground)] text-[var(--paper)] shadow-xs"
                    : "border border-[var(--line)] bg-[var(--background)] text-[var(--ink-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30"
                }`}
              >
                🌐 All ({initialListings.length})
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const icon =
                  cat.name.includes("School") || cat.name.includes("Education")
                    ? "🏫"
                    : cat.name.includes("Hospital") || cat.name.includes("Health")
                    ? "🏥"
                    : cat.name.includes("Cafe") || cat.name.includes("Restaurant")
                    ? "☕"
                    : "📍";

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? "" : cat.id)}
                    className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--foreground)] text-[var(--paper)] shadow-xs"
                        : "border border-[var(--line)] bg-[var(--background)] text-[var(--ink-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30"
                    }`}
                  >
                    {icon} {cat.name} ({categoryCounts[cat.id] || 0})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Subheader */}
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--paper)]/60 px-4 py-2 text-xs backdrop-blur-xs">
            <span className="font-semibold text-[var(--ink-muted)]">
              Showing <span className="font-bold text-[var(--foreground)]">{filteredListings.length}</span> places
              {activeCategoryObj && (
                <span> in <span className="font-bold text-[var(--coral)]">{activeCategoryObj.name}</span></span>
              )}
            </span>
            {selectedLocation && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                📍 {selectedLocation}
              </span>
            )}
          </div>

          {/* Scrollable Listings Cards Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {paginatedListings.length > 0 ? (
              <>
                {paginatedListings.map((place) => {
                  const isSelected = activePlaceId === place.id;
                  return (
                    <article
                      key={place.id}
                      onClick={() => setActivePlaceId(place.id)}
                      className={`group cursor-pointer rounded-2xl border bg-[var(--paper)] p-4 transition-all duration-200 shadow-xs hover:shadow-md ${
                        isSelected
                          ? "border-[var(--coral)] ring-2 ring-[var(--coral)]/20 shadow-md bg-[var(--paper-subtle)]"
                          : "border-[var(--line)] hover:border-[var(--foreground)]/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {place.category_name && (
                              <span className="inline-block rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--leaf-dark)]">
                                {place.category_name}
                              </span>
                            )}
                            {place.distanceKm !== null && place.distanceKm !== undefined && (
                              <span className="inline-block rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                📍 {place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)}m` : `${place.distanceKm.toFixed(1)} km`} away
                              </span>
                            )}
                          </div>

                          <h3 className="font-display text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--coral)] transition-colors">
                            <Link href={`/listing/${place.slug}`}>
                              {place.title}
                            </Link>
                          </h3>
                          <p className="mt-0.5 text-xs text-[var(--ink-muted)] flex items-center gap-1">
                            <span>📍</span>
                            <span>
                              {[place.locality, place.city].filter(Boolean).join(", ") || "Bangalore, KA"}
                            </span>
                          </p>
                        </div>

                        {place.is_featured && (
                          <span className="rounded bg-[var(--coral-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--coral)] uppercase">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      {place.short_description && (
                        <p className="mt-2 text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                          {place.short_description}
                        </p>
                      )}

                      {/* Action Bar */}
                      <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs">
                        <div className="flex items-center gap-2">
                          {place.phone && (
                            <a
                              href={`tel:${place.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--line)]"
                            >
                              📞 Call
                            </a>
                          )}
                          {place.website && (
                            <a
                              href={place.website}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--line)]"
                            >
                              🌐 Website
                            </a>
                          )}
                          {place.latitude && place.longitude && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--line)]"
                            >
                              🧭 Route
                            </a>
                          )}
                        </div>

                        <Link
                          href={`/listing/${place.slug}`}
                          className="font-bold text-[var(--coral)] hover:underline flex items-center gap-1"
                        >
                          <span>Details</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}

                {/* Pagination Controls */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredListings.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  className="mt-2"
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center">
                <span className="text-2xl">🔍</span>
                <p className="mt-2 text-xs font-semibold text-[var(--foreground)]">No places found</p>
                <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                  Try clearing the category filter or searching for another keyword.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedLocation("");
                    setSearchQuery("");
                  }}
                  className="mt-3 rounded-full bg-[var(--foreground)] px-4 py-1.5 text-xs font-bold text-[var(--paper)] cursor-pointer"
                >
                  Show all places
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
