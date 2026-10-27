"use client";

import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import type { CompanyDetail } from "@/components/company-detail-drawer";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { ArrowRightIcon, ArrowUpRightIcon, GlobeIcon, MapPinIcon, SearchIcon, XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
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

  const listboxId = "tech-atlas-search-results";
  const scopes: { id: typeof filterScope; label: ReactNode }[] = [
    { id: "all", label: <><GlobeIcon className="size-3.5" />All metros</> },
    { id: "hub", label: <><span aria-hidden="true">{selectedHub.flag}</span>{selectedHub.name} only</> },
    { id: "hiring", label: <><span aria-hidden="true" className="size-1.5 rounded-full bg-success" />Hiring</> },
  ];

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex w-full items-center rounded-full border bg-surface-1 transition-[border-color,box-shadow] duration-200",
          isOpen ? "border-accent ring-4 ring-accent-soft" : "border-line-strong hover:border-accent/50",
        )}
      >
        <div className="flex shrink-0 items-center gap-1.5 pl-3.5 pr-1 text-fg-subtle">
          <SearchIcon className="size-4" />
          <span className="hidden items-center gap-1 rounded-full border border-line bg-surface-3 px-2 py-0.5 text-[11px] font-semibold text-fg-muted lg:inline-flex">
            <span aria-hidden="true">{selectedHub.flag}</span>
            {selectedHub.name}
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label="Search companies, tech stack and roles"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${totalDatabaseCompanies.toLocaleString()}+ companies, tech stack (React, Python), roles...`}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm font-medium text-fg outline-none placeholder:text-fg-subtle sm:py-2.5 pointer-coarse:py-3"
        />

        <div className="flex shrink-0 items-center gap-1.5 pr-1.5 sm:pr-2">
          {isSearchingServer && (
            <span role="status" aria-label="Searching" className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
          )}

          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                setServerResults([]);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="focus-ring inline-flex size-7 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg pointer-coarse:size-9"
            >
              <XIcon className="size-4" />
            </button>
          ) : (
            <kbd className="hidden items-center gap-0.5 rounded-md border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] font-medium text-fg-subtle lg:inline-flex">
              ⌘K
            </kbd>
          )}

          <button
            type="button"
            onClick={() => {
              if (rankedResults.length > 0) {
                handleSelect(rankedResults[0].company, rankedResults[0].targetHub);
              }
            }}
            aria-label="Open top result"
            className="focus-ring inline-flex size-8 items-center justify-center rounded-full bg-accent text-accent-fg transition-[transform,background-color] duration-150 hover:bg-accent-hover active:scale-95 pointer-coarse:size-10"
          >
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-[var(--z-dropdown)] mt-2 w-[min(36rem,calc(100vw-1.5rem))] min-w-full flex max-h-[min(32rem,70dvh)] flex-col rounded-2xl border border-line bg-surface-2 p-2.5 elev-lg animate-in fade-in slide-in-from-top-2 duration-150 sm:p-3">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-line px-1 pb-2">
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
              {scopes.map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  aria-pressed={filterScope === scope.id}
                  onClick={() => setFilterScope(scope.id)}
                  className={cn(
                    "focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors pointer-coarse:py-2",
                    filterScope === scope.id
                      ? "border-accent bg-accent-soft text-accent-text"
                      : "border-line bg-surface-3 text-fg-muted hover:text-fg",
                  )}
                >
                  {scope.label}
                </button>
              ))}
            </div>

            {searchQuery.trim() && (
              <span className="shrink-0 font-mono text-[10px] text-fg-subtle">{rankedResults.length} matches</span>
            )}
          </div>

          <div ref={listRef} id={listboxId} role="listbox" aria-label="Search results" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">
            {rankedResults.length === 0 ? (
              <div className="px-4 py-8 text-center">
                {searchQuery.trim() ? (
                  <>
                    <p className="text-sm font-semibold text-fg">No tech companies found matching &ldquo;{searchQuery}&rdquo;</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-fg-subtle">
                      Try a tech stack such as Python, AI or React, a role, or switch the scope to{" "}
                      <span className="font-semibold text-fg-muted">All metros</span>.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Popular tech searches</p>
                    <div className="mx-auto flex max-w-md flex-wrap justify-center gap-1.5">
                      {["Google", "Microsoft", "Amazon", "Infosys", "Zomato", "Freshworks", "AI & ML", "FinTech", "Python", "Golang"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            onSearchChange(tag);
                            inputRef.current?.focus();
                          }}
                          className="focus-ring rounded-full border border-line bg-surface-3 px-2.5 py-1 text-xs font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent-text pointer-coarse:py-2"
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
                    role="option"
                    aria-selected={isHighlighted}
                    onClick={() => handleSelect(company, targetHub)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "focus-ring flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left transition-colors sm:p-2.5",
                      isHighlighted ? "bg-surface-3" : "hover:bg-surface-3/60",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <CompanyBrandAvatar
                        title={company.title}
                        website={company.website}
                        size={36}
                        className="shrink-0 rounded-lg border border-line"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-fg">{company.title}</span>
                          {company.funding_stage && (
                            <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold leading-none text-accent-text">
                              {company.funding_stage}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-fg-subtle">
                          <MapPinIcon className="size-3 shrink-0" />
                          <span className="truncate">
                            {[company.locality, company.city || targetHub.name].filter(Boolean).join(", ")}
                          </span>
                          {company.tech_stack && company.tech_stack.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{company.tech_stack.slice(0, 3).join(", ")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {activeJobs > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                          {activeJobs} jobs
                        </span>
                      )}

                      {isCrossHub && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning"
                          title={`Located in ${targetHub.name} - will switch map view`}
                        >
                          <span aria-hidden="true">{targetHub.flag}</span>
                          {targetHub.name}
                        </span>
                      )}

                      <Link
                        href={`/company/${company.slug}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Open ${company.title} full profile page in a new tab`}
                        title={`Open ${company.title} full profile page in a new tab`}
                        className="focus-ring inline-flex size-7 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-accent-soft hover:text-accent-text pointer-coarse:size-9"
                      >
                        <ArrowUpRightIcon className="size-3.5" />
                      </Link>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 border-t border-line px-1 pt-2 text-[11px] text-fg-subtle">
            <div className="hidden items-center gap-3 sm:flex">
              <span><kbd className="rounded bg-surface-3 px-1 py-0.5 font-mono">↑</kbd> <kbd className="rounded bg-surface-3 px-1 py-0.5 font-mono">↓</kbd> navigate</span>
              <span><kbd className="rounded bg-surface-3 px-1 py-0.5 font-mono">↵</kbd> select</span>
              <span><kbd className="rounded bg-surface-3 px-1 py-0.5 font-mono">esc</kbd> close</span>
            </div>
            <span className="truncate">
              Database: <strong className="font-semibold text-fg-muted">{totalDatabaseCompanies.toLocaleString()}</strong> verified companies
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
