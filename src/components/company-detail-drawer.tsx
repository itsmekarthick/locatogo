"use client";

import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { Badge, buttonVariants, Chip, EmptyState, Input, Sheet, Skeleton, SkeletonText, Tab, TabList, TabPanel, Tabs } from "@/components/ui";
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  ClockIcon,
  MapPinIcon,
  SearchIcon,
  StarIcon,
  UsersIcon,
  XIcon,
} from "@/components/ui/icons";
import { IconButton } from "@/components/ui/icon-button";
import { HeartButton } from "@/components/explorer/heart-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { generateUberRideLink } from "@/lib/services/transit-links";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";
import "@/components/explorer/explorer.css";
import type { PlaceListing } from "@/components/modern-directory-explorer";
import { cn } from "@/lib/utils/cn";

const LocationMap = dynamic(() => import("@/components/interactive-leaflet-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

export type CompanyJob = {
  id: string;
  title: string;
  department?: string | null;
  location_name: string;
  workplace_type: "on_site" | "hybrid" | "remote";
  experience_level?: string | null;
  salary_range?: string | null;
  apply_url: string;
  posted_at?: string | null;
};

export type CompanyDetail = {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  address_line_1: string;
  locality?: string | null;
  city?: string | null;
  latitude: number;
  longitude: number;
  website?: string | null;
  careers_url?: string | null;
  company_type?: string | null;
  funding_stage?: string | null;
  employee_range?: string | null;
  tech_stack?: string[] | null;
  founded_year?: number | null;
  active_jobs_count?: number;
  country_code?: string | null;
  jobs?: CompanyJob[];
};

type Review = { id: string; rating: number; body: string | null; created_at: string };

const WORKPLACE_BADGE = {
  remote: { variant: "success", label: "Remote" },
  hybrid: { variant: "accent", label: "Hybrid" },
  on_site: { variant: "neutral", label: "On-site" },
} as const;

export function CompanyDetailDrawer({
  company,
  onClose,
  onJobsLoaded,
  saved,
  onToggleSave,
}: {
  company: CompanyDetail | null;
  onClose: () => void;
  onJobsLoaded?: (companyId: string, count: number, jobs: CompanyJob[]) => void;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  const [tab, setTab] = useState("overview");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [roleSearch, setRoleSearch] = useState<string>("");
  const [locationScope, setLocationScope] = useState<"place" | "all">("place");
  const [dynamicJobs, setDynamicJobs] = useState<CompanyJob[] | null>(null);
  const [allAvailableJobs, setAllAvailableJobs] = useState<CompanyJob[] | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [compact, setCompact] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useRef(false);

  // Keep the last company mounted so the sheet can animate out after `company` becomes null.
  const [lastShown, setLastShown] = useState<CompanyDetail | null>(company);
  if (company && company !== lastShown) setLastShown(company);
  const shown = company ?? lastShown;

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Dynamic job fetcher whenever company changes
  useEffect(() => {
    if (!company) {
      setDynamicJobs(null);
      setAllAvailableJobs(null);
      setIsLoadingJobs(false);
      return;
    }

    setDeptFilter("all");
    setRoleSearch("");
    setReviews(null);
    setCompact(false);
    setTab((company.active_jobs_count ?? 0) > 0 ? "jobs" : "overview");

    // If preloaded with jobs, initialize immediately
    if (company.jobs && company.jobs.length > 0) {
      setDynamicJobs(company.jobs);
      setAllAvailableJobs(company.jobs);
      const hasLocalPreloaded = company.jobs.some((j) =>
        jobMatchesLocation(j.location_name, company.city || "Bangalore")
      );
      setLocationScope(hasLocalPreloaded ? "place" : "all");
    } else {
      setDynamicJobs(null);
      setAllAvailableJobs(null);
      setLocationScope("all");
    }

    const companyId = company.id;
    const companyCity = company.city || "Bangalore";
    let isCancelled = false;

    async function loadJobs() {
      setIsLoadingJobs(true);
      try {
        const res = await fetch(`/api/companies/${companyId}/jobs?city=${encodeURIComponent(companyCity)}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            if (data.allJobs && Array.isArray(data.allJobs)) {
              setAllAvailableJobs(data.allJobs);
            }
            if (data.jobs && Array.isArray(data.jobs)) {
              setDynamicJobs(data.jobs);
              const accurateCount = (data.jobs.length > 0)
                ? (data.total ?? data.allJobs?.length ?? data.jobs.length)
                : 0;
              if (accurateCount > 0) {
                onJobsLoaded?.(companyId, accurateCount, data.jobs);
              }
              const hasMatchingLocal = data.jobs.some((j: any) =>
                jobMatchesLocation(j.location_name, companyCity)
              );
              setLocationScope(hasMatchingLocal ? "place" : "all");
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch company jobs:", err);
      } finally {
        if (!isCancelled) setIsLoadingJobs(false);
      }
    }

    loadJobs();

    return () => {
      isCancelled = true;
    };
  }, [company?.id, company?.city]);

  // Reviews load the first time the tab opens for a company.
  const shownId = shown?.id;
  useEffect(() => {
    if (tab !== "reviews" || !shownId || reviews) return;
    let cancelled = false;
    setReviewsLoading(true);
    createSupabaseBrowserClient()
      .from("place_reviews")
      .select("id, rating, body, created_at")
      .eq("listing_id", shownId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (cancelled) return;
        setReviews((data as Review[] | null) ?? []);
        setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, shownId, reviews]);

  const mapListing = useMemo(
    () =>
      shown
        ? ({
            id: shown.id,
            title: shown.title,
            slug: shown.slug,
            short_description: shown.short_description,
            locality: shown.locality,
            city: shown.city,
            latitude: shown.latitude,
            longitude: shown.longitude,
            is_featured: (shown.active_jobs_count ?? 0) > 0,
            website: shown.website,
            category_name: shown.company_type ? shown.company_type.replace(/_/g, " ").toUpperCase() : "TECH COMPANY",
          } satisfies PlaceListing)
        : null,
    [shown],
  );

  if (!shown) return null;

  const companyCity = shown.city || "Bangalore";
  const rawPool = allAvailableJobs ?? dynamicJobs ?? shown.jobs ?? [];
  const localJobs = rawPool.filter((j) => jobMatchesLocation(j.location_name, companyCity));
  const hasLocalJobs = localJobs.length > 0;

  // Use local jobs if user chose "place" and local jobs exist, otherwise show all jobs
  const jobs = locationScope === "place" && hasLocalJobs ? localJobs : rawPool;
  const departments = Array.from(new Set(jobs.map((j) => j.department).filter(Boolean))) as string[];

  const filteredJobs = jobs.filter((j) => {
    if (deptFilter !== "all" && j.department !== deptFilter) return false;
    if (roleSearch.trim()) {
      const q = roleSearch.toLowerCase();
      const matchTitle = j.title.toLowerCase().includes(q);
      const matchDept = (j.department || "").toLowerCase().includes(q);
      const matchLoc = (j.location_name || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDept && !matchLoc) return false;
    }
    return true;
  });

  const jobsCount = rawPool.length > 0 ? rawPool.length : shown.active_jobs_count || 0;
  const rating = reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  function onBodyScroll(event: UIEvent<HTMLDivElement>) {
    const top = event.currentTarget.scrollTop;
    if (coverRef.current && !reduceMotion.current) coverRef.current.style.transform = `translate3d(0, ${top * 0.4}px, 0)`;
    setCompact(top > 110);
  }

  return (
    <Sheet
      open={company !== null}
      onOpenChange={(open) => !open && onClose()}
      title={shown.title}
      side="responsive"
      width="38rem"
      flush
      onBodyScroll={onBodyScroll}
      header={
        <div className="flex items-center gap-2">
          <span
            aria-hidden={!compact}
            className={cn("flex min-w-0 flex-1 items-center gap-2.5 transition-opacity duration-200", compact ? "opacity-100" : "opacity-0")}
          >
            <CompanyBrandAvatar title={shown.title} website={shown.website} size={32} className="shrink-0 rounded-lg" />
            <span className="truncate font-display text-base font-semibold tracking-tight text-fg">{shown.title}</span>
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {onToggleSave && <HeartButton saved={Boolean(saved)} onToggle={onToggleSave} label={shown.title} />}
            <Link
              href={`/company/${shown.slug}`}
              target="_blank"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              title={`Open the full profile for ${shown.title}`}
            >
              Full page
              <ArrowUpRightIcon className="size-3.5" />
            </Link>
          </div>
        </div>
      }
    >
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-accent-100 to-accent-50 dark:from-accent-900/60 dark:to-accent-950">
        <div ref={coverRef} className="absolute inset-x-0 -top-12 bottom-0 will-change-transform">
          <div aria-hidden="true" className="ex-dots absolute inset-0 opacity-60" />
          <BuildingIcon aria-hidden="true" className="absolute right-6 top-14 size-28 text-accent-text opacity-10" />
        </div>
      </div>

      <div className="px-5 sm:px-6">
        <CompanyBrandAvatar
          title={shown.title}
          website={shown.website}
          size={72}
          className="-mt-9 rounded-2xl border-4 border-surface-2 elev-md"
        />
        <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-fg">{shown.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {(shown.locality || shown.city) && (
            <Badge icon={<MapPinIcon className="size-3.5" />}>{shown.locality || shown.city}</Badge>
          )}
          {shown.funding_stage && <Badge variant="accent">{shown.funding_stage}</Badge>}
          {shown.employee_range && <Badge icon={<UsersIcon className="size-3.5" />}>{shown.employee_range} team</Badge>}
          {shown.founded_year && <Badge>Est. {shown.founded_year}</Badge>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {shown.careers_url && (
            <a href={shown.careers_url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm" })}>
              Careers portal
              <ArrowUpRightIcon className="size-3.5" />
            </a>
          )}
          {shown.website && (
            <a href={shown.website} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Website
              <ArrowUpRightIcon className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <div className="sticky top-0 z-10 border-b border-line bg-surface-2/90 px-3 backdrop-blur-md sm:px-5">
          <TabList aria-label="Company sections">
            <Tab value="overview">Overview</Tab>
            <Tab value="jobs">
              Jobs
              <Badge size="sm" variant="accent">
                {isLoadingJobs && rawPool.length === 0 ? "…" : jobsCount.toLocaleString("en-US")}
              </Badge>
            </Tab>
            <Tab value="location">Location</Tab>
            <Tab value="reviews">Reviews</Tab>
          </TabList>
        </div>

        <TabPanel value="overview" className="space-y-6 px-5 py-6 sm:px-6">
          {shown.short_description && (
            <section>
              <h4 className="text-sm font-medium text-fg">About</h4>
              <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-fg-muted">{shown.short_description}</p>
            </section>
          )}
          {shown.tech_stack && shown.tech_stack.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-fg">Tech stack</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {shown.tech_stack.map((tech) => (
                  <Badge key={tech} className="font-mono">
                    {tech}
                  </Badge>
                ))}
              </div>
            </section>
          )}
          <section>
            <h4 className="text-sm font-medium text-fg">Details</h4>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Type", value: (shown.company_type || "Tech").replace(/_/g, " "), capitalize: true },
                { label: "Stage", value: shown.funding_stage },
                { label: "Team size", value: shown.employee_range },
                { label: "Founded", value: shown.founded_year ? String(shown.founded_year) : null },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label} className="rounded-xl border border-line bg-surface-1 p-3">
                    <dt className="text-xs text-fg-subtle">{item.label}</dt>
                    <dd className={cn("mt-0.5 font-medium text-fg", item.capitalize && "capitalize")}>{item.value}</dd>
                  </div>
                ))}
            </dl>
          </section>
        </TabPanel>

        <TabPanel value="jobs" className="space-y-4 px-5 py-6 sm:px-6">
          {rawPool.length > 0 && (
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-line bg-surface-1 p-3.5 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">
                  {hasLocalJobs ? `Showing roles in ${companyCity}` : `All verified openings (${rawPool.length.toLocaleString("en-US")})`}
                </p>
                <p className="text-xs text-fg-subtle">
                  {hasLocalJobs
                    ? `${localJobs.length.toLocaleString("en-US")} verified openings for ${companyCity}`
                    : `No direct ${companyCity} listings, showing global openings`}
                </p>
              </div>
              {hasLocalJobs && localJobs.length !== rawPool.length && (
                <div className="flex shrink-0 gap-2">
                  <Chip selected={locationScope === "place"} count={localJobs.length} onClick={() => setLocationScope("place")}>
                    {companyCity}
                  </Chip>
                  <Chip selected={locationScope === "all"} count={rawPool.length} onClick={() => setLocationScope("all")}>
                    All
                  </Chip>
                </div>
              )}
            </div>
          )}

          {jobs.length > 3 && (
            <Input
              aria-label="Search roles"
              value={roleSearch}
              onChange={(event) => setRoleSearch(event.target.value)}
              placeholder={`Search ${jobs.length.toLocaleString("en-US")} roles`}
              leading={<SearchIcon />}
              trailing={
                roleSearch ? (
                  <IconButton label="Clear search" size="sm" onClick={() => setRoleSearch("")}>
                    <XIcon />
                  </IconButton>
                ) : undefined
              }
            />
          )}

          {departments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Chip selected={deptFilter === "all"} count={jobs.length} onClick={() => setDeptFilter("all")}>
                All
              </Chip>
              {departments.map((dept) => (
                <Chip key={dept} selected={deptFilter === dept} onClick={() => setDeptFilter(dept)}>
                  {dept}
                </Chip>
              ))}
            </div>
          )}

          {isLoadingJobs && jobs.length === 0 ? (
            <div aria-hidden="true" className="space-y-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="space-y-3 rounded-2xl border border-line p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const badge = WORKPLACE_BADGE[job.workplace_type] ?? WORKPLACE_BADGE.on_site;
                const local = jobMatchesLocation(job.location_name, companyCity);
                return (
                  <article key={job.id} className="space-y-3 rounded-2xl border border-line bg-surface-1 p-4 transition-colors duration-200 hover:border-line-strong">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-display text-base font-semibold tracking-tight text-fg">{job.title}</h4>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
                          <span>{job.department || "Engineering"}</span>
                          <span aria-hidden="true">·</span>
                          <span className={cn("flex items-center gap-1", local && "font-medium text-success")}>
                            <MapPinIcon className="size-3.5" />
                            {job.location_name}
                          </span>
                        </p>
                      </div>
                      <Badge variant={badge.variant} size="sm">
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="flex flex-col justify-between gap-3 border-t border-line pt-3 sm:flex-row sm:items-center">
                      {job.salary_range ? (
                        <span className="text-sm font-medium text-success">{job.salary_range}</span>
                      ) : (
                        <span className="text-sm text-fg-subtle">Compensation not listed</span>
                      )}
                      {job.apply_url ? (
                        <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm" })}>
                          Apply
                          <ArrowUpRightIcon className="size-3.5" />
                        </a>
                      ) : (
                        <span className="text-sm text-fg-subtle">Link unavailable</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<BriefcaseIcon />}
              title={roleSearch.trim() || deptFilter !== "all" ? "No roles match" : "No roles indexed yet"}
              description={
                roleSearch.trim() || deptFilter !== "all"
                  ? "Try a different search or department."
                  : "This company has no individual listings right now."
              }
              action={
                shown.careers_url ? (
                  <a href={shown.careers_url} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
                    Browse the careers portal
                    <ArrowUpRightIcon className="size-4" />
                  </a>
                ) : undefined
              }
            />
          )}
        </TabPanel>

        <TabPanel value="location" className="space-y-4 px-5 py-6 sm:px-6">
          <div className="h-64 overflow-hidden rounded-2xl border border-line">
            {mapListing && (
              <LocationMap
                key={shown.id}
                locatedListings={[mapListing]}
                activePlaceId={null}
                setActivePlaceId={() => {}}
                hubCenter={{ lat: shown.latitude, lng: shown.longitude, zoom: 15 }}
                isTechAtlas
              />
            )}
          </div>
          <p className="flex items-start gap-2 text-sm text-fg-muted">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
            {[shown.address_line_1, shown.locality, shown.city].filter(Boolean).join(", ")}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${shown.latitude},${shown.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Open in Maps
              <ArrowUpRightIcon className="size-3.5" />
            </a>
            <a
              href={generateUberRideLink(shown.latitude, shown.longitude, shown.title, shown.locality)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Get a ride
              <ArrowUpRightIcon className="size-3.5" />
            </a>
          </div>
        </TabPanel>

        <TabPanel value="reviews" className="space-y-4 px-5 py-6 sm:px-6">
          {reviewsLoading || reviews === null ? (
            <div aria-hidden="true" className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <SkeletonText lines={3} />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={<StarIcon />}
              title="No reviews yet"
              description="Be the first to share what it is like to work with or visit this company."
              action={
                <Link href={`/company/${shown.slug}`} target="_blank" className={buttonVariants({ variant: "secondary" })}>
                  Open profile
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              }
            />
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm text-fg-muted">
                <StarIcon className="size-4 fill-current text-warning" />
                <span className="font-medium tabular-nums text-fg">{rating.toFixed(1)}</span>
                <span>
                  from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </p>
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-2xl border border-line bg-surface-1 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex gap-0.5 text-warning" aria-label={`${review.rating} out of 5`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon key={star} className={cn("size-4", star <= review.rating ? "fill-current" : "opacity-30")} />
                        ))}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-fg-subtle">
                        <ClockIcon className="size-3.5" />
                        {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {review.body && <p className="mt-2 text-sm text-fg-muted">{review.body}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </TabPanel>
      </Tabs>

      <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))]" />
    </Sheet>
  );
}
