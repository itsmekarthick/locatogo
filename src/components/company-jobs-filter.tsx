"use client";

import { useState, useMemo } from "react";

type Job = {
  id: string;
  title: string;
  department?: string | null;
  location_name?: string | null;
  workplace_type?: string | null;
  experience_level?: string | null;
  salary_range?: string | null;
  apply_url?: string | null;
  posted_at?: string | null;
};

type Props = {
  jobs: Job[];
  companyTitle: string;
  companyCity: string;
  careersUrl?: string | null;
  websiteUrl?: string | null;
  localJobCount: number;
  totalJobCount: number;
};

function jobMatchesLocationClient(
  locationName: string | null | undefined,
  city: string
): boolean {
  if (!locationName) return false;
  const loc = locationName.toLowerCase();
  const c = city.toLowerCase();
  const aliases: Record<string, string[]> = {
    bangalore: ["bengaluru", "bangalore", "blr"],
    bengaluru: ["bengaluru", "bangalore", "blr"],
    mumbai: ["mumbai", "bombay"],
    delhi: ["delhi", "new delhi", "ncr", "gurgaon", "gurugram", "noida"],
    chennai: ["chennai", "madras"],
    hyderabad: ["hyderabad", "secunderabad"],
    pune: ["pune", "puna"],
    kolkata: ["kolkata", "calcutta"],
  };
  const terms = aliases[c] || [c];
  return terms.some((t) => loc.includes(t));
}

export function CompanyJobsFilter({
  jobs,
  companyTitle,
  companyCity,
  careersUrl,
  websiteUrl,
  localJobCount,
  totalJobCount,
}: Props) {
  const [locationScope, setLocationScope] = useState<"place" | "all">(
    localJobCount > 0 ? "place" : "all"
  );
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleSearch, setRoleSearch] = useState("");

  const activePool = useMemo(() => {
    if (locationScope === "place" && localJobCount > 0) {
      return jobs.filter((j) =>
        jobMatchesLocationClient(j.location_name, companyCity)
      );
    }
    return jobs;
  }, [jobs, locationScope, localJobCount, companyCity]);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(activePool.map((j) => j.department).filter(Boolean))
      ) as string[],
    [activePool]
  );

  const filteredJobs = useMemo(() => {
    return activePool.filter((j) => {
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
  }, [activePool, deptFilter, roleSearch]);

  // Reset dept filter when location scope changes
  const handleScopeChange = (scope: "place" | "all") => {
    setLocationScope(scope);
    setDeptFilter("all");
    setRoleSearch("");
  };

  return (
    <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0d1424] p-6 sm:p-8 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💼</span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Verified Open Positions ({filteredJobs.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Live positions verified from official ATS and company career portals
            for {companyTitle}.
          </p>
        </div>

        {careersUrl && (
          <a
            href={careersUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline shrink-0"
          >
            <span>Browse all on careers portal</span>
            <span>↗</span>
          </a>
        )}
      </div>

      {jobs.length > 0 ? (
        <div className="space-y-4">
          {/* Location Toggle */}
          {localJobCount > 0 && localJobCount !== totalJobCount && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-base">📍</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Showing positions in{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {companyCity}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                <button
                  type="button"
                  onClick={() => handleScopeChange("place")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    locationScope === "place"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  📍 {companyCity} ({localJobCount})
                </button>
                <button
                  type="button"
                  onClick={() => handleScopeChange("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    locationScope === "all"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  🌐 All Locations ({totalJobCount})
                </button>
              </div>
            </div>
          )}

          {/* Search Input */}
          {activePool.length > 3 && (
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder={`Search ${activePool.length} roles at ${companyTitle}...`}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-9 pr-8 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setDeptFilter("all")}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  deptFilter === "all"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                All ({activePool.length})
              </button>
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDeptFilter(dept)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    deptFilter === dept
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}

          {/* Job Listings */}
          {filteredJobs.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredJobs.map((job) => (
                <article
                  key={job.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-850/40 rounded-xl px-2 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {job.department && (
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {job.department}
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        📍{" "}
                        <span
                          className={
                            jobMatchesLocationClient(
                              job.location_name,
                              companyCity
                            )
                              ? "font-semibold text-emerald-600 dark:text-emerald-400"
                              : ""
                          }
                        >
                          {job.location_name || companyCity}
                        </span>
                      </span>
                      {job.workplace_type && (
                        <>
                          <span>•</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              job.workplace_type === "remote"
                                ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : job.workplace_type === "hybrid"
                                ? "bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {job.workplace_type.replace(/_/g, " ")}
                          </span>
                        </>
                      )}
                      {job.experience_level && (
                        <>
                          <span>•</span>
                          <span className="text-[11px] text-slate-400 capitalize">
                            {job.experience_level}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {job.salary_range && (
                      <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {job.salary_range}
                      </span>
                    )}
                    {job.apply_url ? (
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800 px-3.5 py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all cursor-pointer"
                      >
                        <span>Apply on Portal</span>
                        <span>↗</span>
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        Application link unavailable
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <span className="text-3xl block">💼</span>
              <p className="font-medium">
                No open roles match your current search or department filter.
              </p>
              {careersUrl && (
                <a
                  href={careersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-all"
                >
                  <span>Explore All Roles on Careers Portal</span>
                  <span>↗</span>
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center space-y-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
          <span className="text-3xl">🎯</span>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Direct Application Ingestion Scheduled
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Individual job positions are being synced from {companyTitle}
            &apos;s official ATS. You can check their official careers page
            directly below:
          </p>
          {careersUrl && (
            <a
              href={careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 transition-colors"
            >
              <span>Open {companyTitle} Careers</span>
              <span>↗</span>
            </a>
          )}
        </div>
      )}
    </section>
  );
}
