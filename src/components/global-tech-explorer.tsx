"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { MapCanvasSkeleton } from "@/components/tech-atlas-skeleton";
import { ResumeOnboarding } from "@/components/resume-onboarding";

// Dynamically load interactive Leaflet map canvas without SSR
const InteractiveLeafletCanvas = dynamic(
  () => import("@/components/interactive-leaflet-canvas"),
  {
    ssr: false,
    loading: () => <MapCanvasSkeleton />,
  }
);

export {
  type TechHub,
  type UnifiedJob,
  type CountryInfo,
  GLOBAL_COUNTRIES,
  GLOBAL_TECH_HUBS,
  TECH_SECTORS,
  TECH_STAGES,
  matchesHub,
} from "@/lib/constants/tech-hubs";

import {
  type TechHub,
  type UnifiedJob,
  type CountryInfo,
  GLOBAL_COUNTRIES,
  GLOBAL_TECH_HUBS,
  TECH_SECTORS,
  TECH_STAGES,
  matchesHub,
} from "@/lib/constants/tech-hubs";

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


export function GlobalTechExplorer({
  initialCompanies,
  initialJobs = [],
  totalDatabaseCompanies = 19095,
  currentHub = "bengaluru",
  initialType = "all",
  initialSearchQuery = "",
  knownHubCounts,
  isRootPage = false,
  userProfile = null,
}: {
  initialCompanies: CompanyDetail[];
  initialJobs?: UnifiedJob[];
  totalDatabaseCompanies?: number;
  currentHub?: string;
  initialType?: string;
  initialSearchQuery?: string;
  knownHubCounts?: Record<string, number>;
  isRootPage?: boolean;
  userProfile?: { skills?: string[]; preferred_location?: string } | null;
}) {
  const [selectedHub, setSelectedHub] = useState<TechHub>(
    GLOBAL_TECH_HUBS.find((h) => h.id === currentHub) || GLOBAL_TECH_HUBS[0]
  );
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [companies, setCompanies] = useState<CompanyDetail[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [hiringOnly, setHiringOnly] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>("all");
  const [selectedTechStack, setSelectedTechStack] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"map" | "grid" | "jobs" | "profile">("map");
  const [gridPage, setGridPage] = useState<number>(1);
  const GRID_PAGE_SIZE = 24;

  // Split-Screen Map Workbench States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");
  const [hoveredCompanyId, setHoveredCompanyId] = useState<string | null>(null);
  const [sidebarSort, setSidebarSort] = useState<"jobs" | "name" | "stage">("jobs");
  const [sidebarPage, setSidebarPage] = useState<number>(1);
  const SIDEBAR_PAGE_SIZE = 40;

  // User GPS & Geolocation States
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [flyToUserTrigger, setFlyToUserTrigger] = useState<number>(0);
  const [hubNavTrigger, setHubNavTrigger] = useState<number>(0);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "requesting" | "located" | "denied">("idle");
  const [locationBanner, setLocationBanner] = useState<{
    text: string;
    type: "info" | "success" | "warning";
  } | null>(null);

  // Guard flags to ensure GPS only auto-navigates at initial load and respects user country/city switches
  const hasUserManuallyNavigatedRef = useRef<boolean>(false);
  const nearestHubRef = useRef<TechHub | null>(null);
  const initialGpsPromptAttemptedRef = useRef<boolean>(false);

  // Check if current view is actually on the user's nearest hub
  const isUserAtNearestHub = Boolean(
    userLocation && nearestHubRef.current && selectedHub.id === nearestHubRef.current.id
  );

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
  }, [searchQuery, hiringOnly, selectedType, selectedStage, selectedWorkplace, selectedTechStack, selectedHub]);

  // Request GPS permission and center map on user's nearest tech hub & coordinates
  const requestUserLocation = useCallback((isUserInitiated = false) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      if (isUserInitiated) {
        setLocationBanner({
          text: "GPS geolocation is not supported by your current browser.",
          type: "warning",
        });
        setTimeout(() => setLocationBanner(null), 5000);
      }
      return;
    }

    setGpsStatus("requesting");
    if (isUserInitiated) {
      // User explicitly requested GPS centering -> reset manual navigation lock
      hasUserManuallyNavigatedRef.current = false;
      setLocationBanner({
        text: "📍 Detecting your GPS location...",
        type: "info",
      });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat1 = pos.coords.latitude;
        const lon1 = pos.coords.longitude;
        const userLoc = { lat: lat1, lng: lon1 };
        setUserLocation(userLoc);
        setGpsStatus("located");

        // Calculate closest tech hub using spherical law of haversines
        let closest = GLOBAL_TECH_HUBS[0];
        let minDist = Infinity;
        for (const hub of GLOBAL_TECH_HUBS) {
          const lat2 = hub.lat;
          const lon2 = hub.lng;
          const R = 6371; // Earth's radius in km
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          if (dist < minDist) {
            minDist = dist;
            closest = hub;
          }
        }

        nearestHubRef.current = closest;

        // If the user has already manually changed country or city before GPS finished,
        // do NOT override their manual choice unless they clicked "Near Me" explicitly!
        if (hasUserManuallyNavigatedRef.current && !isUserInitiated) {
          return;
        }

        if (closest) {
          setSelectedHub(closest);
          if (closest.countryCode) {
            setSelectedCountry(closest.countryCode);
          }
          const distLabel = minDist < 50 ? `${Math.round(minDist)} km away` : `${Math.round(minDist)} km from ${closest.name}`;
          setLocationBanner({
            text: `📍 Centered on your location — showing nearest tech hub: ${closest.name}, ${closest.country} (${distLabel})`,
            type: "success",
          });

          // Fetch hub companies on-demand if needed
          fetch(`/api/tech-atlas/companies?hub=${closest.id}&limit=2500`)
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
                  const existingIds = new Set(prev.map((c) => c.id));
                  const uniqueNew = hubResults.filter((c) => !existingIds.has(c.id));
                  return [...uniqueNew, ...prev];
                });
              }
            })
            .catch(() => {});
        }

        // Trigger map animation to fly to user coordinates
        setFlyToUserTrigger((prev) => prev + 1);

        // Auto dismiss banner after 7 seconds
        setTimeout(() => {
          setLocationBanner((curr) => (curr?.type === "success" ? null : curr));
        }, 7000);
      },
      (err) => {
        console.warn("GPS location permission denied or error:", err);
        setGpsStatus("denied");
        if (isUserInitiated) {
          setLocationBanner({
            text: "📍 Location permission was denied or unavailable. You can browse hubs manually.",
            type: "warning",
          });
          setTimeout(() => setLocationBanner(null), 5000);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Request GPS permission ONLY at the time of initial load
  useEffect(() => {
    if (initialGpsPromptAttemptedRef.current) return;
    initialGpsPromptAttemptedRef.current = true;

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      requestUserLocation(false);
    }
  }, [requestUserLocation]);

  // Reset job page when job filters change
  useEffect(() => {
    setJobPage(1);
  }, [jobSearch, jobWorkplace, jobExperience, jobDepartment]);

  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // Fetch initial batch only if not preloaded via SSR
  useEffect(() => {
    if (companies.length > 0) return;
    let isCancelled = false;

    async function loadInitial() {
      try {
        const res = await fetch(`/api/tech-atlas/companies?page=0&limit=500`);
        if (!res.ok || isCancelled) return;
        const data = await res.json();
        const newBatch: CompanyDetail[] = (data.companies || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          slug: l.slug,
          locality: l.locality,
          city: l.city,
          latitude: l.latitude,
          longitude: l.longitude,
          website: l.website,
          careers_url: l.careers_url,
          company_type: l.company_type || "product_saas",
          funding_stage: l.funding_stage || "Product",
          active_jobs_count: l.active_jobs_count || 0,
          jobs: [],
        }));
        if (!isCancelled) {
          setCompanies(newBatch);
        }
      } catch {
        // graceful fallback
      }
    }

    loadInitial();

    return () => {
      isCancelled = true;
    };
  }, [companies.length]);

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
                  ...item,
                  ...c,
                  jobs: c.jobs && c.jobs.length > 0 ? c.jobs : item.jobs,
                  active_jobs_count: c.active_jobs_count !== undefined ? c.active_jobs_count : item.active_jobs_count,
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

  // Compute AI Recommended Jobs
  const recommendedJobs = useMemo(() => {
    if (!userProfile?.skills?.length || allJobs.length === 0) return [];
    
    // Sort allJobs by how many skills match
    const scoredJobs = allJobs.map(job => {
      let score = 0;
      const jobText = `${job.title} ${job.department || ""} ${job.company_title || ""}`.toLowerCase();
      
      userProfile.skills!.forEach(skill => {
        if (jobText.includes(skill.toLowerCase())) {
          score += 1;
        }
      });
      
      if (userProfile.preferred_location && userProfile.preferred_location !== "Remote") {
        const loc = (job.location_name || job.locality || "").toLowerCase();
        if (loc.includes(userProfile.preferred_location.toLowerCase())) {
          score += 2;
        }
      }
      
      return { job, score };
    });
    
    return scoredJobs
      .filter(sj => sj.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(sj => sj.job);
  }, [allJobs, userProfile]);

  // Filter Jobs by Hub and criteria
  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      // 0. Hub filter for jobs: verify actual job location or the company's base location matches the selected hub
      const locMatch =
        selectedHub.id === "all" ||
        jobMatchesLocation(job.location_name, selectedHub.id) ||
        jobMatchesLocation(job.location_name, selectedHub.name) ||
        jobMatchesLocation(job.locality, selectedHub.id) ||
        jobMatchesLocation(job.city, selectedHub.id);

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

  // Aggregate company counts per country
  const countryCompanyCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: companies.length };
    for (const c of companies) {
      let cc = (c.country_code || "").toUpperCase();
      if (!cc) {
        const matched = GLOBAL_TECH_HUBS.find((h) => matchesHub(c, h));
        cc = matched?.countryCode || "IN";
      }
      counts[cc] = (counts[cc] || 0) + 1;
    }
    return counts;
  }, [companies]);

  // Available countries (only showing those with >0 companies or ALL)
  const availableCountries = useMemo(() => {
    return GLOBAL_COUNTRIES.filter((c) => c.code === "ALL" || (countryCompanyCounts[c.code] || 0) > 0);
  }, [countryCompanyCounts]);

  const currentCountryInfo = useMemo(() => {
    return GLOBAL_COUNTRIES.find((c) => c.code === selectedCountry) || GLOBAL_COUNTRIES[0];
  }, [selectedCountry]);

  // Filter hubs based on selected country
  const displayedHubs = useMemo(() => {
    if (selectedCountry === "ALL") {
      return GLOBAL_TECH_HUBS;
    }
    return GLOBAL_TECH_HUBS.filter((h) => h.countryCode === selectedCountry);
  }, [selectedCountry]);

  // Close country dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    }
    if (isCountryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  const handleSelectCountry = (countryCode: string) => {
    hasUserManuallyNavigatedRef.current = true;
    setSelectedCountry(countryCode);
    setIsCountryDropdownOpen(false);
    setLocationBanner(null);

    if (countryCode === "ALL") {
      setHubNavTrigger((prev) => prev + 1);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("country", "ALL");
        window.history.replaceState({}, "", url.toString());
      }
      return;
    }

    const countryInfo = GLOBAL_COUNTRIES.find((c) => c.code === countryCode);
    const targetHub =
      GLOBAL_TECH_HUBS.find((h) => h.id === countryInfo?.defaultHubId) ||
      GLOBAL_TECH_HUBS.find((h) => h.countryCode === countryCode);
    if (targetHub) {
      handleSelectHub(targetHub);
    }
  };

  const totalJobPages = Math.ceil(filteredJobs.length / JOB_PAGE_SIZE) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (jobPage - 1) * JOB_PAGE_SIZE;
    return filteredJobs.slice(start, start + JOB_PAGE_SIZE);
  }, [filteredJobs, jobPage]);

  // Map of accurate jobs per company strictly matching the currently selected tech hub
  const hubJobsCountByCompanyId = useMemo(() => {
    const map = new Map<string, number>();
    filteredJobs.forEach((job) => {
      if (job.listing_id) {
        map.set(job.listing_id, (map.get(job.listing_id) || 0) + 1);
      }
    });
    return map;
  }, [filteredJobs]);

  // Robust location-filtered job count resolver for any company in the active tech hub
  const getCompanyJobCount = useCallback(
    (comp: CompanyDetail): number => {
      // 1. If we have filteredJobs for this hub, that is the authoritative verified per-company count
      const fromFiltered = hubJobsCountByCompanyId.get(comp.id);
      if (typeof fromFiltered === "number" && fromFiltered > 0) {
        return fromFiltered;
      }

      // 2. If company has jobs array in memory, filter strictly by location matching selectedHub
      if (comp.jobs && comp.jobs.length > 0) {
        const localMatches = comp.jobs.filter(
          (j) =>
            jobMatchesLocation(j.location_name, selectedHub.id) ||
            jobMatchesLocation(j.location_name, selectedHub.name)
        );

        if (localMatches.length > 0) {
          return localMatches.length;
        }

        // Company has verified jobs loaded, but NONE match this hub -> 0 local jobs
        return 0;
      }

      // 3. Fallback to active_jobs_count only if the company itself belongs to this hub
      if (matchesHub(comp, selectedHub)) {
        // Prioritize the DB active_jobs_count.
        return comp.active_jobs_count || (comp.jobs?.length || 0);
      }

      return 0;
    },
    [selectedHub, hubJobsCountByCompanyId]
  );

  // Filter companies based on tech hub, search, hiring toggle, and stage
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // 0. Tech Hub Filter
      if (!matchesHub(c, selectedHub)) {
        return false;
      }

      // 1. Hiring filter: only include companies that actually have open positions in this hub
      if (hiringOnly && getCompanyJobCount(c) === 0) {
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

      // 4. Workplace filter
      if (selectedWorkplace !== "all") {
        if (c.jobs && c.jobs.length > 0) {
          const hasWorkplace = c.jobs.some((j) => j.workplace_type === selectedWorkplace);
          if (!hasWorkplace) return false;
        }
      }

      // 5. Tech stack tag filter
      if (selectedTechStack !== "all") {
        const tag = selectedTechStack.toLowerCase().replace(/[^a-z0-9]/g, "");
        const inStack = (c.tech_stack || []).some((t) => t.toLowerCase().replace(/[^a-z0-9]/g, "").includes(tag));
        const inDesc = (c.short_description || "").toLowerCase().includes(selectedTechStack.toLowerCase());
        const inTitle = (c.title || "").toLowerCase().includes(selectedTechStack.toLowerCase());
        if (!inStack && !inDesc && !inTitle) return false;
      }

      // 6. Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchLoc = (c.locality || "").toLowerCase().includes(q);
        const matchTech = (c.tech_stack || []).some((t) => t.toLowerCase().includes(q));
        const matchJobs = (c.jobs || []).some((j) => j.title.toLowerCase().includes(q));
        const matchDesc = (c.short_description || "").toLowerCase().includes(q);
        const matchType = (c.company_type || "").toLowerCase().replace(/_/g, " ").includes(q);
        
        // Also check if the query is "saas" and type is "product_saas"
        const isSaasQuery = q.includes("saas") && (c.company_type || "").includes("saas");
        
        if (!matchTitle && !matchLoc && !matchTech && !matchJobs && !matchDesc && !matchType && !isSaasQuery) return false;
      }

      return true;
    });
  }, [companies, selectedHub, hiringOnly, selectedType, selectedStage, searchQuery, getCompanyJobCount]);

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
        const aJobs = getCompanyJobCount(a);
        const bJobs = getCompanyJobCount(b);
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
  }, [filteredCompanies, sidebarSort, getCompanyJobCount]);

  const sidebarVisibleCompanies = useMemo(() => {
    return sidebarSortedCompanies.slice(0, sidebarPage * SIDEBAR_PAGE_SIZE);
  }, [sidebarSortedCompanies, sidebarPage, SIDEBAR_PAGE_SIZE]);

  const totalOpenings = useMemo(() => {
    // Return the accurate DB sum from our companies
    return filteredCompanies.reduce(
      (acc, c) => acc + getCompanyJobCount(c),
      0
    );
  }, [filteredCompanies, getCompanyJobCount]);

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
        is_featured: getCompanyJobCount(c) > 0,
        verification_status: "verified",
        category_name: c.company_type ? c.company_type.replace(/_/g, " ").toUpperCase() : "TECH COMPANY",
        website: c.website,
      }));
  }, [filteredCompanies, getCompanyJobCount]);

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
          (c.short_description && c.short_description.toLowerCase().includes(q)) ||
          (c.company_type && c.company_type.toLowerCase().replace(/_/g, " ").includes(q)) ||
          (q.includes("saas") && (c.company_type || "").includes("saas"))
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
        updated[idx] = {
          ...updated[idx],
          ...comp,
          active_jobs_count: comp.active_jobs_count ?? updated[idx].active_jobs_count,
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
    hasUserManuallyNavigatedRef.current = true;
    const hub = GLOBAL_TECH_HUBS.find((h) => h.id === hubOption.id) || hubOption;
    setSelectedHub(hub);
    if (hub.countryCode && selectedCountry !== "ALL" && selectedCountry !== hub.countryCode) {
      setSelectedCountry(hub.countryCode);
    }
    setHubNavTrigger((prev) => prev + 1);
    setSelectedCompany(null);
    setHoveredCompanyId(null);
    setSearchQuery("");
    setGridPage(1);
    setSidebarPage(1);
    setJobPage(1);
    setLocationBanner(null);

    // Update URL query parameters without full reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("hub", hub.id);
      if (hub.countryCode) {
        url.searchParams.set("country", hub.countryCode);
      }
      window.history.replaceState({}, "", url.toString());
    }

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
              <BrandLogo size={38} className="group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100"><span className="animate-brand-reveal">LocaToGo<span className="text-[#0ea5e9]">.</span></span>
              </span>
            </Link>
          </div>

          {/* Desktop Center: Direct Command-K Interactive Search Bar */}
          <div className="hidden md:flex flex-1 max-w-4xl mx-2 justify-center">
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
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <span>💼 Jobs</span>
                <span className="rounded-full bg-emerald-400 text-emerald-950 px-1 py-0.2 text-[9px] font-extrabold">
                  {totalOpenings}
                </span>
              </button>
            </div>

            <UserProfileMenu onProfileClick={() => setViewMode("profile")} />
          </div>

          {/* Mobile Right Group: Theme & Profile Only (< md) */}
          <div className="md:hidden flex items-center gap-1.5 shrink-0">
            <UserProfileMenu onProfileClick={() => setViewMode("profile")} />
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
                  ? "bg-cyan-600 text-white shadow-xs"
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

        {/* Hierarchical Country Dropdown -> City Tech Hubs Filter Bar */}
        <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-[#080d17]/95 px-3 sm:px-6 py-2 flex items-center gap-2.5 sm:gap-3 relative z-30">
          {/* 1. Country Selection Dropdown */}
          <div className="relative shrink-0" ref={countryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer focus:outline-hidden ${
                isCountryDropdownOpen
                  ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 ring-2 ring-cyan-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70"
              }`}
              aria-expanded={isCountryDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:inline">
                Country:
              </span>
              <span className="text-sm leading-none">{currentCountryInfo.flag}</span>
              <span className="font-bold text-slate-900 dark:text-white max-w-[120px] sm:max-w-none truncate">
                {currentCountryInfo.name}
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                {(countryCompanyCounts[currentCountryInfo.code] || 0).toLocaleString()}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                  isCountryDropdownOpen ? "rotate-180 text-cyan-500" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu Popover */}
            {isCountryDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-60 sm:w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-md p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/5">
                <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Select Country
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {availableCountries.length} available
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-0.5 no-scrollbar">
                  {availableCountries.map((country) => {
                    const isSelected = selectedCountry === country.code;
                    const count = countryCompanyCounts[country.code] || 0;
                    return (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleSelectCountry(country.code)}
                        className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800/80"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{country.flag}</span>
                          <span>{country.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {count > 0 && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                                isSelected
                                  ? "bg-cyan-200/80 dark:bg-cyan-900/80 text-cyan-800 dark:text-cyan-200 font-bold"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {count.toLocaleString()}
                            </span>
                          )}
                          {isSelected && (
                            <svg
                              className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Divider between Country Dropdown and City Pills */}
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

          {/* 2. City Hubs in Selected Country */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 py-0.5">
            {/* GPS Locate Me Button */}
            <button
              type="button"
              onClick={() => requestUserLocation(true)}
              title={isUserAtNearestHub ? "Map is centered on your GPS location" : "Use GPS location to auto-detect nearest tech hub"}
              className={`shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isUserAtNearestHub
                  ? "bg-emerald-600 text-white shadow-emerald-500/20 ring-1 ring-emerald-400"
                  : gpsStatus === "requesting"
                  ? "bg-cyan-600 text-white animate-pulse"
                  : "border border-cyan-400/80 dark:border-cyan-700/80 bg-cyan-50/90 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-900/60"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isUserAtNearestHub ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
                  </>
                ) : (
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${gpsStatus === "requesting" ? "bg-white animate-ping" : "bg-cyan-500"}`}></span>
                )}
              </span>
              <span>{gpsStatus === "requesting" ? "Locating..." : isUserAtNearestHub ? "📍 Near Me (Active)" : "📍 Near Me"}</span>
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mx-1 shrink-0 flex items-center gap-1">
              <span>City:</span>
            </span>
            {displayedHubs.map((hub) => {
              const isSelected = selectedHub.id === hub.id;
              const count = hubCompanyCounts[hub.id] || 0;
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => handleSelectHub(hub)}
                  className={`shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-cyan-600 text-white shadow-xs font-bold ring-1 ring-cyan-400"
                      : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>{hub.flag}</span>
                  <span>{hub.name}</span>
                  {count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                        isSelected
                          ? "bg-cyan-700/80 text-white"
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
                          ? "bg-cyan-600 text-white shadow-2xs font-bold"
                          : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>

                {/* Advanced Quick Filters: Workplace & Tech Stack Tags */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 dark:border-slate-800/60 no-scrollbar">
                  {/* Workplace Pills */}
                  {[
                    { id: "all", label: "Any Workplace" },
                    { id: "remote", label: "Remote" },
                    { id: "hybrid", label: "Hybrid" },
                    { id: "on_site", label: "On-site" },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWorkplace(w.id)}
                      className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                        selectedWorkplace === w.id
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}

                  <span className="text-slate-300 dark:text-slate-700">|</span>

                  {/* Tech Stack Tags */}
                  {["all", "AI & ML", "TypeScript", "Python", "React", "Cloud"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTechStack(tag)}
                      className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-mono font-medium transition-all cursor-pointer ${
                        selectedTechStack === tag
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {tag === "all" ? "All Stacks" : tag}
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
                            className="rounded-full border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/60 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 transition-colors cursor-pointer"
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
                        className="mt-2 rounded-full bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-cyan-700 transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  sidebarVisibleCompanies.map((comp) => {
                    const isSelected = selectedCompany?.id === comp.id;
                    const isHovered = hoveredCompanyId === comp.id;
                    const jobCount = getCompanyJobCount(comp);

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
                            ? "bg-cyan-50/80 dark:bg-cyan-950/40 border-l-cyan-600"
                            : isHovered
                            ? "bg-slate-50 dark:bg-slate-800/50 border-l-cyan-400"
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
                              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                                {comp.title}
                              </h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                📍 {comp.locality || comp.city || selectedHub.name}
                              </p>
                            </div>
                          </div>

                          {/* Hiring badge & Company Page Link */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {jobCount > 0 && (
                              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {jobCount} {jobCount === 1 ? "job" : "jobs"}
                              </span>
                            )}
                            <Link
                              href={`/company/${comp.slug}`}
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 transition-all text-xs font-bold"
                              title={`Open ${comp.title} page in new tab`}
                            >
                              ↗
                            </Link>
                          </div>
                        </div>

                        {/* Badges & Tech Stack */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold px-1.5 py-0.5 uppercase tracking-wider">
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
              {/* Floating Location Notification Banner */}
              {locationBanner && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[450] max-w-md w-[92%] sm:w-auto px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center justify-between gap-3 border border-cyan-500/40 bg-slate-950/90 text-white animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 truncate">
                    <span>{locationBanner.type === "success" ? "🎯" : locationBanner.type === "warning" ? "⚠️" : "📍"}</span>
                    <span className="truncate">{locationBanner.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationBanner(null)}
                    className="text-slate-400 hover:text-white cursor-pointer shrink-0 text-sm leading-none pl-1"
                    aria-label="Dismiss location banner"
                  >
                    ✕
                  </button>
                </div>
              )}

              <MapErrorBoundary fallbackText="The tech atlas map canvas encountered an issue. Click below to reload.">
                <InteractiveLeafletCanvas
                  locatedListings={locatedListings}
                  activePlaceId={hoveredCompanyId || selectedCompany?.id || null}
                  setActivePlaceId={(id) => {
                    const comp = companies.find((c) => c.id === id);
                    if (comp) setSelectedCompany(comp);
                  }}
                  hubCenter={{ lat: selectedHub.lat, lng: selectedHub.lng, zoom: selectedHub.zoom }}
                  hubNavTrigger={hubNavTrigger}
                  isTechAtlas={true}
                  userLocation={userLocation}
                  setUserLocation={setUserLocation}
                  onLocateMe={() => requestUserLocation(true)}
                  flyToUserTrigger={flyToUserTrigger}
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
                  <span className="text-cyan-600 dark:text-cyan-400">▶</span>
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
                      ? "bg-cyan-600 text-white shadow-xs"
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
                      ? "bg-cyan-600 text-white shadow-xs"
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
                const jobCount = getCompanyJobCount(comp);
                return (
                  <article
                    key={comp.id}
                    onClick={() => setSelectedCompany(comp)}
                    className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-cyan-400 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
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
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 transition-colors truncate">
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

                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/company/${comp.slug}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                          title={`Open ${comp.title} profile page`}
                        >
                          <span>Profile</span>
                          <span className="text-[10px]">↗</span>
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform cursor-pointer">
                          Details →
                        </span>
                      </div>
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
                    {totalOpenings} Active Positions
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
              <button onClick={() => setViewMode("profile")} className="block w-full text-left">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 to-cyan-900 p-6 shadow-md hover:shadow-lg transition-all group">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-400/30 transition-all"></div>
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-400/30 transition-all"></div>
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-2xl shadow-inner group-hover:scale-110 transition-transform">
                        ✨
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">AI Resume Matching</h3>
                        <p className="text-sm text-cyan-100/80">Upload your resume and let Gemini find your perfect roles instantly.</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-indigo-900 shadow-xs group-hover:bg-cyan-50 transition-colors">
                        Upload Resume →
                      </span>
                    </div>
                  </div>
                </div>
              </button>
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
                        className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-cyan-400 transition-all flex flex-col justify-between"
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
                                  className="text-left font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
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
                          <h3 className="mt-3.5 text-base font-bold text-slate-950 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {job.title}
                          </h3>

                          {/* Badges Row */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                            <span
                              className={`rounded-md px-2 py-0.5 uppercase tracking-wider ${
                                job.workplace_type === "remote"
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : job.workplace_type === "hybrid"
                                  ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
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
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedCompany(company)}
                                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 cursor-pointer"
                              >
                                🏢 Details →
                              </button>
                              <Link
                                href={`/company/${company.slug}`}
                                target="_blank"
                                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                title={`Open ${company.title} Profile`}
                              >
                                <span>Profile</span>
                                <span className="text-[10px]">↗</span>
                              </Link>
                            </div>
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
                            {job.apply_url ? (
                              <a
                                href={job.apply_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>Apply Now</span>
                                <span>↗</span>
                              </a>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">
                                Application link unavailable
                              </span>
                            )}
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
                    totalItems={totalOpenings}
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

        {/* VIEW MODE 4: USER PROFILE / RESUME ONBOARDING */}
        {viewMode === "profile" && (
          <div className="p-4 sm:p-6 lg:p-10 mx-auto max-w-4xl w-full h-full overflow-y-auto">
            <div className="mb-6 flex items-center gap-4">
              <button
                onClick={() => setViewMode("map")}
                className="rounded-full bg-slate-100 dark:bg-slate-800 p-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Back to Map"
              >
                ←
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                My Tech Profile
              </h1>
            </div>
            
            <ResumeOnboarding />
            
            {userProfile?.skills && userProfile.skills.length > 0 && (
              <div className="mt-12 mb-8">
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    ✨ AI Recommended Jobs
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Based on your {userProfile.skills.length} skills
                  </span>
                </div>
                
                {recommendedJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedJobs.map((job) => {
                      const company = companies.find((c) => c.id === job.listing_id || c.title.toLowerCase() === (job.company_title || "").toLowerCase());
                      return (
                        <div
                          key={`rec-${job.id}`}
                          className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-cyan-400 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <CompanyBrandAvatar title={job.company_title || "Company"} website={company?.website || undefined} size={36} className="rounded-xl shadow-2xs" />
                                <div>
                                  <button type="button" onClick={() => company && setSelectedCompany(company)} className="text-left font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">
                                    {job.company_title}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <h3 className="mt-3 text-sm font-bold text-slate-950 dark:text-slate-100">{job.title}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                              {job.department && <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-300">{job.department}</span>}
                              {job.workplace_type && <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-300 capitalize">{job.workplace_type}</span>}
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                            {job.apply_url && (
                              <a href={job.apply_url} target="_blank" rel="noreferrer" className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1">
                                <span>Apply Now</span><span>↗</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center">
                    <p className="text-sm text-slate-500">No jobs match your extracted skills perfectly right now.</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-8 text-center text-sm text-slate-500">
              <p>Your resume data is parsed securely and only used for personalized matching.</p>
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
                    active_jobs_count: count > 0 ? count : (c.active_jobs_count || 0),
                    jobs: jobs && jobs.length > 0 ? jobs : c.jobs,
                  }
                : c
            )
          );
        }}
      />
    </div>
  );
}
