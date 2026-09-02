"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanyDetailDrawer, type CompanyDetail } from "@/components/company-detail-drawer";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { Pagination } from "@/components/ui/pagination";
import type { PlaceListing } from "@/components/modern-directory-explorer";

// Dynamically load interactive Leaflet map canvas without SSR
const InteractiveLeafletCanvas = dynamic(
  () => import("@/components/interactive-leaflet-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-500">
        <span className="animate-pulse">Loading Interactive Tech Map...</span>
      </div>
    ),
  }
);

export type TechHub = {
  id: string;
  name: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  zoom: number;
};

export const GLOBAL_TECH_HUBS: TechHub[] = [
  { id: "bengaluru", name: "Bengaluru", country: "India", flag: "🇮🇳", lat: 12.9716, lng: 77.5946, zoom: 12 },
  { id: "silicon-valley", name: "Silicon Valley & SF", country: "United States", flag: "🇺🇸", lat: 37.7749, lng: -122.4194, zoom: 11 },
  { id: "london", name: "London", country: "United Kingdom", flag: "🇬🇧", lat: 51.5074, lng: -0.1278, zoom: 12 },
  { id: "singapore", name: "Singapore", country: "Singapore", flag: "🇸🇬", lat: 1.3521, lng: 103.8198, zoom: 12 },
  { id: "new-york", name: "New York City", country: "United States", flag: "🇺🇸", lat: 40.7128, lng: -74.006, zoom: 12 },
  { id: "berlin", name: "Berlin", country: "Germany", flag: "🇩🇪", lat: 52.52, lng: 13.405, zoom: 12 },
  { id: "dubai", name: "Dubai", country: "United Arab Emirates", flag: "🇦🇪", lat: 25.2048, lng: 55.2708, zoom: 12 },
  { id: "hyderabad", name: "Hyderabad", country: "India", flag: "🇮🇳", lat: 17.385, lng: 78.4867, zoom: 12 },
];

export function GlobalTechExplorer({
  initialCompanies,
  totalDatabaseCompanies = 67699,
  currentHub = "bengaluru",
}: {
  initialCompanies: CompanyDetail[];
  totalDatabaseCompanies?: number;
  currentHub?: string;
}) {
  const [selectedHub, setSelectedHub] = useState<TechHub>(
    GLOBAL_TECH_HUBS.find((h) => h.id === currentHub) || GLOBAL_TECH_HUBS[0]
  );
  const [companies, setCompanies] = useState<CompanyDetail[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [hiringOnly, setHiringOnly] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [gridPage, setGridPage] = useState<number>(1);
  const GRID_PAGE_SIZE = 24;

  // Reset grid page when filters change
  useEffect(() => {
    setGridPage(1);
  }, [searchQuery, hiringOnly, selectedType, selectedStage, selectedHub]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // Progressive background streaming (Loads remaining companies without freezing UI)
  useEffect(() => {
    let isCancelled = false;

    async function loadMoreInBatches() {
      // Fetch pages 3, 4, 5, etc. progressively in consolidated chunks
      for (let page = 3; page < 12; page += 2) {
        if (isCancelled) break;
        try {
          const [res1, res2] = await Promise.all([
            fetch(`/api/tech-atlas/companies?page=${page}&limit=1500`),
            fetch(`/api/tech-atlas/companies?page=${page + 1}&limit=1500`),
          ]);

          const data1 = res1.ok ? await res1.json() : { companies: [] };
          const data2 = res2.ok ? await res2.json() : { companies: [] };
          const combined = [...(data1.companies || []), ...(data2.companies || [])];
          if (combined.length === 0) break;

          const newBatch: CompanyDetail[] = combined.map((l: any) => ({
            id: l.id,
            title: l.title,
            slug: l.slug,
            short_description: l.short_description,
            address_line_1: l.address_line_1,
            locality: l.locality,
            city: l.city,
            latitude: l.latitude,
            longitude: l.longitude,
            website: l.website,
            careers_url: l.careers_url,
            company_type: l.company_type || "product_saas",
            funding_stage: l.funding_stage || "Product",
            employee_range: l.employee_range,
            tech_stack: l.tech_stack || [],
            founded_year: l.founded_year,
            active_jobs_count: l.active_jobs_count || 0,
            jobs: [],
          }));

          if (isCancelled) break;

          // Non-blocking state update
          if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            (window as any).requestIdleCallback(() => {
              if (!isCancelled) {
                setCompanies((prev) => {
                  const existingIds = new Set(prev.map((c) => c.id));
                  const uniqueNew = newBatch.filter((c) => !existingIds.has(c.id));
                  return [...prev, ...uniqueNew];
                });
              }
            });
          } else {
            setCompanies((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const uniqueNew = newBatch.filter((c) => !existingIds.has(c.id));
              return [...prev, ...uniqueNew];
            });
          }

          // Yield CPU to maintain 60 FPS
          await new Promise((r) => setTimeout(r, 600));
        } catch {
          break;
        }
      }
    }

    const timer = setTimeout(() => {
      loadMoreInBatches();
    }, 1500);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Server-side search across all 67,699 companies when typing
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        setIsSearchingServer(true);
        const res = await fetch(`/api/tech-atlas/companies?q=${encodeURIComponent(searchQuery.trim())}&limit=500`);
        if (res.ok) {
          const data = await res.json();
          if (data.companies && data.companies.length > 0) {
            const serverResults: CompanyDetail[] = data.companies.map((l: any) => ({
              id: l.id,
              title: l.title,
              slug: l.slug,
              short_description: l.short_description,
              address_line_1: l.address_line_1,
              locality: l.locality,
              city: l.city,
              latitude: l.latitude,
              longitude: l.longitude,
              website: l.website,
              careers_url: l.careers_url,
              company_type: l.company_type || "product_saas",
              funding_stage: l.funding_stage || "Product",
              employee_range: l.employee_range,
              tech_stack: l.tech_stack || [],
              founded_year: l.founded_year,
              active_jobs_count: l.active_jobs_count || 0,
              jobs: [],
            }));

            setCompanies((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const uniqueNew = serverResults.filter((c) => !existingIds.has(c.id));
              return [...uniqueNew, ...prev];
            });
          }
        }
      } catch {
        // Fallback to client-side filtering
      } finally {
        setIsSearchingServer(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter companies based on search, hiring toggle, and stage
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // 1. Hiring filter
      if (hiringOnly && (!c.jobs || c.jobs.length === 0) && (!c.active_jobs_count || c.active_jobs_count === 0)) {
        return false;
      }

      // 2. Company type
      if (selectedType !== "all" && c.company_type !== selectedType) {
        return false;
      }

      // 3. Stage filter
      if (selectedStage !== "all" && c.funding_stage !== selectedStage) {
        return false;
      }

      // 4. Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchLoc = (c.locality || "").toLowerCase().includes(q);
        const matchTech = (c.tech_stack || []).some((t) => t.toLowerCase().includes(q));
        const matchJobs = (c.jobs || []).some((j) => j.title.toLowerCase().includes(q));
        if (!matchTitle && !matchLoc && !matchTech && !matchJobs) return false;
      }

      return true;
    });
  }, [companies, hiringOnly, selectedType, selectedStage, searchQuery]);

  const totalGridPages = Math.ceil(filteredCompanies.length / GRID_PAGE_SIZE);
  const paginatedCompanies = useMemo(() => {
    const start = (gridPage - 1) * GRID_PAGE_SIZE;
    return filteredCompanies.slice(start, start + GRID_PAGE_SIZE);
  }, [filteredCompanies, gridPage]);

  const totalOpenings = useMemo(() => {
    return companies.reduce((acc, c) => acc + (c.jobs?.length || c.active_jobs_count || 0), 0);
  }, [companies]);

  // Convert to PlaceListing format for InteractiveLeafletCanvas component
  const locatedListings: (PlaceListing & { latitude: number; longitude: number })[] = useMemo(() => {
    return filteredCompanies
      .filter((c) => typeof c.latitude === "number" && typeof c.longitude === "number")
      .map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        short_description: c.short_description || `${c.funding_stage || "Tech Company"} • ${c.locality || c.city}`,
        address_line_1: c.address_line_1,
        locality: c.locality || "Tech Hub",
        city: c.city || selectedHub.name,
        latitude: c.latitude,
        longitude: c.longitude,
        is_featured: (c.jobs?.length || c.active_jobs_count || 0) > 0,
        verification_status: "verified",
        category_name: c.company_type || "Tech",
        category_icon: (c.jobs?.length || 0) > 0 ? "💼" : "💻",
        pin_color: (c.jobs?.length || 0) > 0 ? "#10b981" : "#6366f1",
      }));
  }, [filteredCompanies, selectedHub]);

  const companyMap = useMemo(() => {
    const map = new Map<string, CompanyDetail>();
    for (let i = 0; i < companies.length; i++) {
      map.set(companies[i].id, companies[i]);
    }
    return map;
  }, [companies]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50 dark:bg-[#090d16] font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Floating Control Toolbar */}
      <header className="z-[1000] border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md sticky top-0">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 gap-3">
          {/* Left Group: Logo, Mode Toggle & Hub Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <BrandLogo size={32} className="group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                TechAtlas<span className="text-indigo-600">.</span>
              </span>
            </Link>

            {/* Dual Atlas Mode Segmented Pill */}
            <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-0.5 shadow-2xs">
              <Link
                href="/bangalore"
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span>🏙️</span>
                <span className="hidden md:inline">City Atlas</span>
                <span className="md:hidden">City</span>
              </Link>
              <div
                className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-xs"
              >
                <span>💼</span>
                <span className="hidden md:inline">Tech Atlas</span>
                <span className="md:hidden">Tech</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              </div>
            </div>

            {/* City Hub Switcher Dropdown */}
            <select
              value={selectedHub.id}
              onChange={(e) => {
                const hub = GLOBAL_TECH_HUBS.find((h) => h.id === e.target.value);
                if (hub) setSelectedHub(hub);
              }}
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none cursor-pointer"
            >
              {GLOBAL_TECH_HUBS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.flag} {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Center Group: Live Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-2">
            <div className="relative w-full flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-3.5 py-1.5 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-md transition-all">
              <span className="text-slate-400 text-xs mr-2 shrink-0">
                {isSearchingServer ? "⏳" : "🔍"}
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 67,000+ companies, tech stack, roles..."
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
          </div>

          {/* Right Group: Filters & View Modes */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Pulsing "Hiring Now" Toggle */}
            <button
              type="button"
              onClick={() => setHiringOnly(!hiringOnly)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                hiringOnly
                  ? "bg-emerald-600 text-white shadow-emerald-500/20 shadow-md ring-2 ring-emerald-400"
                  : "border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Hiring ({totalOpenings})</span>
            </button>

            {/* Company Stage Dropdown */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="hidden sm:inline-block rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Stages</option>
              <option value="GCC">MNC GCC</option>
              <option value="Unicorn">Unicorn</option>
              <option value="Public">Public Enterprise</option>
              <option value="Series C+">Series C+</option>
              <option value="Series B">Series B</option>
              <option value="Series A">Series A</option>
              <option value="Seed">Seed</option>
              <option value="Bootstrapped">Bootstrapped</option>
            </select>

            {/* View Switcher: Map vs Grid */}
            <div className="flex rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                  viewMode === "map"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                🗺️ Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                ▦ Grid
              </button>
            </div>

            <ThemeToggle />
          </div>
        </div>

        {/* Dedicated Mobile Search Bar */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800/60 px-3 py-1.5 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 shadow-2xs">
            <span className="text-slate-400 text-xs mr-1.5 shrink-0">
              {isSearchingServer ? "⏳" : "🔍"}
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, tech stack, roles..."
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
        </div>
      </header>

      {/* Main Body: Map or Grid View */}
      <main className="relative flex-1 w-full overflow-hidden">
        {viewMode === "map" ? (
          <div className="relative h-full w-full">
            <InteractiveLeafletCanvas
              locatedListings={locatedListings}
              activePlaceId={selectedCompany?.id ?? null}
              setActivePlaceId={(id: string | null) => {
                if (!id) {
                  setSelectedCompany(null);
                  return;
                }
                const found = companyMap.get(id) || null;
                setSelectedCompany(found);
              }}
              searchQuery={searchQuery}
            />

            {/* Bottom floating results badge */}
            <div className="pointer-events-none absolute bottom-4 left-4 z-[900]">
              <div className="pointer-events-auto rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-md backdrop-blur-md">
                📍 {filteredCompanies.length} Tech Companies in {selectedHub.name}
              </div>
            </div>
          </div>
        ) : (
          /* Grid View Mode */
          <div className="h-full overflow-y-auto p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Tech Companies & Startups in {selectedHub.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Showing {filteredCompanies.length} companies matching your criteria
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedCompanies.map((comp) => {
                  const jobCount = comp.jobs?.length || comp.active_jobs_count || 0;
                  return (
                    <article
                      key={comp.id}
                      onClick={() => setSelectedCompany(comp)}
                      className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs transition-all hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CompanyBrandAvatar title={comp.title} website={comp.website} size={42} />
                            <div>
                              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {comp.title}
                              </h3>
                              <p className="text-[11px] text-slate-500">📍 {comp.locality || comp.city}</p>
                            </div>
                          </div>

                          {comp.funding_stage && (
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {comp.funding_stage}
                            </span>
                          )}
                        </div>

                        {comp.short_description && (
                          <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                            {comp.short_description}
                          </p>
                        )}

                        {/* Tech Stack tags */}
                        {comp.tech_stack && comp.tech_stack.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {comp.tech_stack.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="rounded-md bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-bold">
                        {jobCount > 0 ? (
                          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            💼 {jobCount} Active Roles
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No active roles</span>
                        )}

                        <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                          View Details →
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Grid Pagination Controls */}
              {totalGridPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={gridPage}
                    totalPages={totalGridPages}
                    totalItems={filteredCompanies.length}
                    pageSize={GRID_PAGE_SIZE}
                    onPageChange={(p) => {
                      setGridPage(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Slide-over Company Detail & Jobs Drawer */}
      <CompanyDetailDrawer company={selectedCompany} onClose={() => setSelectedCompany(null)} />
    </div>
  );
}
