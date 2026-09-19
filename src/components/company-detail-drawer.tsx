"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";

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
  jobs?: CompanyJob[];
};

export function CompanyDetailDrawer({
  company,
  onClose,
  onJobsLoaded,
}: {
  company: CompanyDetail | null;
  onClose: () => void;
  onJobsLoaded?: (companyId: string, count: number, jobs: CompanyJob[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<"jobs" | "about" | "transit">("jobs");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [roleSearch, setRoleSearch] = useState<string>("");
  const [locationScope, setLocationScope] = useState<"place" | "all">("place");
  const [dynamicJobs, setDynamicJobs] = useState<CompanyJob[] | null>(null);
  const [allAvailableJobs, setAllAvailableJobs] = useState<CompanyJob[] | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);

  // Dynamic job fetcher whenever company changes
  useEffect(() => {
    if (!company) {
      setDynamicJobs(null);
      setAllAvailableJobs(null);
      setIsLoadingJobs(false);
      return;
    }

    setLocationScope("place");
    setDeptFilter("all");
    setRoleSearch("");

    // If preloaded with jobs, initialize immediately
    if (company.jobs && company.jobs.length > 0) {
      setDynamicJobs(company.jobs);
      setAllAvailableJobs(company.jobs);
    } else {
      setDynamicJobs(null);
      setAllAvailableJobs(null);
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
              const accurateCount = data.localCount ?? data.jobs.length;
              onJobsLoaded?.(companyId, accurateCount, data.jobs);
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

  if (!company) return null;

  const companyCity = company.city || "Bangalore";
  const rawPool = allAvailableJobs ?? dynamicJobs ?? company.jobs ?? [];
  const localJobs = rawPool.filter((j) => jobMatchesLocation(j.location_name, companyCity));
  const hasLocalJobs = localJobs.length > 0;

  // Active pool defaults to local jobs matching place selection
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

  const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${company.latitude}&dropoff[longitude]=${company.longitude}&dropoff[nickname]=${encodeURIComponent(
    company.title
  )}`;

  const olaUrl = `https://book.olacabs.com/?lat=${company.latitude}&lng=${company.longitude}&name=${encodeURIComponent(
    company.title
  )}`;

  return (
    <div className="fixed inset-0 z-[1500] flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-white dark:bg-[#0c121e] text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250">
        {/* Header Strip */}
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-start gap-4">
            <CompanyBrandAvatar title={company.title} website={company.website} size={56} className="shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {company.title}
                </h2>
                {company.funding_stage && (
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                    {company.funding_stage}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>📍 {company.locality || company.city}</span>
                {company.employee_range && (
                  <>
                    <span>•</span>
                    <span>👥 {company.employee_range} team</span>
                  </>
                )}
                {company.founded_year && (
                  <>
                    <span>•</span>
                    <span>Est. {company.founded_year}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/company/${company.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all shadow-2xs group cursor-pointer"
              title={`Open full dedicated profile for ${company.title} in a new tab`}
            >
              <span>Full Page</span>
              <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[11px]">↗</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Action / Links Strip */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href={`/company/${company.slug}`}
              target="_blank"
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold"
              title={`Open ${company.title} page`}
            >
              <span>🏢 Company Profile</span>
              <span className="text-[10px]">↗</span>
            </Link>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Website</span>
                <span className="text-[10px]">↗</span>
              </a>
            )}
            {company.careers_url && (
              <a
                href={company.careers_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Careers Portal</span>
                <span className="text-[10px]">↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "jobs"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>💼 Live Openings</span>
            <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
              {isLoadingJobs && jobs.length === 0
                ? "..."
                : hasLocalJobs && locationScope === "place"
                ? localJobs.length
                : jobs.length > 0
                ? jobs.length
                : (company.active_jobs_count || 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "about"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>🏢 About & Tech Stack</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transit")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "transit"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>🚖 1-Click Transit</span>
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LIVE CAREER OPENINGS */}
          {activeTab === "jobs" && (
            <div className="space-y-4">
              {/* Official Company Job Portal Banner */}
              {(company.careers_url || company.website) && (
                <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/80 dark:border-indigo-800/80 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
                      🏢
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        Official Company Job Portal
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Direct openings at {company.title}
                      </p>
                    </div>
                  </div>
                  <a
                    href={company.careers_url || company.website || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all shrink-0 flex items-center gap-1 shadow-xs"
                  >
                    <span>Visit Portal</span>
                    <span>↗</span>
                  </a>
                </div>
              )}

              {/* Place-Aware Location Filter Banner */}
              {rawPool.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-xs shrink-0 shadow-2xs">
                      📍
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {hasLocalJobs ? (
                          <>
                            Showing positions in <span className="font-bold text-indigo-600 dark:text-indigo-400">{companyCity}</span>
                          </>
                        ) : (
                          <>
                            All Verified Openings ({rawPool.length})
                          </>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {hasLocalJobs
                          ? `${localJobs.length} verified openings for ${companyCity}`
                          : `No direct ${companyCity} listings found • Showing global openings`}
                      </p>
                    </div>
                  </div>

                  {rawPool.length > localJobs.length && (
                    <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-xl self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setLocationScope("place")}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          locationScope === "place" && hasLocalJobs
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        📍 {companyCity} ({localJobs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationScope("all")}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          locationScope === "all" || !hasLocalJobs
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        🌐 All Locations ({rawPool.length})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Dedicated Role Search Input */}
              {jobs.length > 3 && (
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400">🔍</span>
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder={`Search ${jobs.length} roles at ${company.title}...`}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {roleSearch && (
                    <button
                      type="button"
                      onClick={() => setRoleSearch("")}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Department Filter Chips */}
              {departments.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pb-2">
                  <button
                    type="button"
                    onClick={() => setDeptFilter("all")}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                      deptFilter === "all"
                        ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    All ({jobs.length})
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setDeptFilter(dept)}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                        deptFilter === dept
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading indicator or Jobs List */}
              {isLoadingJobs && jobs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Fetching verified live openings...</p>
                </div>
              ) : filteredJobs.length > 0 ? (
                <div className="space-y-3">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {job.title}
                          </h4>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                            <span>{job.department || "Engineering"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              <span
                                className={
                                  jobMatchesLocation(job.location_name, companyCity)
                                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                    : ""
                                }
                              >
                                {job.location_name}
                              </span>
                            </span>
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            job.workplace_type === "remote"
                              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                              : job.workplace_type === "hybrid"
                              ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {job.workplace_type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-xs">
                        {job.salary_range ? (
                          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            💰 {job.salary_range}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Competitive salary & equity</span>
                        )}

                        <div className="flex items-center gap-2">
                          <a
                            href={job.apply_url || company.careers_url || company.website || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-slate-900 dark:bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all flex items-center gap-1"
                          >
                            <span>Apply on Portal ↗</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-3xl block mb-2">💼</span>
                  {roleSearch.trim() || deptFilter !== "all"
                    ? "No open roles match your current search or department filter."
                    : "No individual job listings indexed currently."}
                  {company.careers_url && (
                    <div className="mt-4">
                      <a
                        href={company.careers_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Explore All Roles on Direct Careers Portal</span>
                        <span>↗</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ABOUT & TECH STACK */}
          {activeTab === "about" && (
            <div className="space-y-6">
              {company.short_description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Company Overview
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {company.short_description}
                  </p>
                </div>
              )}

              {/* Tech Stack Pills */}
              {company.tech_stack && company.tech_stack.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Engineering Tech Stack
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {company.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                      >
                        ⚡ {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Office Location
                </h4>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  📍 {company.address_line_1}, {company.locality}, {company.city}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: 1-CLICK TRANSIT & RIDE */}
          {activeTab === "transit" && (
            <div className="space-y-5">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Book a direct ride to <strong>{company.title}</strong> preloaded with exact GPS coordinates:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={uberUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl bg-black p-4 text-white hover:opacity-90 transition-all shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <h5 className="text-xs font-bold">Uber</h5>
                      <p className="text-[11px] text-zinc-400">Direct pickup to office gate</p>
                    </div>
                  </div>
                  <span>↗</span>
                </a>

                <a
                  href={olaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl bg-amber-500 p-4 text-slate-950 hover:bg-amber-400 transition-all shadow-md font-bold"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚕</span>
                    <div>
                      <h5 className="text-xs font-bold">Ola / Grab Cabs</h5>
                      <p className="text-[11px] text-amber-950 font-normal">Preloaded GPS drop-off</p>
                    </div>
                  </div>
                  <span>↗</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
