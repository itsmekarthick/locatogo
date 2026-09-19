"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { CompanyDetailDrawer, type CompanyDetail, type CompanyJob } from "@/components/company-detail-drawer";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { Pagination } from "@/components/ui/pagination";
import type { PlaceListing } from "@/components/modern-directory-explorer";
import { MapErrorBoundary } from "@/components/map-error-boundary";
import { AdBannerSlot } from "@/components/ad-banner-slot";
import { TechAtlasSearch } from "@/components/tech-atlas-search";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";

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

export type UnifiedJob = {
  id: string;
  title: string;
  department?: string | null;
  location_name: string;
  workplace_type: "on_site" | "hybrid" | "remote";
  experience_level?: string | null;
  salary_range?: string | null;
  apply_url: string;
  company_careers_url?: string | null;
  posted_at?: string | null;
  listing_id?: string;
  company_title?: string;
  company_slug?: string;
  company_type?: string | null;
  funding_stage?: string | null;
  locality?: string | null;
  city?: string | null;
};

export const GLOBAL_TECH_HUBS: TechHub[] = [
  { id: "bengaluru", name: "Bengaluru", country: "India", flag: "🇮🇳", lat: 12.9716, lng: 77.5946, zoom: 12 },
  { id: "hyderabad", name: "Hyderabad", country: "India", flag: "🇮🇳", lat: 17.4399, lng: 78.375, zoom: 12 },
  { id: "delhi-ncr", name: "Delhi NCR", country: "India", flag: "🇮🇳", lat: 28.4988, lng: 77.0898, zoom: 12 },
  { id: "mumbai", name: "Mumbai", country: "India", flag: "🇮🇳", lat: 19.0689, lng: 72.8695, zoom: 12 },
  { id: "chennai", name: "Chennai", country: "India", flag: "🇮🇳", lat: 12.9658, lng: 80.2458, zoom: 12 },
  { id: "pune", name: "Pune", country: "India", flag: "🇮🇳", lat: 18.5912, lng: 73.7389, zoom: 12 },
  { id: "kolkata", name: "Kolkata", country: "India", flag: "🇮🇳", lat: 22.5726, lng: 88.4339, zoom: 12 },
  { id: "kochi", name: "Kochi", country: "India", flag: "🇮🇳", lat: 10.0159, lng: 76.3639, zoom: 13 },
  { id: "silicon-valley", name: "Silicon Valley & SF", country: "United States", flag: "🇺🇸", lat: 37.7749, lng: -122.4194, zoom: 11 },
  { id: "london", name: "London", country: "United Kingdom", flag: "🇬🇧", lat: 51.5074, lng: -0.1278, zoom: 12 },
  { id: "singapore", name: "Singapore", country: "Singapore", flag: "🇸🇬", lat: 1.3521, lng: 103.8198, zoom: 12 },
  { id: "new-york", name: "New York City", country: "United States", flag: "🇺🇸", lat: 40.7128, lng: -74.006, zoom: 12 },
  { id: "berlin", name: "Berlin", country: "Germany", flag: "🇩🇪", lat: 52.52, lng: 13.405, zoom: 12 },
  { id: "dubai", name: "Dubai", country: "United Arab Emirates", flag: "🇦🇪", lat: 25.2048, lng: 55.2708, zoom: 12 },
];

export const TECH_SECTORS = [
  { id: "all", name: "All Sectors", icon: "🌐" },
  { id: "ai_ml", name: "AI & Machine Learning", icon: "🤖" },
  { id: "product_saas", name: "Product & SaaS", icon: "☁️" },
  { id: "tech_giant_mnc", name: "Tech Giants & GCC", icon: "🏛️" },
  { id: "fintech", name: "FinTech & Payments", icon: "💳" },
  { id: "deeptech", name: "DeepTech & Hardware", icon: "⚡" },
  { id: "enterprise", name: "Enterprise Software", icon: "🏢" },
  { id: "healthtech", name: "HealthTech & Bio", icon: "🧬" },
  { id: "ecommerce", name: "E-Commerce & Retail", icon: "🛍️" },
];

export const TECH_STAGES = [
  "all",
  "GCC",
  "Unicorn",
  "Public",
  "Series C+",
  "Series B",
  "Series A",
  "Seed",
  "Bootstrapped",
];

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function matchesHub(
  c: { city?: string | null; locality?: string | null; address_line_1?: string | null },
  hub: TechHub
): boolean {
  const city = (c.city || "").toLowerCase().trim();
  const loc = (c.locality || "").toLowerCase().trim();
  const addr = (c.address_line_1 || "").toLowerCase().trim();

  if (hub.id === "bengaluru") {
    if (city.includes("bangalore") || city.includes("bengaluru") || loc.includes("bangalore") || loc.includes("bengaluru")) {
      return true;
    }
    // Exclude other distinct Indian and global hubs
    if (
      city.includes("hyderabad") ||
      city.includes("delhi") ||
      city.includes("gurugram") ||
      city.includes("gurgaon") ||
      city.includes("noida") ||
      city.includes("mumbai") ||
      city.includes("chennai") ||
      city.includes("pune") ||
      city.includes("kolkata") ||
      city.includes("kochi") ||
      loc.includes("hyderabad") ||
      loc.includes("delhi") ||
      loc.includes("gurugram") ||
      loc.includes("gurgaon") ||
      loc.includes("noida") ||
      loc.includes("mumbai") ||
      loc.includes("bkc") ||
      loc.includes("powai") ||
      loc.includes("chennai") ||
      loc.includes("omr") ||
      loc.includes("sholinganallur") ||
      loc.includes("pune") ||
      loc.includes("hinjewadi") ||
      loc.includes("kharadi") ||
      loc.includes("kolkata") ||
      loc.includes("salt lake") ||
      loc.includes("kochi") ||
      loc.includes("infopark") ||
      addr.includes("hyderabad") ||
      addr.includes("delhi") ||
      addr.includes("mumbai") ||
      addr.includes("chennai") ||
      addr.includes("pune") ||
      addr.includes("kolkata") ||
      addr.includes("kochi")
    ) {
      return false;
    }
    return !city; // default unassigned is bengaluru
  }

  if (hub.id === "hyderabad") {
    return (
      city.includes("hyderabad") ||
      loc.includes("hyderabad") ||
      loc.includes("hitec") ||
      loc.includes("gachibowli") ||
      loc.includes("madhapur") ||
      loc.includes("financial district") ||
      loc.includes("kondapur") ||
      addr.includes("hyderabad")
    );
  }

  if (hub.id === "delhi-ncr" || hub.id === "delhi") {
    return (
      city.includes("delhi") ||
      city.includes("gurugram") ||
      city.includes("gurgaon") ||
      city.includes("noida") ||
      loc.includes("delhi") ||
      loc.includes("gurugram") ||
      loc.includes("gurgaon") ||
      loc.includes("noida") ||
      loc.includes("cyber city") ||
      loc.includes("cyberhub") ||
      loc.includes("udyog vihar") ||
      addr.includes("delhi") ||
      addr.includes("gurugram") ||
      addr.includes("noida")
    );
  }

  if (hub.id === "mumbai") {
    return (
      city.includes("mumbai") ||
      city.includes("navi mumbai") ||
      city.includes("thane") ||
      loc.includes("mumbai") ||
      loc.includes("bkc") ||
      loc.includes("bandra") ||
      loc.includes("powai") ||
      loc.includes("lower parel") ||
      loc.includes("andheri") ||
      loc.includes("vikhroli") ||
      loc.includes("goregaon") ||
      loc.includes("ghansoli") ||
      addr.includes("mumbai")
    );
  }

  if (hub.id === "chennai") {
    return (
      city.includes("chennai") ||
      city.includes("madras") ||
      loc.includes("chennai") ||
      loc.includes("omr") ||
      loc.includes("sholinganallur") ||
      loc.includes("taramani") ||
      loc.includes("siruseri") ||
      loc.includes("guindy") ||
      loc.includes("perungudi") ||
      loc.includes("guduvanchery") ||
      loc.includes("tidel") ||
      addr.includes("chennai")
    );
  }

  if (hub.id === "pune") {
    return (
      city.includes("pune") ||
      loc.includes("pune") ||
      loc.includes("hinjewadi") ||
      loc.includes("kharadi") ||
      loc.includes("magarpatta") ||
      loc.includes("baner") ||
      loc.includes("balewadi") ||
      loc.includes("kalyani nagar") ||
      loc.includes("yerwada") ||
      addr.includes("pune")
    );
  }

  if (hub.id === "kolkata") {
    return (
      city.includes("kolkata") ||
      city.includes("calcutta") ||
      loc.includes("kolkata") ||
      loc.includes("salt lake") ||
      loc.includes("rajarhat") ||
      loc.includes("new town") ||
      loc.includes("sector v") ||
      addr.includes("kolkata")
    );
  }

  if (hub.id === "kochi") {
    return (
      city.includes("kochi") ||
      city.includes("cochin") ||
      loc.includes("kochi") ||
      loc.includes("infopark") ||
      loc.includes("kakkanad") ||
      loc.includes("smartcity") ||
      addr.includes("kochi")
    );
  }

  if (hub.id === "silicon-valley") {
    return (
      city.includes("san francisco") ||
      city.includes("mountain view") ||
      city.includes("palo alto") ||
      city.includes("sunnyvale") ||
      city.includes("san jose") ||
      city.includes("menlo park") ||
      loc.includes("silicon valley") ||
      loc.includes("bay area")
    );
  }

  if (hub.id === "london") return city.includes("london") || loc.includes("london");
  if (hub.id === "singapore") return city.includes("singapore") || loc.includes("singapore");
  if (hub.id === "new-york") return city.includes("new york") || city.includes("nyc") || loc.includes("manhattan");
  if (hub.id === "berlin") return city.includes("berlin") || loc.includes("berlin");
  if (hub.id === "dubai") return city.includes("dubai") || loc.includes("dubai");

  return city.includes(hub.name.toLowerCase()) || loc.includes(hub.name.toLowerCase());
}

export function GlobalTechExplorer({
  initialCompanies,
  initialJobs = [],
  totalDatabaseCompanies = 19095,
  currentHub = "bengaluru",
  knownHubCounts,
}: {
  initialCompanies: CompanyDetail[];
  initialJobs?: UnifiedJob[];
  totalDatabaseCompanies?: number;
  currentHub?: string;
  knownHubCounts?: Record<string, number>;
}) {
  const [selectedHub, setSelectedHub] = useState<TechHub>(
    GLOBAL_TECH_HUBS.find((h) => h.id === currentHub) || GLOBAL_TECH_HUBS[0]
  );
  const [companies, setCompanies] = useState<CompanyDetail[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [hiringOnly, setHiringOnly] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"map" | "grid" | "jobs">("map");
  const [gridPage, setGridPage] = useState<number>(1);
  const GRID_PAGE_SIZE = 24;

  // Split-Screen Map Workbench States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");
  const [hoveredCompanyId, setHoveredCompanyId] = useState<string | null>(null);
  const [sidebarSort, setSidebarSort] = useState<"jobs" | "name" | "stage">("jobs");
  const [sidebarPage, setSidebarPage] = useState<number>(1);
  const SIDEBAR_PAGE_SIZE = 40;

  // Job Board Search & Filters
  const [jobSearch, setJobSearch] = useState("");
  const [jobWorkplace, setJobWorkplace] = useState<string>("all");
  const [jobExperience, setJobExperience] = useState<string>("all");
  const [jobDepartment, setJobDepartment] = useState<string>("all");
  const [jobPage, setJobPage] = useState(1);
  const JOB_PAGE_SIZE = 12;

  // Reset grid & sidebar pages when company filters change
  useEffect(() => {
    setGridPage(1);
    setSidebarPage(1);
  }, [searchQuery, hiringOnly, selectedType, selectedStage, selectedHub]);

  // Reset job page when job filters change
  useEffect(() => {
    setJobPage(1);
  }, [jobSearch, jobWorkplace, jobExperience, jobDepartment]);

  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // Progressive background streaming
  useEffect(() => {
    let isCancelled = false;

    async function loadMoreInBatches() {
      for (let page = 1; page < 15; page += 2) {
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

          if (!isCancelled) {
            setCompanies((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const uniqueNew = newBatch.filter((c) => !existingIds.has(c.id));
              return [...prev, ...uniqueNew];
            });
          }
        } catch {
          break;
        }
      }
    }

    const timer = setTimeout(() => {
      loadMoreInBatches();
    }, 2000);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Server-side keyword search debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    const timer = setTimeout(async () => {
      setIsSearchingServer(true);
      try {
        const res = await fetch(`/api/tech-atlas/companies?q=${encodeURIComponent(searchQuery.trim())}&limit=200`);
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
              const serverMap = new Map(serverResults.map((c) => [c.id, c]));
              const updatedExisting = prev.map((c) => {
                const item = serverMap.get(c.id);
                if (!item) return c;
                return {
                  ...c,
                  ...item,
                  active_jobs_count: Math.max(c.active_jobs_count || 0, item.active_jobs_count || 0),
                };
              });
              const existingIds = new Set(prev.map((c) => c.id));
              const uniqueNew = serverResults.filter((c) => !existingIds.has(c.id));
              return [...uniqueNew, ...updatedExisting];
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

  // Unified Jobs Collection
  const allJobs: UnifiedJob[] = useMemo(() => {
    if (initialJobs && initialJobs.length > 0) {
      return initialJobs;
    }
    const list: UnifiedJob[] = [];
    companies.forEach((c) => {
      (c.jobs || []).forEach((j) => {
        list.push({
          ...j,
          company_title: c.title,
          company_slug: c.slug,
          listing_id: c.id,
          company_type: c.company_type,
          funding_stage: c.funding_stage,
          locality: c.locality,
          city: c.city,
        });
      });
    });
    return list;
  }, [initialJobs, companies]);

  // Filter Jobs by Hub and criteria
  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      // 0. Hub filter for jobs: verify actual job location matches the selected hub
      const isHubInIndia = [
        "bengaluru",
        "hyderabad",
        "delhi-ncr",
        "mumbai",
        "pune",
        "chennai",
        "kolkata",
        "kochi",
      ].includes(selectedHub.id);
      const isRemoteIndia =
        job.workplace_type === "remote" &&
        (job.location_name?.toLowerCase().includes("india") ||
          job.location_name?.toLowerCase().includes("remote")) &&
        isHubInIndia;

      const locMatch =
        jobMatchesLocation(job.location_name, selectedHub.id) ||
        jobMatchesLocation(job.location_name, selectedHub.name) ||
        isRemoteIndia;

      if (!locMatch) {
        return false;
      }

      if (jobWorkplace !== "all" && job.workplace_type !== jobWorkplace) return false;
      if (jobExperience !== "all" && job.experience_level?.toLowerCase() !== jobExperience.toLowerCase()) return false;
      if (jobDepartment !== "all" && !job.department?.toLowerCase().includes(jobDepartment.toLowerCase())) return false;
      if (jobSearch.trim()) {
        const q = jobSearch.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = (job.company_title || "").toLowerCase().includes(q);
        const matchesDept = (job.department || "").toLowerCase().includes(q);
        const matchesLoc = (job.location_name || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesDept && !matchesLoc) return false;
      }
      return true;
    });
  }, [allJobs, selectedHub, jobWorkplace, jobExperience, jobDepartment, jobSearch]);

  const hubCompanyCounts = useMemo(() => {
    const counts: Record<string, number> = { ...(knownHubCounts || {}) };
    for (const hub of GLOBAL_TECH_HUBS) {
      const liveCount = companies.filter((c) => matchesHub(c, hub)).length;
      counts[hub.id] = Math.max(counts[hub.id] || 0, liveCount);
    }
    return counts;
  }, [companies, knownHubCounts]);

  const totalJobPages = Math.ceil(filteredJobs.length / JOB_PAGE_SIZE) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (jobPage - 1) * JOB_PAGE_SIZE;
    return filteredJobs.slice(start, start + JOB_PAGE_SIZE);
  }, [filteredJobs, jobPage]);

  // Filter companies based on tech hub, search, hiring toggle, and stage
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // 0. Tech Hub Filter
      if (!matchesHub(c, selectedHub)) {
        return false;
      }

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
  }, [companies, selectedHub, hiringOnly, selectedType, selectedStage, searchQuery]);

  const totalGridPages = Math.ceil(filteredCompanies.length / GRID_PAGE_SIZE);
  const paginatedCompanies = useMemo(() => {
    const start = (gridPage - 1) * GRID_PAGE_SIZE;
    return filteredCompanies.slice(start, start + GRID_PAGE_SIZE);
  }, [filteredCompanies, gridPage]);

  // Sidebar companies sorting and progressive hydration
  const sidebarSortedCompanies = useMemo(() => {
    const list = [...filteredCompanies];
    if (sidebarSort === "jobs") {
      list.sort((a, b) => {
        const aJobs = Math.max(a.active_jobs_count || 0, a.jobs?.length || 0);
        const bJobs = Math.max(b.active_jobs_count || 0, b.jobs?.length || 0);
        return bJobs - aJobs;
      });
    } else if (sidebarSort === "name") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sidebarSort === "stage") {
      const stageWeight: Record<string, number> = {
        GCC: 10,
        Unicorn: 9,
        Public: 8,
        "Series C+": 7,
        "Series B": 6,
        "Series A": 5,
        Seed: 4,
        Bootstrapped: 3,
      };
      list.sort(
        (a, b) => (stageWeight[b.funding_stage || ""] || 0) - (stageWeight[a.funding_stage || ""] || 0)
      );
    }
    return list;
  }, [filteredCompanies, sidebarSort]);

  const sidebarVisibleCompanies = useMemo(() => {
    return sidebarSortedCompanies.slice(0, sidebarPage * SIDEBAR_PAGE_SIZE);
  }, [sidebarSortedCompanies, sidebarPage, SIDEBAR_PAGE_SIZE]);

  const totalOpenings = useMemo(() => {
    const sumFromCompanies = filteredCompanies.reduce(
      (acc, c) => acc + (c.active_jobs_count || c.jobs?.length || 0),
      0
    );
    return sumFromCompanies > 0 ? sumFromCompanies : filteredJobs.length;
  }, [filteredCompanies, filteredJobs.length]);

  // Convert to PlaceListing format for InteractiveLeafletCanvas component
  const locatedListings: (PlaceListing & { latitude: number; longitude: number })[] = useMemo(() => {
    return filteredCompanies
      .filter((c) => typeof c.latitude === "number" && typeof c.longitude === "number")
      .map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        short_description: c.short_description,
        locality: c.locality,
        city: c.city,
        latitude: c.latitude,
        longitude: c.longitude,
        is_featured: Math.max(c.active_jobs_count || 0, c.jobs?.length || 0) > 0,
        verification_status: "verified",
        category_name: c.company_type ? c.company_type.replace(/_/g, " ").toUpperCase() : "TECH COMPANY",
        website: c.website,
      }));
  }, [filteredCompanies]);

  // Autocomplete suggestions for Tech Atlas
  const companySuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return companies
      .filter((c) => {
        return (
          c.title.toLowerCase().includes(q) ||
          (c.locality && c.locality.toLowerCase().includes(q)) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.tech_stack && c.tech_stack.some((t) => t.toLowerCase().includes(q))) ||
          (c.short_description && c.short_description.toLowerCase().includes(q))
        );
      })
      .slice(0, 8)
      .map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: [c.locality, c.city || selectedHub.name].filter(Boolean).join(", "),
        badge:
          c.funding_stage ||
          (c.company_type ? c.company_type.replace(/_/g, " ").toUpperCase() : "TECH"),
        icon: "💼",
      }));
  }, [companies, searchQuery, selectedHub.name]);

  const handleSelectCompanyWithHub = (comp: CompanyDetail, targetHub?: TechHub) => {
    if (targetHub && targetHub.id !== selectedHub.id) {
      handleSelectHub(targetHub);
    }
    setCompanies((prev) => {
      const idx = prev.findIndex((c) => c.id === comp.id);
      if (idx >= 0) {
        const updated = [...prev];
        const mergedJobsCount = Math.max(
          updated[idx].active_jobs_count || 0,
          comp.active_jobs_count || 0,
          comp.jobs?.length || 0
        );
        updated[idx] = {
          ...updated[idx],
          ...comp,
          active_jobs_count: mergedJobsCount,
          jobs: comp.jobs && comp.jobs.length > 0 ? comp.jobs : updated[idx].jobs,
        };
        return updated;
      }
      return [comp, ...prev];
    });
    setSelectedCompany(comp);
    setSearchQuery("");
  };

  const handleSelectHub = (hubOption: any) => {
    const hub = GLOBAL_TECH_HUBS.find((h) => h.id === hubOption.id) || hubOption;
    setSelectedHub(hub);
    setSelectedCompany(null);
    setHoveredCompanyId(null);
    setSearchQuery("");
    setGridPage(1);
    setSidebarPage(1);
    setJobPage(1);

    // Dynamic on-demand hydration for selected hub if not yet fully in memory
    const loadedForHub = companies.filter((c) => matchesHub(c, hub)).length;
    if (loadedForHub < 200) {
      fetch(`/api/tech-atlas/companies?hub=${hub.id}&limit=2500`)
        .then((res) => res.json())
        .then((data) => {
          if (data.companies && data.companies.length > 0) {
            const hubResults: CompanyDetail[] = data.companies.map((l: any) => ({
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
              const serverMap = new Map(hubResults.map((c) => [c.id, c]));
              const updatedExisting = prev.map((c) => {
                const item = serverMap.get(c.id);
                if (!item) return c;
                return {
                  ...c,
                  ...item,
                  active_jobs_count: Math.max(c.active_jobs_count || 0, item.active_jobs_count || 0),
                };
              });
              const existingIds = new Set(prev.map((c) => c.id));
              const uniqueNew = hubResults.filter((c) => !existingIds.has(c.id));
              return [...uniqueNew, ...updatedExisting];
            });
          }
        })
        .catch(() => {});
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-white dark:bg-[#070b13] font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md sticky top-0 z-[1000] shadow-2xs">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 gap-2 sm:gap-4">
          {/* Logo & Tech Atlas Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group" title="LocaToGo Tech Atlas">
              <BrandLogo size={30} className="group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                LocaToGo<span className="text-[#e26a4f]">.</span>
              </span>
            </Link>

            {/* Live Tech Atlas Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 px-3 py-1 shadow-2xs">
              <span>💼</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Tech Atlas</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            </div>
          </div>

          {/* Desktop Center: Direct Command-K Interactive Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-2 justify-center">
            <TechAtlasSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              companies={companies}
              selectedHub={selectedHub}
              onSelectCompany={handleSelectCompanyWithHub}
              onSelectHub={handleSelectHub}
              totalDatabaseCompanies={totalDatabaseCompanies}
            />
          </div>

          {/* Desktop Right Group: Filters & 3-Way View Modes (md and up) */}
          <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Pulsing "Hiring Now" Toggle */}
            <button
              type="button"
              onClick={() => {
                if (viewMode === "jobs") {
                  setViewMode("map");
                } else {
                  setHiringOnly(!hiringOnly);
                }
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                hiringOnly && viewMode !== "jobs"
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

            {/* View Switcher: Map vs Grid vs Jobs */}
            <div className="flex rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`rounded-full px-2.5 sm:px-3 py-1 transition-all cursor-pointer ${
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
                className={`rounded-full px-2.5 sm:px-3 py-1 transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                ▦ Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("jobs")}
                className={`rounded-full px-2.5 sm:px-3 py-1 transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === "jobs"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <span>💼 Jobs</span>
                <span className="rounded-full bg-emerald-400 text-emerald-950 px-1 py-0.2 text-[9px] font-extrabold">
                  {totalOpenings}
                </span>
              </button>
            </div>

            <ThemeToggle />
            <UserProfileMenu />
          </div>

          {/* Mobile Right Group: Theme & Profile Only (< md) */}
          <div className="md:hidden flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </div>

        {/* Dedicated Mobile Search Bar */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800/60 px-3 py-2 bg-slate-50/70 dark:bg-slate-900/70">
          <TechAtlasSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            companies={companies}
            selectedHub={selectedHub}
            onSelectCompany={handleSelectCompanyWithHub}
            onSelectHub={handleSelectHub}
            totalDatabaseCompanies={totalDatabaseCompanies}
          />
        </div>

        {/* Dedicated Mobile Sub-Bar: View Switcher & Hiring Toggle */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800/60 px-3 py-1.5 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* View Switcher: Map vs Grid vs Jobs */}
          <div className="flex rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`rounded-full px-2.5 py-1 transition-all cursor-pointer ${
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
              className={`rounded-full px-2.5 py-1 transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              ▦ Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("jobs")}
              className={`rounded-full px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "jobs"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>💼 Jobs</span>
              <span className="rounded-full bg-emerald-400 text-emerald-950 px-1 py-0.2 text-[9px] font-extrabold">
                {totalOpenings}
              </span>
            </button>
          </div>

          {/* Pulsing "Hiring Now" Toggle */}
          <button
            type="button"
            onClick={() => {
              if (viewMode === "jobs") {
                setViewMode("map");
              } else {
                setHiringOnly(!hiringOnly);
              }
            }}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 ${
              hiringOnly && viewMode !== "jobs"
                ? "bg-emerald-600 text-white shadow-emerald-500/20 shadow-md ring-1 ring-emerald-400"
                : "border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Hiring ({totalOpenings})</span>
          </button>
        </div>

        {/* Horizontal Metro Tech Hubs Quick Bar */}
        <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#080d17]/90 px-3 sm:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 shrink-0 flex items-center gap-1">
            <span>Tech Hubs:</span>
          </span>
          {GLOBAL_TECH_HUBS.map((hub) => {
            const isSelected = selectedHub.id === hub.id;
            const count = hubCompanyCounts[hub.id] || 0;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => handleSelectHub(hub)}
                className={`shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs font-bold ring-1 ring-indigo-400"
                    : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{hub.flag}</span>
                <span>{hub.name}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      isSelected
                        ? "bg-indigo-700/80 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                    }`}
                  >
                    {count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        {/* VIEW MODE 1: INTERACTIVE MAP WITH SPLIT WORKBENCH */}
        {viewMode === "map" && (
          <div className="relative w-full h-[calc(100vh-104px)] flex overflow-hidden bg-slate-100 dark:bg-slate-900">
            {/* 1. COLLAPSIBLE LEFT DIRECTORY SIDEBAR */}
            <aside
              className={`
                ${isSidebarOpen ? "w-full lg:w-[420px] xl:w-[460px]" : "w-0 overflow-hidden border-none"}
                ${mobileTab === "list" ? "flex" : "hidden lg:flex"}
                shrink-0 h-full flex-col bg-white dark:bg-[#0c121e] border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 z-10 shadow-xl lg:shadow-none
              `}
            >
              {/* Sidebar Header & Filters Bar */}
              <div className="p-3 sm:p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-sm sticky top-0 z-20 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{selectedHub.flag}</span>
                      <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {selectedHub.name} Tech Directory
                      </h2>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {filteredCompanies.length.toLocaleString()} tech companies · {totalOpenings} hiring
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Sort Dropdown */}
                    <select
                      value={sidebarSort}
                      onChange={(e) => setSidebarSort(e.target.value as any)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                      title="Sort companies"
                    >
                      <option value="jobs">Most Jobs</option>
                      <option value="stage">Top Stage</option>
                      <option value="name">Name (A-Z)</option>
                    </select>

                    {/* Collapse Button (Desktop) */}
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(false)}
                      className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Collapse sidebar for full map"
                    >
                      ◀
                    </button>
                  </div>
                </div>

                {/* Horizontal Quick Sector Filter Carousel */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {TECH_SECTORS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedType(s.id)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        selectedType === s.id
                          ? "bg-indigo-600 text-white shadow-2xs font-bold"
                          : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Company Cards Feed */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scroll-smooth">
                {sidebarVisibleCompanies.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <span className="text-3xl">🌐</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {filteredCompanies.length === 0 && !searchQuery.trim()
                        ? `Indexing ${selectedHub.name} Ecosystem`
                        : "No matching companies"}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      {filteredCompanies.length === 0 && !searchQuery.trim()
                        ? `Live directory for ${selectedHub.name} is scheduled for ingestion. Explore active hubs with live jobs below:`
                        : "Try clearing your filters or search query."}
                    </p>
                    {filteredCompanies.length === 0 && !searchQuery.trim() ? (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {GLOBAL_TECH_HUBS.filter((h) => (hubCompanyCounts[h.id] || 0) > 0).map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => handleSelectHub(h)}
                            className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            {h.flag} {h.name} ({hubCompanyCounts[h.id]})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedType("all");
                          setSelectedStage("all");
                          setHiringOnly(false);
                        }}
                        className="mt-2 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  sidebarVisibleCompanies.map((comp) => {
                    const isSelected = selectedCompany?.id === comp.id;
                    const isHovered = hoveredCompanyId === comp.id;
                    const jobCount = Math.max(comp.active_jobs_count || 0, comp.jobs?.length || 0);

                    return (
                      <article
                        key={comp.id}
                        onMouseEnter={() => setHoveredCompanyId(comp.id)}
                        onMouseLeave={() => setHoveredCompanyId(null)}
                        onClick={() => {
                          setSelectedCompany(comp);
                        }}
                        className={`p-3 sm:p-3.5 transition-all cursor-pointer group flex flex-col justify-between gap-2 border-l-4 ${
                          isSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-l-indigo-600"
                            : isHovered
                            ? "bg-slate-50 dark:bg-slate-800/50 border-l-indigo-400"
                            : "bg-white dark:bg-[#0c121e] border-l-transparent hover:bg-slate-50/60 dark:hover:bg-slate-850/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CompanyBrandAvatar
                              title={comp.title}
                              website={comp.website || undefined}
                              size={36}
                              className="rounded-xl shrink-0 shadow-2xs"
                            />
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                {comp.title}
                              </h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                📍 {comp.locality || comp.city || selectedHub.name}
                              </p>
                            </div>
                          </div>

                          {/* Hiring badge */}
                          {jobCount > 0 && (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              {jobCount} {jobCount === 1 ? "job" : "jobs"}
                            </span>
                          )}
                        </div>

                        {/* Badges & Tech Stack */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 uppercase tracking-wider">
                            {(comp.company_type || "Tech").replace(/_/g, " ")}
                          </span>
                          {comp.funding_stage && (
                            <span className="rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-1.5 py-0.5">
                              {comp.funding_stage}
                            </span>
                          )}
                          {comp.employee_range && (
                            <span className="text-slate-400 font-mono">
                              👥 {comp.employee_range}
                            </span>
                          )}
                        </div>

                        {comp.short_description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 leading-snug">
                            {comp.short_description}
                          </p>
                        )}
                      </article>
                    );
                  })
                )}

                {/* Load More Button */}
                {sidebarVisibleCompanies.length < sidebarSortedCompanies.length && (
                  <div className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSidebarPage((p) => p + 1)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Load More Companies ({sidebarSortedCompanies.length - sidebarVisibleCompanies.length} remaining)
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* 2. RIGHT MAP CANVAS */}
            <div className={`flex-1 h-full relative overflow-hidden ${mobileTab === "map" ? "block" : "hidden lg:block"}`}>
              <MapErrorBoundary fallbackText="The tech atlas map canvas encountered an issue. Click below to reload.">
                <InteractiveLeafletCanvas
                  locatedListings={locatedListings}
                  activePlaceId={hoveredCompanyId || selectedCompany?.id || null}
                  setActivePlaceId={(id) => {
                    const comp = companies.find((c) => c.id === id);
                    if (comp) setSelectedCompany(comp);
                  }}
                  hubCenter={{ lat: selectedHub.lat, lng: selectedHub.lng, zoom: selectedHub.zoom }}
                  isTechAtlas={true}
                  searchQuery={searchQuery}
                  initialPerspective="street"
                />
              </MapErrorBoundary>

              {/* Floating Expand Sidebar Button (when sidebar is collapsed on desktop) */}
              {!isSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="absolute top-4 left-4 z-[400] hidden lg:flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 transition-all cursor-pointer"
                >
                  <span>🏢</span>
                  <span>Browse Companies ({filteredCompanies.length.toLocaleString()})</span>
                  <span className="text-indigo-600 dark:text-indigo-400">▶</span>
                </button>
              )}
            </div>

            {/* 3. MOBILE FLOATING SEGMENTED TOGGLE (MAP VS LIST) */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] shadow-2xl">
              <div className="flex items-center rounded-full bg-slate-950/90 text-white p-1 border border-slate-800 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setMobileTab("map")}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    mobileTab === "map"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span>🗺️</span>
                  <span>Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("list")}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    mobileTab === "list"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span>📋</span>
                  <span>List ({filteredCompanies.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: DIRECTORY GRID */}
        {viewMode === "grid" && (
          <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-slate-100">
                  {selectedHub.name} Tech Ecosystem
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Showing {paginatedCompanies.length} of {filteredCompanies.length.toLocaleString()} technology companies in {selectedHub.name}.
                </p>
              </div>

              {/* Company Stage Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Funding:</span>
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
              </div>
            </div>

            {/* Companies Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {paginatedCompanies.map((comp) => {
                const jobCount = comp.jobs?.length || comp.active_jobs_count || 0;
                return (
                  <article
                    key={comp.id}
                    onClick={() => setSelectedCompany(comp)}
                    className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                          {(comp.company_type || "Product").replace(/_/g, " ")}
                        </span>
                        {comp.funding_stage && (
                          <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {comp.funding_stage}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <CompanyBrandAvatar
                          title={comp.title}
                          website={comp.website || undefined}
                          size={40}
                          className="rounded-xl shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors truncate">
                            {comp.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            📍 {comp.locality || comp.city || selectedHub.name}
                          </p>
                        </div>
                      </div>

                      {comp.short_description && (
                        <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
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

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                      {jobCount > 0 ? (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          💼 {jobCount} Active Roles
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No active roles</span>
                      )}

                      <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                        Details →
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Grid Pagination */}
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
        )}

        {/* VIEW MODE 3: LIVE TECH JOBS BOARD */}
        {viewMode === "jobs" && (
          <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 py-6 sm:py-8">
            {/* Jobs Header & Filters Card */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      🟢 Live Verified Openings
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Hub: {selectedHub.name}
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-slate-100">
                    {filteredJobs.length} Active Positions
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Real-time openings synced directly from Greenhouse, Lever, Ashby, and top tech companies in {selectedHub.name}.
                  </p>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Workplace Mode */}
                  <select
                    value={jobWorkplace}
                    onChange={(e) => setJobWorkplace(e.target.value)}
                    className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">🌐 All Workplaces</option>
                    <option value="remote">🟢 Remote</option>
                    <option value="hybrid">🔵 Hybrid</option>
                    <option value="on_site">🏢 On-Site</option>
                  </select>

                  {/* Experience Level */}
                  <select
                    value={jobExperience}
                    onChange={(e) => setJobExperience(e.target.value)}
                    className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">⚡ All Experience</option>
                    <option value="intern">Intern</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead / Staff</option>
                    <option value="executive">Executive</option>
                  </select>

                  {/* Department */}
                  <select
                    value={jobDepartment}
                    onChange={(e) => setJobDepartment(e.target.value)}
                    className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">📂 All Departments</option>
                    <option value="engineering">Engineering</option>
                    <option value="product">Product</option>
                    <option value="design">Design</option>
                    <option value="sales">Sales & BD</option>
                    <option value="marketing">Marketing</option>
                    <option value="data">Data & AI</option>
                  </select>
                </div>
              </div>

              {/* Dedicated Job Search Input */}
              <div className="mt-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400">🔍</span>
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Search roles by title (e.g. Frontend Engineer, Product Manager, Go)..."
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800"
                  />
                  {jobSearch && (
                    <button
                      onClick={() => setJobSearch("")}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tech Partner Spotlight Ad Placement */}
            <div className="mt-5">
              <AdBannerSlot placementLocation="tech_spotlight" variant="tech_spotlight" />
            </div>

            {/* Jobs Grid */}
            <div className="mt-6">
              {paginatedJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedJobs.map((job) => {
                    const company = companies.find(
                      (c) => c.id === job.listing_id || c.title.toLowerCase() === (job.company_title || "").toLowerCase()
                    );
                    return (
                      <div
                        key={job.id}
                        className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Company Header Row */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <CompanyBrandAvatar
                                title={job.company_title || "Company"}
                                website={company?.website || undefined}
                                size={40}
                                className="rounded-xl shadow-2xs"
                              />
                              <div>
                                <button
                                  type="button"
                                  onClick={() => company && setSelectedCompany(company)}
                                  className="text-left font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                >
                                  {job.company_title}
                                </button>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <span>📍 {job.location_name || job.locality || selectedHub.name}</span>
                                </p>
                              </div>
                            </div>

                            {/* Relative Posted Time */}
                            <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 shrink-0">
                              {formatTimeAgo(job.posted_at)}
                            </span>
                          </div>

                          {/* Role Title */}
                          <h3 className="mt-3.5 text-base font-bold text-slate-950 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {job.title}
                          </h3>

                          {/* Badges Row */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                            <span
                              className={`rounded-md px-2 py-0.5 uppercase tracking-wider ${
                                job.workplace_type === "remote"
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : job.workplace_type === "hybrid"
                                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {job.workplace_type === "remote" ? "🟢 Remote" : job.workplace_type === "hybrid" ? "🔵 Hybrid" : "🏢 On-Site"}
                            </span>

                            {job.department && (
                              <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-300">
                                {job.department}
                              </span>
                            )}

                            {job.experience_level && (
                              <span className="rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-2 py-0.5 capitalize">
                                {job.experience_level}
                              </span>
                            )}

                            {job.funding_stage && (
                              <span className="rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5">
                                {job.funding_stage}
                              </span>
                            )}
                          </div>

                          {job.salary_range && (
                            <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              💰 {job.salary_range}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          {company ? (
                            <button
                              type="button"
                              onClick={() => setSelectedCompany(company)}
                              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 cursor-pointer"
                            >
                              🏢 Details →
                            </button>
                          ) : <div />}

                          <div className="flex items-center gap-2">
                            {(job.company_careers_url || (company && (company.careers_url || company.website))) && (
                              <a
                                href={job.company_careers_url || company?.careers_url || company?.website || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 px-3 py-1.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Open Official Company Career Portal"
                              >
                                <span>🏢 Portal</span>
                                <span>↗</span>
                              </a>
                            )}
                            <a
                              href={job.apply_url || job.company_careers_url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>Apply Now</span>
                              <span>↗</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
                  <span className="text-3xl">💼</span>
                  <h4 className="mt-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                    No matching live jobs found
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Try adjusting workplace mode, experience level, or clearing your search term.
                  </p>
                </div>
              )}

              {/* Job Pagination Controls */}
              {totalJobPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={jobPage}
                    totalPages={totalJobPages}
                    totalItems={filteredJobs.length}
                    pageSize={JOB_PAGE_SIZE}
                    onPageChange={(p) => {
                      setJobPage(p);
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
      <CompanyDetailDrawer
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
        onJobsLoaded={(companyId, count, jobs) => {
          setCompanies((prev) =>
            prev.map((c) =>
              c.id === companyId
                ? {
                    ...c,
                    active_jobs_count: count,
                    jobs: jobs,
                  }
                : c
            )
          );
        }}
      />
    </div>
  );
}
