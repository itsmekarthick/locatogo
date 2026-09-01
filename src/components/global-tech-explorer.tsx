"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompanyDetailDrawer, type CompanyDetail } from "@/components/company-detail-drawer";
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
  currentHub = "bengaluru",
}: {
  initialCompanies: CompanyDetail[];
  currentHub?: string;
}) {
  const [selectedHub, setSelectedHub] = useState<TechHub>(
    GLOBAL_TECH_HUBS.find((h) => h.id === currentHub) || GLOBAL_TECH_HUBS[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [hiringOnly, setHiringOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);

  // Filter companies based on search, hiring toggle, and stage
  const filteredCompanies = useMemo(() => {
    return initialCompanies.filter((c) => {
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
  }, [initialCompanies, hiringOnly, selectedType, selectedStage, searchQuery]);

  const totalOpenings = useMemo(() => {
    return initialCompanies.reduce((acc, c) => acc + (c.jobs?.length || c.active_jobs_count || 0), 0);
  }, [initialCompanies]);

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

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50 dark:bg-[#090d16] font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Floating Control Toolbar */}
      <header className="z-[1000] border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0c121e]/90 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Brand & Global Hub Switcher */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <BrandLogo size={30} />
              <span className="font-serif text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100">
                TechAtlas<span className="text-indigo-600">.</span>
              </span>
            </Link>

            {/* City Hub Switcher Dropdown */}
            <div className="relative">
              <select
                value={selectedHub.id}
                onChange={(e) => {
                  const hub = GLOBAL_TECH_HUBS.find((h) => h.id === e.target.value);
                  if (hub) setSelectedHub(hub);
                }}
                className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 shadow-2xs focus:outline-none cursor-pointer"
              >
                {GLOBAL_TECH_HUBS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.flag} {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, tech stack, roles..."
              className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Filters & Actions Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pulsing "Hiring Now" Toggle */}
            <button
              type="button"
              onClick={() => setHiringOnly(!hiringOnly)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                hiringOnly
                  ? "bg-emerald-600 text-white shadow-emerald-500/20 shadow-md ring-2 ring-emerald-400"
                  : "border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>💼 Hiring ({totalOpenings} roles)</span>
            </button>

            {/* Company Stage Dropdown */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
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
                className={`rounded-full px-3 py-1 transition-all ${
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
                className={`rounded-full px-3 py-1 transition-all ${
                  viewMode === "grid"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                ▦ Grid ({filteredCompanies.length})
              </button>
            </div>

            <ThemeToggle />
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
                const found = initialCompanies.find((c) => c.id === id);
                if (found) setSelectedCompany(found);
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
                {filteredCompanies.map((comp) => {
                  const jobCount = comp.jobs?.length || comp.active_jobs_count || 0;
                  return (
                    <article
                      key={comp.id}
                      onClick={() => setSelectedCompany(comp)}
                      className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs transition-all hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-xs">
                              {comp.title.charAt(0)}
                            </span>
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
            </div>
          </div>
        )}
      </main>

      {/* Slide-over Company Detail & Jobs Drawer */}
      <CompanyDetailDrawer company={selectedCompany} onClose={() => setSelectedCompany(null)} />
    </div>
  );
}
