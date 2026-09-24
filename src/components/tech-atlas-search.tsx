"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import type { CompanyDetail } from "@/components/company-detail-drawer";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { GLOBAL_TECH_HUBS, type TechHub } from "@/lib/constants/tech-hubs";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";

export type TechAtlasSearchProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  companies: CompanyDetail[];
  selectedHub: TechHub;
  onSelectCompany: (company: CompanyDetail, targetHub?: TechHub) => void;
  onSelectHub?: (hub: TechHub) => void;
  totalDatabaseCompanies?: number;
  className?: string;
};

// Helper: detect which metro hub a company belongs to
export function detectHubForCompany(c: CompanyDetail): TechHub {
  const city = (c.city || "").toLowerCase();
  const loc = (c.locality || "").toLowerCase();
  const addr = (c.address_line_1 || "").toLowerCase();

  if (
    city.includes("hyderabad") ||
    loc.includes("hyderabad") ||
    loc.includes("hitec") ||
    loc.includes("gachibowli") ||
    loc.includes("madhapur") ||
    addr.includes("hyderabad")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "hyderabad") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("delhi") ||
    city.includes("gurugram") ||
    city.includes("gurgaon") ||
    city.includes("noida") ||
    loc.includes("delhi") ||
    loc.includes("gurugram") ||
    loc.includes("noida") ||
    loc.includes("cyber city") ||
    addr.includes("delhi") ||
    addr.includes("gurugram") ||
    addr.includes("noida")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "delhi-ncr") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("mumbai") ||
    city.includes("navi mumbai") ||
    city.includes("thane") ||
    loc.includes("mumbai") ||
    loc.includes("bkc") ||
    loc.includes("powai") ||
    loc.includes("andheri") ||
    addr.includes("mumbai")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "mumbai") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("chennai") ||
    city.includes("madras") ||
    loc.includes("chennai") ||
    loc.includes("omr") ||
    loc.includes("taramani") ||
    loc.includes("tidel") ||
    addr.includes("chennai")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "chennai") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("pune") ||
    loc.includes("pune") ||
    loc.includes("hinjewadi") ||
    loc.includes("kharadi") ||
    loc.includes("magarpatta") ||
    addr.includes("pune")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "pune") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("kolkata") ||
    city.includes("calcutta") ||
    loc.includes("salt lake") ||
    loc.includes("new town") ||
    addr.includes("kolkata")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "kolkata") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("kochi") ||
    city.includes("cochin") ||
    loc.includes("infopark") ||
    loc.includes("kakkanad") ||
    addr.includes("kochi")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "kochi") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("san francisco") ||
    city.includes("mountain view") ||
    city.includes("palo alto") ||
    city.includes("sunnyvale") ||
    city.includes("san jose") ||
    city.includes("menlo park") ||
    loc.includes("silicon valley") ||
    loc.includes("bay area") ||
    addr.includes("san francisco")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "silicon-valley") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("new york") ||
    city.includes("brooklyn") ||
    city.includes("queens") ||
    loc.includes("new york") ||
    loc.includes("manhattan") ||
    addr.includes("new york")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "new-york") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("seattle") ||
    city.includes("bellevue") ||
    city.includes("redmond") ||
    loc.includes("seattle") ||
    loc.includes("bellevue") ||
    addr.includes("seattle")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "seattle") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("austin") ||
    loc.includes("austin") ||
    addr.includes("austin")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "austin") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("boston") ||
    city.includes("cambridge") ||
    city.includes("somerville") ||
    loc.includes("boston") ||
    loc.includes("cambridge") ||
    addr.includes("boston")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "boston") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("los angeles") ||
    city.includes("santa monica") ||
    city.includes("culver city") ||
    city.includes("glendale") ||
    loc.includes("los angeles") ||
    loc.includes("culver") ||
    addr.includes("los angeles")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "los-angeles") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("chicago") ||
    loc.includes("chicago") ||
    addr.includes("chicago") ||
    loc.includes("fulton market")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "chicago") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("denver") ||
    city.includes("boulder") ||
    loc.includes("denver") ||
    loc.includes("boulder") ||
    addr.includes("denver")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "denver") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("atlanta") ||
    loc.includes("atlanta") ||
    addr.includes("atlanta") ||
    loc.includes("midtown")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "atlanta") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("san diego") ||
    city.includes("la jolla") ||
    loc.includes("san diego") ||
    addr.includes("san diego")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "san-diego") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("london") ||
    loc.includes("london") ||
    addr.includes("london") ||
    loc.includes("shoreditch")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "london") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("toronto") ||
    loc.includes("toronto") ||
    addr.includes("toronto")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "toronto") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("berlin") ||
    loc.includes("berlin") ||
    addr.includes("berlin")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "berlin") || GLOBAL_TECH_HUBS[0];
  }
  if (
    city.includes("singapore") ||
    loc.includes("singapore") ||
    addr.includes("singapore")
  ) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "singapore") || GLOBAL_TECH_HUBS[0];
  }
  if (city.includes("paris") || loc.includes("paris") || addr.includes("paris")) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "paris") || GLOBAL_TECH_HUBS[0];
  }
  if (city.includes("amsterdam") || loc.includes("amsterdam") || addr.includes("amsterdam")) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "amsterdam") || GLOBAL_TECH_HUBS[0];
  }
  if (city.includes("dublin") || loc.includes("dublin") || addr.includes("dublin")) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "dublin") || GLOBAL_TECH_HUBS[0];
  }
  if (city.includes("tokyo") || loc.includes("tokyo") || addr.includes("tokyo") || loc.includes("shibuya")) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "tokyo") || GLOBAL_TECH_HUBS[0];
  }
  if (city.includes("sydney") || loc.includes("sydney") || addr.includes("sydney") || loc.includes("surry hills")) {
    return GLOBAL_TECH_HUBS.find((h) => h.id === "sydney") || GLOBAL_TECH_HUBS[0];
  }
  // Default fallback is Bengaluru
  return GLOBAL_TECH_HUBS.find((h) => h.id === "bengaluru") || GLOBAL_TECH_HUBS[0];
}

// Relevance scoring for search ranking
function scoreCompanyMatch(
  company: CompanyDetail,
  q: string,
  selectedHubId: string
): number {
  const query = q.toLowerCase().trim();
  if (!query) return 0;

  const title = (company.title || "").toLowerCase();
  const locality = (company.locality || "").toLowerCase();
  const city = (company.city || "").toLowerCase();
  const desc = (company.short_description || "").toLowerCase();
  const stack = (company.tech_stack || []).map((s) => s.toLowerCase());
  const stage = (company.funding_stage || "").toLowerCase();
  const type = (company.company_type || "").toLowerCase();

  let score = 0;

  // 1. Exact or starts-with title match
  if (title === query) {
    score += 1000;
  } else if (title.startsWith(query)) {
    score += 500;
  } else if (title.split(/[\s,.-]+/).some((w) => w === query)) {
    score += 300;
  } else if (title.includes(query)) {
    score += 150;
  }

  // 2. Hub Affinity: Companies in the active viewing metro get high priority
  const hub = detectHubForCompany(company);
  if (hub.id === selectedHubId) {
    score += 120;
  }

  // 3. Flagship Tier (GCC, Unicorn, Public, Tech Giant)
  if (stage === "unicorn" || stage === "gcc" || stage === "public" || type === "tech_giant_mnc") {
    score += 80;
  } else if (stage.includes("series")) {
    score += 40;
  }

  // 4. Hiring Openings
  const jobs = company.active_jobs_count || (company.jobs ? company.jobs.length : 0);
  if (jobs > 0) {
    score += 50 + Math.min(jobs, 50);
  }

  // 5. Tech Stack match
  if (stack.some((s) => s === query)) {
    score += 60;
  } else if (stack.some((s) => s.includes(query))) {
    score += 30;
  }

  // 6. Locality / City match
  if (locality.includes(query)) {
    score += 40;
  } else if (city.includes(query)) {
    score += 30;
  }

  // 7. Description keyword match (weakest weight to prevent vendor spam)
  if (desc.includes(query)) {
    score += 10;
  }

  return score;
}

export function TechAtlasSearch({
  searchQuery,
  onSearchChange,
  companies,
  selectedHub,
  onSelectCompany,
  onSelectHub,
  totalDatabaseCompanies = 19095,
  className = "",
}: TechAtlasSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [filterScope, setFilterScope] = useState<"all" | "hub" | "hiring">("all");
  const [serverResults, setServerResults] = useState<CompanyDetail[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Command+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Server-side search debounced (queries full 19,095 DB)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setServerResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingServer(true);
      try {
        const res = await fetch(`/api/tech-atlas/companies?q=${encodeURIComponent(q)}&limit=150`);
        if (res.ok) {
          const data = await res.json();
          if (data.companies && Array.isArray(data.companies)) {
            const parsed: CompanyDetail[] = data.companies.map((l: any) => ({
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
            setServerResults(parsed);
          }
        }
      } catch {
        // Fallback to local memory
      } finally {
        setIsSearchingServer(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine and deduplicate local memory + server search results
  const rankedResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];

    const pool = new Map<string, CompanyDetail>();
    // Add local memory companies
    companies.forEach((c) => pool.set(c.id, c));
    // Merge server results while preserving rich local job data and localized counts
    serverResults.forEach((c) => {
      const existing = pool.get(c.id);
      if (existing) {
        pool.set(c.id, {
          ...c,
          active_jobs_count: existing.active_jobs_count,
          jobs: existing.jobs && existing.jobs.length > 0 ? existing.jobs : c.jobs,
        });
      } else {
        pool.set(c.id, c);
      }
    });

    const scoredList: { company: CompanyDetail; score: number; targetHub: TechHub }[] = [];

    pool.forEach((c) => {
      const score = scoreCompanyMatch(c, q, selectedHub.id);
      if (score > 0) {
        const targetHub = detectHubForCompany(c);

        // Apply quick scope filters
        if (filterScope === "hub" && targetHub.id !== selectedHub.id) return;
        if (filterScope === "hiring" && (!c.active_jobs_count || c.active_jobs_count === 0)) return;

        scoredList.push({ company: c, score, targetHub });
      }
    });

    // Sort descending by calculated score
    scoredList.sort((a, b) => b.score - a.score);

    return scoredList.slice(0, 25);
  }, [searchQuery, companies, serverResults, selectedHub.id, filterScope]);

  // Reset highlight index when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [rankedResults]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < rankedResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : rankedResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rankedResults[highlightedIndex]) {
        handleSelect(rankedResults[highlightedIndex].company, rankedResults[highlightedIndex].targetHub);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (company: CompanyDetail, targetHub: TechHub) => {
    onSelectCompany(company, targetHub);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* DIRECT ACTIVE SEARCH BAR INPUT */}
      <div
        className={`group relative flex items-center w-full rounded-full border bg-white dark:bg-slate-900 transition-all duration-200 shadow-2xs ${
          isOpen
            ? "border-cyan-500/80 dark:border-cyan-500/80 shadow-md ring-3 ring-cyan-500/10"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
        }`}
      >
        {/* Left Search Icon & Active Metro Tag */}
        <div className="flex items-center gap-1.5 pl-3.5 pr-1 shrink-0 text-slate-400 dark:text-slate-500">
          <span className="text-base select-none">🔍</span>
          <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            <span>{selectedHub.flag}</span>
            <span>{selectedHub.name}</span>
          </span>
        </div>

        {/* Real Direct Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${totalDatabaseCompanies.toLocaleString()}+ companies, tech stack (React, Python), roles...`}
          className="w-full bg-transparent py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />

        {/* Right Action Icons: Spinner / Clear / ⌘K Badge */}
        <div className="flex items-center gap-1.5 pr-2 sm:pr-3 shrink-0">
          {isSearchingServer && (
            <span className="animate-spin text-xs text-cyan-500" title="Searching database...">
              ⏳
            </span>
          )}

          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                setServerResults([]);
                inputRef.current?.focus();
              }}
              className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 text-xs transition-colors cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-400 shadow-2xs">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}

          {/* Quick Submit / Magnifier Pill */}
          <button
            type="button"
            onClick={() => {
              if (rankedResults.length > 0) {
                handleSelect(rankedResults[0].company, rankedResults[0].targetHub);
              }
            }}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] text-white shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Search"
          >
            <span className="text-xs">➔</span>
          </button>
        </div>
      </div>

      {/* DROPDOWN COMMAND PALETTE & INSTANT RESULTS */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-[1100] max-h-[480px] sm:max-h-[520px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#0d1424]/98 backdrop-blur-xl p-2.5 sm:p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
          {/* Quick Filter Scope Strip */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2 px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setFilterScope("all")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                  filterScope === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-bold"
                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                🌐 All Metros
              </button>

              <button
                type="button"
                onClick={() => setFilterScope("hub")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  filterScope === "hub"
                    ? "bg-cyan-600 text-white shadow-2xs font-bold ring-1 ring-cyan-400"
                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span>{selectedHub.flag}</span>
                <span>{selectedHub.name} Only</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterScope("hiring")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  filterScope === "hiring"
                    ? "bg-emerald-600 text-white shadow-2xs font-bold ring-1 ring-emerald-400"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                }`}
              >
                <span>🔥 Hiring Jobs</span>
              </button>
            </div>

            {searchQuery.trim() && (
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                {rankedResults.length} matches
              </span>
            )}
          </div>

          {/* Results List */}
          <div ref={listRef} className="overflow-y-auto max-h-[380px] space-y-1 pr-1 custom-scrollbar">
            {rankedResults.length === 0 ? (
              <div className="py-8 text-center px-4">
                {searchQuery.trim() ? (
                  <>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No tech companies found matching &ldquo;{searchQuery}&rdquo;
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                      Try searching by tech stack (e.g. <span className="text-cyan-500">Python</span>, <span className="text-cyan-500">AI</span>, <span className="text-cyan-500">React</span>), role, or switch filter to <span className="font-semibold">All Metros</span>.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Popular Tech Searches
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                      {["Google", "Microsoft", "Amazon", "Infosys", "Zomato", "Freshworks", "AI & ML", "FinTech", "Python", "Golang"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            onSearchChange(tag);
                            inputRef.current?.focus();
                          }}
                          className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-600 transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              rankedResults.map((item, idx) => {
                const { company, targetHub } = item;
                const isHighlighted = idx === highlightedIndex;
                const isCrossHub = targetHub.id !== selectedHub.id;
                const matchingJobs =
                  company.jobs && company.jobs.length > 0
                    ? company.jobs.filter(
                        (j) =>
                          jobMatchesLocation(j.location_name, targetHub.id) ||
                          jobMatchesLocation(j.location_name, targetHub.name)
                      )
                    : [];
                const activeJobs =
                  company.jobs && company.jobs.length > 0
                    ? matchingJobs.length
                    : (company.active_jobs_count || 0);

                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelect(company, targetHub)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-3 p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isHighlighted
                        ? "bg-slate-100 dark:bg-slate-800/90 shadow-2xs"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {/* Left: Brand Avatar & Company Identity */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <CompanyBrandAvatar
                          title={company.title}
                          website={company.website}
                          size={36}
                          className="rounded-lg shadow-2xs border border-slate-200/80 dark:border-slate-700/80"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {company.title}
                          </span>

                          {/* Funding Stage / Type Badge */}
                          {company.funding_stage && (
                            <span className="rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/50 px-1.5 py-0.2 text-[10px] font-semibold">
                              {company.funding_stage}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          <span>📍</span>
                          <span className="truncate">
                            {[company.locality, company.city || targetHub.name].filter(Boolean).join(", ")}
                          </span>

                          {company.tech_stack && company.tech_stack.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 dark:text-slate-500 truncate">
                                {company.tech_stack.slice(0, 3).join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Job Openings & Metro Indicators */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {activeJobs > 0 && (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{activeJobs} jobs</span>
                        </span>
                      )}

                      {/* If from another metro, highlight with metro pill */}
                      {isCrossHub && (
                        <span
                          className="rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1"
                          title={`Located in ${targetHub.name} - will switch map view`}
                        >
                          <span>{targetHub.flag}</span>
                          <span>{targetHub.name}</span>
                        </span>
                      )}

                      {/* Direct Page Link */}
                      <Link
                        href={`/company/${company.slug}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-md text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 transition-colors text-xs font-bold"
                        title={`Open ${company.title} full profile page in new tab`}
                      >
                        ↗
                      </Link>

                      <span className="text-slate-400 text-xs hidden sm:inline-block">➔</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-2 px-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <div className="hidden sm:flex items-center gap-2">
              <span><kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">↑</kbd> <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">↓</kbd> navigate</span>
              <span><kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">↵</kbd> select</span>
              <span><kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">esc</kbd> close</span>
            </div>
            <span className="truncate">
              Database: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{totalDatabaseCompanies.toLocaleString()}</strong> verified companies
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
