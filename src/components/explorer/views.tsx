"use client";

import Link from "next/link";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import type { CompanyDetail } from "@/components/company-detail-drawer";
import { Badge, Button, buttonVariants, Card, EmptyState, IconButton, Input, Select } from "@/components/ui";
import { ArrowUpRightIcon, BriefcaseIcon, BuildingIcon, MapPinIcon, SearchIcon, SparklesIcon, XIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { CompanyGridCard, CompanyGridSkeleton } from "@/components/explorer/company-card";
import { STAGE_OPTIONS } from "@/components/explorer/filters";
import { RollingNumber } from "@/components/explorer/rolling-number";
import type { UnifiedJob } from "@/lib/constants/tech-hubs";

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ViewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div id="ex-view-scroll" className="h-full overflow-y-auto overscroll-contain bg-surface-0">
      <div className="mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}

type GridViewProps = {
  hubName: string;
  total: number;
  page: number;
  pageSize: number;
  companies: CompanyDetail[];
  loading: boolean;
  stage: string;
  onStage: (stage: string) => void;
  onPage: (page: number) => void;
  jobCount: (company: CompanyDetail) => number;
  saved: Set<string>;
  onToggleSave: (id: string) => void;
  onSelect: (company: CompanyDetail) => void;
};

export function GridView({
  hubName,
  total,
  page,
  pageSize,
  companies,
  loading,
  stage,
  onStage,
  onPage,
  jobCount,
  saved,
  onToggleSave,
  onSelect,
}: GridViewProps) {
  return (
    <ViewFrame>
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{hubName} tech ecosystem</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Showing {companies.length.toLocaleString("en-US")} of <RollingNumber value={total} /> technology companies.
          </p>
        </div>
        <Select
          aria-label="Funding stage"
          value={stage}
          onChange={(event) => onStage(event.target.value)}
          containerClassName="w-full sm:w-52"
        >
          {STAGE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.id === "all" ? "All stages" : option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {companies.length === 0 && loading
          ? Array.from({ length: 8 }, (_, index) => <CompanyGridSkeleton key={index} />)
          : companies.map((company) => (
              <CompanyGridCard
                key={company.id}
                company={company}
                jobCount={jobCount(company)}
                hubName={hubName}
                saved={saved.has(company.id)}
                onToggleSave={() => onToggleSave(company.id)}
                onSelect={() => onSelect(company)}
              />
            ))}
      </div>

      {companies.length === 0 && !loading && (
        <EmptyState
          icon={<BuildingIcon />}
          title="No companies match these filters"
          description="Try a different funding stage or clear your search."
          action={<Button onClick={() => onStage("all")}>Any stage</Button>}
        />
      )}

      <Pagination
        className="mt-8"
        currentPage={page}
        totalPages={Math.ceil(total / pageSize)}
        totalItems={total}
        pageSize={pageSize}
        itemLabel="companies"
        onPageChange={onPage}
      />
    </ViewFrame>
  );
}

type JobsViewProps = {
  hubName: string;
  totalOpenings: number;
  jobs: UnifiedJob[];
  page: number;
  pageSize: number;
  totalPages: number;
  workplace: string;
  experience: string;
  department: string;
  search: string;
  onWorkplace: (value: string) => void;
  onExperience: (value: string) => void;
  onDepartment: (value: string) => void;
  onSearch: (value: string) => void;
  onPage: (page: number) => void;
  companyFor: (job: UnifiedJob) => CompanyDetail | undefined;
  onSelectCompany: (company: CompanyDetail) => void;
};

const WORKPLACE_BADGE = {
  remote: { variant: "success", label: "Remote" },
  hybrid: { variant: "accent", label: "Hybrid" },
  on_site: { variant: "neutral", label: "On-site" },
} as const;

export function JobsView({
  hubName,
  totalOpenings,
  jobs,
  page,
  pageSize,
  totalPages,
  workplace,
  experience,
  department,
  search,
  onWorkplace,
  onExperience,
  onDepartment,
  onSearch,
  onPage,
  companyFor,
  onSelectCompany,
}: JobsViewProps) {
  return (
    <ViewFrame>
      <Card padding="lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="success" dot>
                Live verified openings
              </Badge>
              <span className="text-sm text-fg-subtle">{hubName}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              <RollingNumber value={totalOpenings} /> active positions
            </h2>
            <p className="mt-1 max-w-[60ch] text-sm text-fg-muted">
              Synced from Greenhouse, Lever, Ashby and company career pages in {hubName}.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select aria-label="Workplace" value={workplace} onChange={(event) => onWorkplace(event.target.value)}>
              <option value="all">All workplaces</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on_site">On-site</option>
            </Select>
            <Select aria-label="Experience" value={experience} onChange={(event) => onExperience(event.target.value)}>
              <option value="all">All experience</option>
              <option value="intern">Intern</option>
              <option value="entry">Entry level</option>
              <option value="mid">Mid level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead / Staff</option>
              <option value="executive">Executive</option>
            </Select>
            <Select aria-label="Department" value={department} onChange={(event) => onDepartment(event.target.value)}>
              <option value="all">All departments</option>
              <option value="engineering">Engineering</option>
              <option value="product">Product</option>
              <option value="design">Design</option>
              <option value="sales">Sales and BD</option>
              <option value="marketing">Marketing</option>
              <option value="data">Data and AI</option>
            </Select>
          </div>
        </div>

        <Input
          aria-label="Search roles"
          containerClassName="mt-5"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search roles by title, company or location"
          leading={<SearchIcon />}
          trailing={
            search ? (
              <IconButton label="Clear search" size="sm" onClick={() => onSearch("")}>
                <XIcon />
              </IconButton>
            ) : undefined
          }
        />
      </Card>

      <Link href="/dashboard" className="focus-ring group mt-5 block rounded-2xl">
        <Card interactive variant="raised" className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-accent-soft blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-2xl text-accent-text">
                <SparklesIcon />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-fg">AI resume matching</h3>
                <p className="text-sm text-fg-muted">Upload your resume and let Gemini surface roles that fit.</p>
              </div>
            </div>
            <span className={buttonVariants({ size: "md" })}>Upload resume</span>
          </div>
        </Card>
      </Link>

      <div className="mt-6">
        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {jobs.map((job) => {
              const company = companyFor(job);
              const badge = WORKPLACE_BADGE[job.workplace_type] ?? WORKPLACE_BADGE.on_site;
              const careers = job.company_careers_url || company?.careers_url || company?.website;
              return (
                <Card key={job.id} className="flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <CompanyBrandAvatar
                          title={job.company_title || "Company"}
                          website={company?.website || undefined}
                          size={40}
                          className="shrink-0 rounded-xl"
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            disabled={!company}
                            onClick={() => company && onSelectCompany(company)}
                            className="focus-ring block max-w-full truncate rounded text-left text-sm font-medium text-fg hover:text-accent-text disabled:pointer-events-none"
                          >
                            {job.company_title}
                          </button>
                          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-fg-subtle">
                            <MapPinIcon className="size-3.5 shrink-0" />
                            <span className="truncate">{job.location_name || job.locality || hubName}</span>
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-fg-subtle">{formatTimeAgo(job.posted_at)}</span>
                    </div>

                    <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-fg">{job.title}</h3>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Badge variant={badge.variant} size="sm">
                        {badge.label}
                      </Badge>
                      {job.department && <Badge size="sm">{job.department}</Badge>}
                      {job.experience_level && (
                        <Badge size="sm" className="capitalize">
                          {job.experience_level}
                        </Badge>
                      )}
                      {job.funding_stage && <Badge size="sm">{job.funding_stage}</Badge>}
                    </div>

                    {job.salary_range && <p className="mt-3 text-sm font-medium text-success">{job.salary_range}</p>}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    {company ? (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onSelectCompany(company)}>
                          Details
                        </Button>
                        <Link
                          href={`/company/${company.slug}`}
                          target="_blank"
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          Profile
                          <ArrowUpRightIcon className="size-3.5" />
                        </Link>
                      </div>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-2">
                      {careers && (
                        <a href={careers} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                          Careers
                          <ArrowUpRightIcon className="size-3.5" />
                        </a>
                      )}
                      {job.apply_url ? (
                        <a href={job.apply_url} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm" })}>
                          Apply
                          <ArrowUpRightIcon className="size-3.5" />
                        </a>
                      ) : (
                        <span className="text-sm text-fg-subtle">Link unavailable</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card variant="outline" padding="none">
            <EmptyState
              icon={<BriefcaseIcon />}
              title="No matching live jobs"
              description="Try another workplace mode, experience level or search term."
            />
          </Card>
        )}

        <Pagination
          className="mt-8"
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalOpenings}
          pageSize={pageSize}
          itemLabel="roles"
          onPageChange={onPage}
        />
      </div>
    </ViewFrame>
  );
}
