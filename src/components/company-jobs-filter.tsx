"use client";

import { useMemo, useState } from "react";
import { ModuleCard } from "@/components/detail/module-card";
import { Badge, Chip, type BadgeVariant } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ArrowUpRightIcon, BriefcaseIcon, MapPinIcon, SearchIcon, XIcon } from "@/components/ui/icons";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";
import { cn } from "@/lib/utils/cn";

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

const PAGE_SIZE = 8;

const WORKPLACE_LABEL: Record<string, string> = { remote: "Remote", hybrid: "Hybrid", on_site: "On-site" };
const WORKPLACE_VARIANT: Record<string, BadgeVariant> = { remote: "success", hybrid: "accent", on_site: "neutral" };

// UTC keeps the server and browser renders identical.
const postedFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function postedLabel(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : postedFormat.format(date);
}

export function CompanyJobsFilter({ jobs, companyTitle, companyCity, careersUrl, websiteUrl }: Props) {
  const localJobs = useMemo(() => jobs.filter((j) => jobMatchesLocation(j.location_name, companyCity)), [jobs, companyCity]);
  const hasLocal = localJobs.length > 0 && localJobs.length !== jobs.length;

  const [scope, setScope] = useState<"place" | "all">(hasLocal ? "place" : "all");
  const [department, setDepartment] = useState("all");
  const [workplace, setWorkplace] = useState("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const pool = scope === "place" && hasLocal ? localJobs : jobs;

  const departments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of pool) if (job.department) counts.set(job.department, (counts.get(job.department) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [pool]);

  const workplaces = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of pool) if (job.workplace_type) counts.set(job.workplace_type, (counts.get(job.workplace_type) ?? 0) + 1);
    return [...counts.entries()];
  }, [pool]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((job) => {
      if (department !== "all" && job.department !== department) return false;
      if (workplace !== "all" && job.workplace_type !== workplace) return false;
      if (!q) return true;
      return [job.title, job.department, job.location_name].some((value) => (value ?? "").toLowerCase().includes(q));
    });
  }, [pool, department, workplace, query]);

  const filtersActive = department !== "all" || workplace !== "all" || query.trim() !== "";
  const shown = filtered.slice(0, visible);
  const outbound = careersUrl || websiteUrl;

  function reset() {
    setDepartment("all");
    setWorkplace("all");
    setQuery("");
    setVisible(PAGE_SIZE);
  }

  const careersLink = outbound && (
    <a href={outbound} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
      {careersUrl ? "Careers portal" : "Website"}
      <ArrowUpRightIcon className="size-4" />
    </a>
  );

  return (
    <ModuleCard
      id="jobs"
      icon={<BriefcaseIcon />}
      title={
        <span className="flex items-center gap-2">
          Open roles
          {jobs.length > 0 && (
            <Badge variant="accent" size="sm">
              {jobs.length.toLocaleString("en-US")}
            </Badge>
          )}
        </span>
      }
      description={`Synced from ${companyTitle}'s applicant tracking system and career pages.`}
      action={jobs.length > 0 ? careersLink : undefined}
    >
      {jobs.length === 0 ? (
        <EmptyState
          className="py-8"
          icon={<BriefcaseIcon />}
          title="No open roles right now"
          description={`We sync ${companyTitle}'s listings regularly. Check their official page for anything we haven't picked up yet.`}
          action={careersLink || undefined}
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            <Input
              aria-label={`Search ${pool.length} roles`}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder={`Search ${pool.length.toLocaleString("en-US")} roles`}
              leading={<SearchIcon />}
              trailing={
                query ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                    className="focus-ring grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-surface-3 hover:text-fg"
                  >
                    <XIcon className="size-4" />
                  </button>
                ) : undefined
              }
            />

            <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5">
              {hasLocal && (
                <>
                  <Chip
                    selected={scope === "place"}
                    leadingIcon={<MapPinIcon className="size-4" />}
                    count={localJobs.length}
                    onClick={() => {
                      setScope("place");
                      reset();
                    }}
                  >
                    {companyCity}
                  </Chip>
                  <Chip
                    selected={scope === "all"}
                    count={jobs.length}
                    onClick={() => {
                      setScope("all");
                      reset();
                    }}
                  >
                    All locations
                  </Chip>
                  <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-line-strong" />
                </>
              )}
              {workplaces.length > 1 &&
                workplaces.map(([type, count]) => (
                  <Chip
                    key={type}
                    selected={workplace === type}
                    count={count}
                    onClick={() => {
                      setWorkplace(workplace === type ? "all" : type);
                      setVisible(PAGE_SIZE);
                    }}
                  >
                    {WORKPLACE_LABEL[type] ?? type.replace(/_/g, " ")}
                  </Chip>
                ))}
              {departments.length > 1 &&
                departments.slice(0, 8).map(([name, count]) => (
                  <Chip
                    key={name}
                    selected={department === name}
                    count={count}
                    onClick={() => {
                      setDepartment(department === name ? "all" : name);
                      setVisible(PAGE_SIZE);
                    }}
                  >
                    {name}
                  </Chip>
                ))}
            </div>
          </div>

          <p aria-live="polite" className="text-xs text-fg-subtle">
            {filtered.length.toLocaleString("en-US")} {filtered.length === 1 ? "role" : "roles"}
            {filtersActive && " match your filters"}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              className="py-8"
              icon={<SearchIcon />}
              title="No roles match those filters"
              description="Try a different department or clear the search to see everything."
              action={
                <Button variant="secondary" onClick={reset}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <ul role="list" className="-mx-2 divide-y divide-line">
                {shown.map((job) => {
                  const local = jobMatchesLocation(job.location_name, companyCity);
                  const posted = postedLabel(job.posted_at);
                  return (
                    <li
                      key={job.id}
                      className="group flex flex-col gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-surface-3/60 focus-within:bg-surface-3/60 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <h3 className="font-medium leading-snug text-fg">{job.title}</h3>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-muted">
                          {job.department && <span>{job.department}</span>}
                          <span className={cn("inline-flex items-center gap-1", local && "text-success")}>
                            <MapPinIcon className="size-3.5" />
                            {job.location_name || companyCity}
                          </span>
                          {job.workplace_type && (
                            <Badge variant={WORKPLACE_VARIANT[job.workplace_type] ?? "neutral"} size="sm">
                              {WORKPLACE_LABEL[job.workplace_type] ?? job.workplace_type.replace(/_/g, " ")}
                            </Badge>
                          )}
                          {job.experience_level && <span className="capitalize text-fg-subtle">{job.experience_level}</span>}
                          {posted && <span className="text-fg-subtle">Posted {posted}</span>}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {job.salary_range && <span className="font-mono text-xs font-medium text-success">{job.salary_range}</span>}
                        {job.apply_url ? (
                          <a
                            href={job.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Apply for ${job.title}`}
                            className={buttonVariants({
                              size: "sm",
                              className:
                                "w-full sm:w-auto sm:pointer-fine:translate-x-1 sm:pointer-fine:opacity-0 sm:pointer-fine:group-hover:translate-x-0 sm:pointer-fine:group-hover:opacity-100 sm:pointer-fine:group-focus-within:translate-x-0 sm:pointer-fine:group-focus-within:opacity-100",
                            })}
                          >
                            Apply
                            <ArrowUpRightIcon className="size-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-fg-subtle">Link unavailable</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {filtered.length > shown.length && (
                <Button variant="secondary" fullWidth onClick={() => setVisible((count) => count + PAGE_SIZE)}>
                  Show more roles ({(filtered.length - shown.length).toLocaleString("en-US")} remaining)
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </ModuleCard>
  );
}
