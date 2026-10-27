"use client";

import {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
  useDeferredValue,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import "@/components/explorer/explorer.css";
import { CompanyDetailDrawer, type CompanyDetail } from "@/components/company-detail-drawer";
import type { PlaceListing } from "@/components/modern-directory-explorer";
import { MapErrorBoundary } from "@/components/map-error-boundary";
import { TechAtlasSearch } from "@/components/tech-atlas-search";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";
import { MapCanvasSkeleton } from "@/components/tech-atlas-skeleton";
import { Badge, Button, Chip, EmptyState } from "@/components/ui";
import { BuildingIcon, PanelLeftIcon, SlidersIcon, XIcon } from "@/components/ui/icons";
import { IconButton } from "@/components/ui/icon-button";
import { CompanyListCard, CompanyRowSkeleton } from "@/components/explorer/company-card";
import { ExplorerHeader, MobileDock } from "@/components/explorer/explorer-header";
import { ExplorerShell, type Pane, type Snap } from "@/components/explorer/explorer-shell";
import {
  AppliedFilters,
  appliedFilters,
  clearAllFilters,
  FiltersSheet,
  type FilterActions,
  type Filters,
} from "@/components/explorer/filters";
import { ListPane } from "@/components/explorer/list-pane";
import { LoadMore } from "@/components/explorer/load-more";
import { PeekCard } from "@/components/explorer/peek-card";
import { RollingNumber } from "@/components/explorer/rolling-number";
import { useFavorites } from "@/components/explorer/use-favorites";
import { useLayoutMode } from "@/components/explorer/use-layout-mode";
import { GridView, JobsView } from "@/components/explorer/views";

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
  GLOBAL_COUNTRIES,
  GLOBAL_TECH_HUBS,
  TECH_SECTORS,
  matchesHub,
} from "@/lib/constants/tech-hubs";

export function GlobalTechExplorer({
  initialCompanies,
  initialJobs = [],
  totalDatabaseCompanies = 19095,
  currentHub = "bengaluru",
  initialType = "all",
  initialSearchQuery = "",
  knownHubCounts,
  isRootPage = false,
}: {
  initialCompanies: CompanyDetail[];
  initialJobs?: UnifiedJob[];
  totalDatabaseCompanies?: number;
  currentHub?: string;
  initialType?: string;
  initialSearchQuery?: string;
  knownHubCounts?: Record<string, number>;
  isRootPage?: boolean;
}) {
  const [selectedHub, setSelectedHub] = useState<TechHub>(
    GLOBAL_TECH_HUBS.find((h) => h.id === currentHub) || GLOBAL_TECH_HUBS[0]
  );
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [companies, setCompanies] = useState<CompanyDetail[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const deferredQuery = useDeferredValue(searchQuery);
  const [isHubLoading, setIsHubLoading] = useState(false);
  const [hiringOnly, setHiringOnly] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>("all");
  const [selectedTechStack, setSelectedTechStack] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"map" | "grid" | "jobs">("map");
  const [gridPage, setGridPage] = useState<number>(1);
  const GRID_PAGE_SIZE = 24;

  // Split-Screen Map Workbench States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
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
        text: "Detecting your GPS location...",
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
            text: `Centered on your location, showing the nearest tech hub: ${closest.name}, ${closest.country} (${distLabel})`,
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
            text: "Location permission was denied or unavailable. You can browse hubs manually.",
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
  const [mobilePeekCompany, setMobilePeekCompany] = useState<CompanyDetail | null>(null);
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

  const handleSelectCountry = (countryCode: string) => {
    hasUserManuallyNavigatedRef.current = true;
    setSelectedCountry(countryCode);
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
      if (deferredQuery.trim()) {
        const q = deferredQuery.toLowerCase();
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
  }, [companies, selectedHub, hiringOnly, selectedType, selectedStage, deferredQuery, getCompanyJobCount]);

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
      setIsHubLoading(true);
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
        .catch(() => {})
        .finally(() => setIsHubLoading(false));
    }
  };

  const layout = useLayoutMode();
  const favorites = useFavorites();
  const listScrollerRef = useRef<HTMLDivElement | null>(null);
  const setListScroller = useCallback((node: HTMLDivElement | null) => {
    listScrollerRef.current = node;
  }, []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [snap, setSnap] = useState<Snap>("peek");
  const [pane, setPane] = useState<Pane>("map");

  const filters: Filters = {
    type: selectedType,
    stage: selectedStage,
    workplace: selectedWorkplace,
    stack: selectedTechStack,
    hiring: hiringOnly,
    query: searchQuery,
  };
  const filterActions: FilterActions = {
    setType: setSelectedType,
    setStage: setSelectedStage,
    setWorkplace: setSelectedWorkplace,
    setStack: setSelectedTechStack,
    setHiring: setHiringOnly,
    setQuery: setSearchQuery,
  };
  const applied = appliedFilters(filters, filterActions, TECH_SECTORS);
  const isLoading = isSearchingServer || isHubLoading || companies.length === 0;

  // Per-sector counts for the active hub, shown on the sector chips.
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const c of companies) {
      if (!matchesHub(c, selectedHub)) continue;
      counts.all += 1;
      const type = c.company_type || "product_saas";
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }, [companies, selectedHub]);

  const bottomInset = layout === "mobile" ? (snap === "half" ? Math.round(window.innerHeight * 0.4) : snap === "peek" ? 112 : 0) : 0;

  const handleSelectCompany = (comp: CompanyDetail) => {
    setSelectedCompany(comp);
    setMobilePeekCompany(null);
  };

  const handlePinHover = (id: string | null) => {
    setHoveredCompanyId(id);
    if (!id) return;
    const scrollToCard = () => {
      const card = document.querySelector(`[data-listing-id="${CSS.escape(id)}"]`);
      const scroller = listScrollerRef.current;
      if (!card || !scroller) return;
      const far = Math.abs(card.getBoundingClientRect().top - scroller.getBoundingClientRect().top) > scroller.clientHeight * 2;
      card.scrollIntoView({ block: far ? "center" : "nearest", behavior: far ? "auto" : "smooth" });
    };
    if (document.querySelector(`[data-listing-id="${CSS.escape(id)}"]`)) {
      scrollToCard();
      return;
    }
    // The list renders in pages, so reveal the page holding this company first.
    const index = sidebarSortedCompanies.findIndex((c) => c.id === id);
    if (index < 0) return;
    setSidebarPage((page) => Math.max(page, Math.ceil((index + 1) / SIDEBAR_PAGE_SIZE)));
    requestAnimationFrame(() => requestAnimationFrame(scrollToCard));
  };

  const [flyToCompanyId, setFlyToCompanyId] = useState<string | null>(null);
  const cardHoverTimer = useRef<number | undefined>(undefined);
  // The short delay stops the map chasing the cursor while the list is being scanned.
  const handleCardHover = (id: string | null) => {
    setHoveredCompanyId(id);
    window.clearTimeout(cardHoverTimer.current);
    cardHoverTimer.current = window.setTimeout(() => setFlyToCompanyId(id), id ? 180 : 0);
  };

  const loadMore = useCallback(() => setSidebarPage((page) => page + 1), []);

  // Filters and view live in the URL so a link reproduces what you are looking at.
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const read = (key: string) => params.get(key);
    if (read("type")) setSelectedType(read("type") as string);
    if (read("stage")) setSelectedStage(read("stage") as string);
    if (read("workplace")) setSelectedWorkplace(read("workplace") as string);
    if (read("stack")) setSelectedTechStack(read("stack") as string);
    if (read("hiring") === "1") setHiringOnly(true);
    if (read("q") && !initialSearchQuery) setSearchQuery(read("q") as string);
    const sort = read("sort");
    if (sort === "name" || sort === "stage") setSidebarSort(sort);
    const view = read("view");
    if (view === "grid" || view === "jobs") setViewMode(view);
    // Runs once on mount to adopt the URL; later changes flow the other way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const sync = (key: string, value: string, fallback: string) => {
        if (value === fallback) url.searchParams.delete(key);
        else url.searchParams.set(key, value);
      };
      sync("type", selectedType, "all");
      sync("stage", selectedStage, "all");
      sync("workplace", selectedWorkplace, "all");
      sync("stack", selectedTechStack, "all");
      sync("hiring", hiringOnly ? "1" : "", "");
      sync("q", searchQuery.trim(), "");
      sync("sort", sidebarSort, "jobs");
      sync("view", viewMode, "map");
      window.history.replaceState(window.history.state, "", url.toString());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [selectedType, selectedStage, selectedWorkplace, selectedTechStack, hiringOnly, searchQuery, sidebarSort, viewMode]);

  // Leaving for a company page remembers the list position; coming back restores it once.
  const restoredRef = useRef(false);
  const rememberScroll = () => {
    sessionStorage.setItem(
      "locatogo_explorer_restore",
      JSON.stringify({ hub: selectedHub.id, top: listScrollerRef.current?.scrollTop ?? 0, page: sidebarPage, at: Date.now() }),
    );
  };
  useEffect(() => {
    if (restoredRef.current || viewMode !== "map") return;
    restoredRef.current = true;
    const raw = sessionStorage.getItem("locatogo_explorer_restore");
    if (!raw) return;
    sessionStorage.removeItem("locatogo_explorer_restore");
    try {
      const saved = JSON.parse(raw) as { hub: string; top: number; page: number; at: number };
      if (saved.hub !== selectedHub.id || Date.now() - saved.at > 30 * 60 * 1000) return;
      setSidebarPage(saved.page);
      requestAnimationFrame(() => requestAnimationFrame(() => listScrollerRef.current?.scrollTo({ top: saved.top })));
    } catch {}
  }, [viewMode, selectedHub.id]);

  const summary = (
    <>
      <RollingNumber value={filteredCompanies.length} /> companies in {selectedHub.name}
      {applied.length > 0 && ` · ${applied.length} ${applied.length === 1 ? "filter" : "filters"}`}
    </>
  );

  const listHeader = (
    <div className="space-y-3 px-4 pb-3 pt-2 md:pt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-semibold tracking-tight text-fg">{selectedHub.name} tech directory</h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            <RollingNumber value={filteredCompanies.length} /> companies · <RollingNumber value={totalOpenings} /> hiring
          </p>
        </div>
        <IconButton label="Collapse list" tooltipSide="bottom" size="sm" className="hidden lg:inline-flex" onClick={() => setIsSidebarOpen(false)}>
          <PanelLeftIcon />
        </IconButton>
      </div>

      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4">
        {TECH_SECTORS.map((sector) => (
          <Chip
            key={sector.id}
            selected={selectedType === sector.id}
            count={sectorCounts[sector.id === "all" ? "all" : sector.id] || undefined}
            onClick={() => setSelectedType(sector.id)}
            className="shrink-0"
          >
            {sector.name}
          </Chip>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          leadingIcon={<SlidersIcon className="size-4" />}
          onClick={() => setFiltersOpen(true)}
        >
          Filters
          {applied.length > 0 && (
            <Badge size="sm" variant="accent">
              {applied.length}
            </Badge>
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <AppliedFilters items={applied} onClear={() => clearAllFilters(filterActions)} />
        </div>
      </div>
    </div>
  );

  const listBody =
    sidebarVisibleCompanies.length === 0 ? (
      companies.length === 0 ? (
        <div aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <CompanyRowSkeleton key={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BuildingIcon />}
          title={filteredCompanies.length === 0 && !searchQuery.trim() ? `Indexing the ${selectedHub.name} ecosystem` : "No matching companies"}
          description={
            filteredCompanies.length === 0 && !searchQuery.trim()
              ? "This hub is scheduled for ingestion. Explore hubs that already have live data:"
              : "Try clearing your filters or search query."
          }
          action={
            filteredCompanies.length === 0 && !searchQuery.trim() ? (
              <div className="flex flex-wrap justify-center gap-2">
                {GLOBAL_TECH_HUBS.filter((hub) => (hubCompanyCounts[hub.id] || 0) > 0).map((hub) => (
                  <Chip key={hub.id} count={hubCompanyCounts[hub.id]} onClick={() => handleSelectHub(hub)}>
                    {hub.name}
                  </Chip>
                ))}
              </div>
            ) : (
              <Button onClick={() => clearAllFilters(filterActions)}>Reset filters</Button>
            )
          }
        />
      )
    ) : (
      <>
        {sidebarVisibleCompanies.map((comp) => (
          <CompanyListCard
            key={comp.id}
            company={comp}
            jobCount={getCompanyJobCount(comp)}
            hubName={selectedHub.name}
            selected={selectedCompany?.id === comp.id}
            highlighted={hoveredCompanyId === comp.id}
            saved={favorites.saved.has(comp.id)}
            onToggleSave={() => favorites.toggle(comp.id)}
            onSelect={() => handleSelectCompany(comp)}
            onHover={handleCardHover}
            onOpenProfile={rememberScroll}
          />
        ))}
        {sidebarVisibleCompanies.length < sidebarSortedCompanies.length && (
          <LoadMore onVisible={loadMore} rootRef={listScrollerRef} version={sidebarVisibleCompanies.length} />
        )}
        <div className="h-20 md:h-4" />
      </>
    );

  return (
    <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-surface-0 font-sans text-fg antialiased">
      <ExplorerHeader
        renderSearch={() => (
          <TechAtlasSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            companies={companies}
            selectedHub={selectedHub}
            onSelectCompany={handleSelectCompanyWithHub}
            onSelectHub={handleSelectHub}
            totalDatabaseCompanies={totalDatabaseCompanies}
          />
        )}
        viewMode={viewMode}
        onViewMode={setViewMode}
        hiringOnly={hiringOnly}
        totalOpenings={totalOpenings}
        onToggleHiring={() => {
          if (viewMode === "jobs") setViewMode("map");
          else setHiringOnly(!hiringOnly);
        }}
        countries={availableCountries}
        countryCounts={countryCompanyCounts}
        selectedCountry={currentCountryInfo}
        onSelectCountry={handleSelectCountry}
        hubs={displayedHubs}
        hubCounts={hubCompanyCounts}
        selectedHubId={selectedHub.id}
        onSelectHub={handleSelectHub}
        gpsRequesting={gpsStatus === "requesting"}
        atNearestHub={isUserAtNearestHub}
        onLocate={() => requestUserLocation(true)}
      />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        {viewMode === "map" && (
          <ExplorerShell
            snap={snap}
            onSnapChange={setSnap}
            pane={pane}
            onPaneChange={setPane}
            listOpen={isSidebarOpen}
            list={
              <ListPane
                header={listHeader}
                pill={summary}
                loading={isLoading}
                scrollLocked={layout === "mobile" && snap === "peek"}
                onScroller={setListScroller}
              >
                {listBody}
              </ListPane>
            }
            map={
              <MapErrorBoundary fallbackText="The tech atlas map canvas encountered an issue. Click below to reload.">
                <InteractiveLeafletCanvas
                  locatedListings={locatedListings}
                  activePlaceId={selectedCompany?.id || mobilePeekCompany?.id || null}
                  highlightedPlaceId={hoveredCompanyId}
                  flyToPlaceId={flyToCompanyId}
                  onHoverPlace={handlePinHover}
                  setActivePlaceId={(id) => {
                    const comp = companies.find((c) => c.id === id);
                    if (!comp) return;
                    if (layout === "desktop") {
                      setSelectedCompany(comp);
                    } else {
                      setMobilePeekCompany(comp);
                      setSnap("peek");
                    }
                  }}
                  onMapClick={() => setMobilePeekCompany(null)}
                  hubCenter={{ lat: selectedHub.lat, lng: selectedHub.lng, zoom: selectedHub.zoom }}
                  hubNavTrigger={hubNavTrigger}
                  isTechAtlas={true}
                  userLocation={userLocation}
                  setUserLocation={setUserLocation}
                  onLocateMe={() => requestUserLocation(true)}
                  flyToUserTrigger={flyToUserTrigger}
                  searchQuery={searchQuery}
                  initialPerspective="street"
                  bottomInset={bottomInset}
                />
              </MapErrorBoundary>
            }
            mapOverlay={
              <>
                {locationBanner && (
                  <div
                    role="status"
                    className="glass elev-lg absolute left-1/2 top-3 z-30 flex w-[92%] max-w-md -translate-x-1/2 items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 text-sm text-fg sm:top-4 sm:w-auto"
                  >
                    <span className="min-w-0 flex-1 truncate">{locationBanner.text}</span>
                    <IconButton label="Dismiss" size="sm" tooltip={false} onClick={() => setLocationBanner(null)}>
                      <XIcon />
                    </IconButton>
                  </div>
                )}
                {!isSidebarOpen && (
                  <div className="absolute left-4 top-4 z-30 hidden lg:block">
                    <Button
                      variant="secondary"
                      className="elev-lg"
                      leadingIcon={<PanelLeftIcon className="size-4" />}
                      onClick={() => setIsSidebarOpen(true)}
                    >
                      Browse {filteredCompanies.length.toLocaleString("en-US")} companies
                    </Button>
                  </div>
                )}
              </>
            }
            peek={
              mobilePeekCompany ? (
                <PeekCard
                  company={mobilePeekCompany}
                  hubName={selectedHub.name}
                  onOpen={() => handleSelectCompany(mobilePeekCompany)}
                  onClose={() => setMobilePeekCompany(null)}
                />
              ) : null
            }
          />
        )}

        {viewMode === "grid" && (
          <GridView
            hubName={selectedHub.name}
            total={filteredCompanies.length}
            page={gridPage}
            pageSize={GRID_PAGE_SIZE}
            companies={paginatedCompanies}
            loading={isLoading}
            stage={selectedStage}
            onStage={setSelectedStage}
            onPage={(page) => {
              setGridPage(page);
              document.getElementById("ex-view-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            jobCount={getCompanyJobCount}
            saved={favorites.saved}
            onToggleSave={favorites.toggle}
            onSelect={handleSelectCompany}
          />
        )}

        {viewMode === "jobs" && (
          <JobsView
            hubName={selectedHub.name}
            totalOpenings={totalOpenings}
            jobs={paginatedJobs}
            page={jobPage}
            pageSize={JOB_PAGE_SIZE}
            totalPages={totalJobPages}
            workplace={jobWorkplace}
            experience={jobExperience}
            department={jobDepartment}
            search={jobSearch}
            onWorkplace={setJobWorkplace}
            onExperience={setJobExperience}
            onDepartment={setJobDepartment}
            onSearch={setJobSearch}
            onPage={(page) => {
              setJobPage(page);
              document.getElementById("ex-view-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            companyFor={(job) =>
              companies.find((c) => c.id === job.listing_id || c.title.toLowerCase() === (job.company_title || "").toLowerCase())
            }
            onSelectCompany={handleSelectCompany}
          />
        )}
      </main>

      <MobileDock viewMode={viewMode} onViewMode={setViewMode} totalOpenings={totalOpenings} />

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        actions={filterActions}
        sort={sidebarSort}
        onSortChange={setSidebarSort}
        resultCount={filteredCompanies.length}
        appliedCount={applied.length}
      />

      <CompanyDetailDrawer
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
        saved={selectedCompany ? favorites.saved.has(selectedCompany.id) : false}
        onToggleSave={selectedCompany ? () => favorites.toggle(selectedCompany.id) : undefined}
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
