"use client";

import Link from "next/link";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import type { CompanyDetail } from "@/components/company-detail-drawer";
import { Badge, Card, Skeleton } from "@/components/ui";
import { ArrowUpRightIcon, BuildingIcon, MapPinIcon, UsersIcon } from "@/components/ui/icons";
import { HeartButton } from "@/components/explorer/heart-button";
import { cn } from "@/lib/utils/cn";

type CardProps = {
  company: CompanyDetail;
  jobCount: number;
  hubName: string;
  saved: boolean;
  onToggleSave: () => void;
  onSelect: () => void;
  onOpenProfile?: () => void;
};

type ListCardProps = CardProps & {
  selected: boolean;
  highlighted: boolean;
  onHover: (id: string | null) => void;
};

const roleLabel = (count: number) => `${count.toLocaleString("en-US")} ${count === 1 ? "role" : "roles"}`;
const typeLabel = (company: CompanyDetail) => (company.company_type || "tech").replace(/_/g, " ");

/** Compact row for the list pane. Content reflows with the pane width through container queries. */
export function CompanyListCard({
  company,
  jobCount,
  hubName,
  saved,
  selected,
  highlighted,
  onToggleSave,
  onSelect,
  onHover,
  onOpenProfile,
}: ListCardProps) {
  const location = company.locality || company.city || hubName;

  return (
    <article
      data-listing-id={company.id}
      aria-current={selected || undefined}
      onMouseEnter={() => onHover(company.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onSelect}
      className={cn(
        "ex-row @container group relative scroll-mt-16 cursor-pointer border-b border-line px-4 py-3.5 transition-colors duration-200",
        selected ? "bg-accent-soft" : highlighted ? "bg-surface-3" : "hover:bg-surface-3/60",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-3 left-0 w-0.5 origin-center rounded-full bg-accent transition-transform duration-300 ease-emphasized",
          selected ? "scale-y-100" : "scale-y-0",
        )}
      />
      <div className="flex items-start gap-3">
        <CompanyBrandAvatar title={company.title} website={company.website} size={44} className="shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate font-display text-[15px] font-semibold tracking-tight text-fg">
              {company.title}
            </h3>
            <div className="-mr-2 -mt-1.5 flex shrink-0 items-center">
              <Link
                href={`/company/${company.slug}`}
                target="_blank"
                aria-label={`Open ${company.title} profile in a new tab`}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenProfile?.();
                }}
                className="focus-ring grid size-9 place-items-center rounded-full text-fg-subtle opacity-0 transition-ui hover:bg-surface-3 hover:text-fg focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:hidden"
              >
                <ArrowUpRightIcon className="size-4" />
              </Link>
              <HeartButton saved={saved} onToggle={onToggleSave} label={company.title} />
            </div>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-fg-muted">
            <MapPinIcon className="size-3.5 shrink-0 text-fg-subtle" />
            <span className="truncate">{location}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {jobCount > 0 && (
              <Badge variant="success" size="sm" dot>
                {roleLabel(jobCount)}
              </Badge>
            )}
            <Badge size="sm" className="capitalize" icon={<BuildingIcon className="size-3" />}>
              {typeLabel(company)}
            </Badge>
            {company.funding_stage && <Badge size="sm">{company.funding_stage}</Badge>}
            {company.employee_range && (
              <Badge size="sm" icon={<UsersIcon className="size-3" />}>
                {company.employee_range}
              </Badge>
            )}
          </div>
          {company.short_description && (
            <p className="mt-2 hidden line-clamp-2 text-[13px] leading-snug text-fg-muted @sm:block">
              {company.short_description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

const COVERS = [
  "from-accent-100 to-accent-50 dark:from-accent-900/60 dark:to-accent-950",
  "from-success-soft to-surface-3",
  "from-info-soft to-surface-3",
  "from-warning-soft to-surface-3",
  "from-surface-3 to-surface-1",
];

const coverFor = (title: string) => COVERS[title.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % COVERS.length];

/** Card for the grid view: tinted cover with the brand mark, then facts as quiet chips. */
export function CompanyGridCard({ company, jobCount, hubName, saved, onToggleSave, onSelect, onOpenProfile }: CardProps) {
  const location = company.locality || company.city || hubName;

  return (
    <Card interactive padding="none" className="@container group flex h-full flex-col overflow-hidden">
      <div className={cn("relative aspect-[16/7] overflow-hidden bg-gradient-to-br", coverFor(company.title))}>
        <div aria-hidden="true" className="ex-dots absolute inset-0 opacity-50" />
        <div className="ex-fade-in absolute inset-0 grid place-items-center transition-transform duration-500 ease-emphasized motion-safe:group-hover:scale-[1.03]">
          <CompanyBrandAvatar title={company.title} website={company.website} size={56} className="rounded-2xl" />
        </div>
        <Badge size="sm" className="absolute left-3 top-3 bg-surface-1/90 capitalize backdrop-blur-sm">
          {typeLabel(company)}
        </Badge>
        <div className="absolute right-1.5 top-1.5 z-10">
          <HeartButton saved={saved} onToggle={onToggleSave} label={company.title} className="bg-surface-1/80 backdrop-blur-sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight text-fg">
            {/* Stretched button: the whole card opens the drawer and stays keyboard reachable. */}
            <button
              type="button"
              onClick={onSelect}
              className="focus-ring text-left after:absolute after:inset-0 after:content-['']"
            >
              {company.title}
            </button>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
            <MapPinIcon className="size-3.5 shrink-0 text-fg-subtle" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        {company.short_description && (
          <p className="line-clamp-2 text-sm leading-snug text-fg-muted">{company.short_description}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {company.funding_stage && <Badge size="sm">{company.funding_stage}</Badge>}
          {company.employee_range && (
            <Badge size="sm" icon={<UsersIcon className="size-3" />}>
              {company.employee_range}
            </Badge>
          )}
          {(company.tech_stack || []).slice(0, 2).map((tech) => (
            <Badge key={tech} size="sm" className="font-mono">
              {tech}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          {jobCount > 0 ? (
            <Badge variant="success" dot>
              {roleLabel(jobCount)}
            </Badge>
          ) : (
            <span className="text-sm text-fg-subtle">No open roles</span>
          )}
          <Link
            href={`/company/${company.slug}`}
            target="_blank"
            onClick={() => onOpenProfile?.()}
            className="focus-ring relative z-10 inline-flex items-center gap-1 rounded-md text-sm font-medium text-accent-text hover:underline"
          >
            Profile
            <ArrowUpRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function CompanyRowSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-start gap-3 border-b border-line px-4 py-3.5">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2.5 pt-0.5">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CompanyGridSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line bg-surface-1">
      <Skeleton className="aspect-[16/7] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}
