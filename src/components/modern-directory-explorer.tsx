"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 6;

const InteractiveLeafletCanvas = dynamic(
  () => import("@/components/interactive-leaflet-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#f4efe8]">
        <div className="flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-2.5 text-xs font-semibold shadow-xs">
          <span className="h-3 w-3 rounded-full bg-[var(--coral)] animate-ping" />
          <span>Rendering interactive map...</span>
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
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  domain: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  };
  initialListings: PlaceListing[];
  categories: Category[];
  availableLocations: string[];
  initialCategory?: string;
  initialLocation?: string;
  initialQuery?: string;
};

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
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLocation]);

  // Filter listings in memory for instant sub-millisecond search & filtering
  const filteredListings = useMemo(() => {
    return initialListings.filter((place) => {
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
  }, [initialListings, searchQuery, selectedCategory, selectedLocation]);

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
          {/* Logo & Directory Name */}
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-xl font-bold tracking-tight text-[var(--foreground)]">
              mapora<span className="text-[var(--coral)]">.</span>
            </Link>
            <span className="hidden text-sm text-[var(--line)] sm:inline">/</span>
            <div className="hidden items-center gap-1.5 rounded-full bg-[var(--leaf)] px-3 py-0.5 text-xs font-semibold text-[var(--leaf-dark)] sm:flex">
              <span>📍</span>
              <span className="font-bold">{domain.name}</span>
            </div>
          </div>

          {/* Quick Search & Location Bar */}
          <div className="flex flex-1 max-w-xl items-center gap-2 mx-4">
            <div className="relative w-full">
              <span className="absolute left-3.5 top-2.5 text-xs text-[var(--ink-muted)]">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              onChange={(e) => setSelectedLocation(e.target.value)}
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
              className="md:hidden rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]"
            >
              {isPanelOpen ? "🗺️ Hide List" : "📋 Show List"}
            </button>
            <Link
              href={`/${domain.slug}/submit`}
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
        {/* LEFT CANVAS: Interactive Full Map */}
        <main className="relative flex-1 h-full w-full bg-[#f4efe8]">
          <InteractiveLeafletCanvas
            locatedListings={locatedListings}
            activePlaceId={activePlaceId}
            setActivePlaceId={setActivePlaceId}
            domainSlug={domain.slug}
          />

          {/* Floating Floating Category Tabs on Top-Right / Map Overlay */}
          <div className="absolute top-4 left-4 z-[400] hidden lg:flex items-center gap-1.5 rounded-full border border-[var(--line)]/80 bg-[var(--paper)]/90 p-1.5 shadow-lg backdrop-blur-md">
            <button
              onClick={() => setSelectedCategory("")}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
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
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
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
        </main>

        {/* RIGHT SIDE PANEL: Category Tabs & Place Cards Drawer */}
        <aside
          className={`z-20 flex h-full flex-col border-l border-[var(--line)] bg-[var(--background)] transition-all duration-300 shrink-0 ${
            isPanelOpen
              ? "w-full md:w-[420px] lg:w-[460px] xl:w-[480px]"
              : "hidden"
          }`}
        >
          {/* Top Category Tab Selector Strip */}
          <div className="border-b border-[var(--line)] bg-[var(--paper)] p-3">
            <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--coral)]">
              Category Tabs
            </p>
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

          {/* Tab Place Cards Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {paginatedListings.length > 0 ? (
              <>
                {paginatedListings.map((place) => {
                  const isSelected = activePlaceId === place.id;
                  return (
                    <article
                      key={place.id}
                      onMouseEnter={() => setActivePlaceId(place.id)}
                      onClick={() => setActivePlaceId(place.id)}
                      className={`group relative rounded-3xl border p-4 sm:p-5 transition-all cursor-pointer ${
                        isSelected
                          ? "border-[var(--coral)] bg-[var(--paper)] shadow-md ring-2 ring-[var(--coral)]/20 -translate-y-0.5"
                          : "border-[var(--line)] bg-[var(--paper)] shadow-xs hover:border-[var(--foreground)]/25 hover:shadow-sm hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {place.category_name && (
                            <span className="mb-1 inline-block rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--leaf-dark)]">
                              {place.category_name}
                            </span>
                          )}
                          <h3 className="font-display text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--coral)] transition-colors">
                            <Link href={`/${domain.slug}/listing/${place.slug}`}>
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
                          <span className="rounded-full bg-[var(--coral-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--coral)]">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      {place.short_description && (
                        <p className="mt-2.5 text-xs leading-5 text-[var(--ink-muted)] line-clamp-2">
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
                          href={`/${domain.slug}/listing/${place.slug}`}
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
              <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-8 text-center">
                <p className="text-3xl">📍</p>
                <h4 className="mt-3 font-display text-base font-bold text-[var(--foreground)]">No places found</h4>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Try clearing the search query or selecting a different category tab.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setSelectedLocation("");
                  }}
                  className="mt-4 rounded-full bg-[var(--foreground)] px-4 py-1.5 text-xs font-semibold text-[var(--paper)] cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
