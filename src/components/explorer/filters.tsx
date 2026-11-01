"use client";

import { useState, type ReactNode } from "react";
import { Button, Chip, Select, Sheet, Tab, TabList, Tabs } from "@/components/ui";
import { RollingNumber } from "@/components/explorer/rolling-number";
import { hasJobFilters, LEVELS, NO_JOB_FILTERS, ROLE_CATEGORIES, WORK_MODES, type JobFacets, type JobFilters } from "@/lib/jobs/taxonomy";

export type SortKey = "jobs" | "name" | "stage";

export type Filters = {
  type: string;
  stage: string;
  stack: string;
  hiring: boolean;
  query: string;
  /** Level, work mode, role type and the freshers switch; all answered by the server per hub. */
  job: JobFilters;
};

export type FilterActions = {
  setType: (value: string) => void;
  setStage: (value: string) => void;
  setStack: (value: string) => void;
  setHiring: (value: boolean) => void;
  setQuery: (value: string) => void;
  setJob: (value: JobFilters) => void;
};

export const STAGE_OPTIONS = [
  { id: "all", label: "Any stage" },
  { id: "GCC", label: "MNC GCC" },
  { id: "Unicorn", label: "Unicorn" },
  { id: "Public", label: "Public enterprise" },
  { id: "Series C+", label: "Series C+" },
  { id: "Series B", label: "Series B" },
  { id: "Series A", label: "Series A" },
  { id: "Seed", label: "Seed" },
  { id: "Bootstrapped", label: "Bootstrapped" },
];

export const STACK_OPTIONS = ["all", "AI & ML", "TypeScript", "Python", "React", "Cloud"];

type SectorLike = { id: string; name: string };

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

/** Everything that differs from the defaults, as removable chips. */
export function appliedFilters(filters: Filters, actions: FilterActions, sectors: SectorLike[]) {
  const items: { key: string; label: string; onRemove: () => void }[] = [];
  const { job } = filters;
  if (filters.query.trim()) items.push({ key: "query", label: `“${filters.query.trim()}”`, onRemove: () => actions.setQuery("") });
  if (filters.type !== "all")
    items.push({ key: "type", label: sectors.find((s) => s.id === filters.type)?.name ?? filters.type, onRemove: () => actions.setType("all") });
  if (filters.stage !== "all")
    items.push({ key: "stage", label: STAGE_OPTIONS.find((s) => s.id === filters.stage)?.label ?? filters.stage, onRemove: () => actions.setStage("all") });
  if (filters.stack !== "all") items.push({ key: "stack", label: filters.stack, onRemove: () => actions.setStack("all") });
  if (filters.hiring) items.push({ key: "hiring", label: "Hiring now", onRemove: () => actions.setHiring(false) });
  if (job.freshers) items.push({ key: "freshers", label: "Freshers", onRemove: () => actions.setJob({ ...job, freshers: false }) });
  for (const id of job.levels)
    items.push({ key: `level-${id}`, label: LEVELS.find((item) => item.id === id)?.label ?? id, onRemove: () => actions.setJob({ ...job, levels: job.levels.filter((item) => item !== id) }) });
  for (const id of job.workModes)
    items.push({ key: `work-${id}`, label: WORK_MODES.find((item) => item.id === id)?.label ?? id, onRemove: () => actions.setJob({ ...job, workModes: job.workModes.filter((item) => item !== id) }) });
  for (const id of job.categories)
    items.push({ key: `category-${id}`, label: ROLE_CATEGORIES.find((item) => item.id === id)?.label ?? id, onRemove: () => actions.setJob({ ...job, categories: job.categories.filter((item) => item !== id) }) });
  return items;
}

export function clearAllFilters(actions: FilterActions) {
  actions.setQuery("");
  actions.setType("all");
  actions.setStage("all");
  actions.setStack("all");
  actions.setHiring(false);
  actions.setJob(NO_JOB_FILTERS);
}

type AppliedRowProps = {
  items: ReturnType<typeof appliedFilters>;
  onClear: () => void;
};

export function AppliedFilters({ items, onClear }: AppliedRowProps) {
  if (items.length === 0) return null;
  return (
    <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4" role="list" aria-label="Applied filters">
      {items.map((item) => (
        <span key={item.key} role="listitem" className="shrink-0">
          <Chip selected onRemove={item.onRemove} removeLabel="Remove filter">
            {item.label}
          </Chip>
        </span>
      ))}
      <Button variant="ghost" size="sm" className="shrink-0" onClick={onClear}>
        Clear all
      </Button>
    </div>
  );
}

/** All roles or only the ones open to freshers, as a sliding pill. */
export function FreshersSwitch({ freshers, onChange, count, className }: { freshers: boolean; onChange: (next: boolean) => void; count?: number; className?: string }) {
  return (
    <Tabs variant="pill" value={freshers ? "freshers" : "all"} onValueChange={(value) => onChange(value === "freshers")} className={className}>
      <TabList aria-label="Roles">
        <Tab value="all">All roles</Tab>
        <Tab value="freshers">
          Freshers
          {count !== undefined && count > 0 && <span className="ml-1.5 rounded-full bg-success-soft px-1.5 text-[11px] tabular-nums text-success">{count.toLocaleString("en-US")}</span>}
        </Tab>
      </TabList>
    </Tabs>
  );
}

type FiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  actions: FilterActions;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  resultCount: number;
  appliedCount: number;
  facets: JobFacets;
  facetsLoading: boolean;
};

function Group({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="flex w-full items-baseline justify-between gap-3 text-sm font-medium text-fg">
        {title}
        {hint && <span className="text-xs font-normal text-fg-subtle">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

const VISIBLE_CATEGORIES = 10;

/** Full filter set. A bottom sheet on phones, a side sheet from tablets up. */
export function FiltersSheet({ open, onOpenChange, filters, actions, sort, onSortChange, resultCount, appliedCount, facets, facetsLoading }: FiltersSheetProps) {
  const { job } = filters;
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Role types with roles first, the busiest at the top; anything already chosen stays visible.
  const categories = ROLE_CATEGORIES.map((item) => ({ ...item, count: facets.categories[item.id] ?? 0 }))
    .filter((item) => item.count > 0 || job.categories.includes(item.id))
    .sort((a, b) => b.count - a.count);
  const shownCategories = showAllCategories ? categories : categories.filter((item, index) => index < VISIBLE_CATEGORIES || job.categories.includes(item.id));

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      description={hasJobFilters(job) ? `${facets.roles.toLocaleString("en-US")} matching roles at these companies.` : "Narrow the companies on the map and in the list."}
      footer={
        <>
          <Button variant="secondary" disabled={appliedCount === 0} onClick={() => clearAllFilters(actions)}>
            Clear all
          </Button>
          <Button onClick={() => onOpenChange(false)} aria-busy={facetsLoading || undefined}>
            Show <RollingNumber value={resultCount} className="mx-1" /> companies
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Select label="Sort by" value={sort} onChange={(event) => onSortChange(event.target.value as SortKey)}>
          <option value="jobs">Most open roles</option>
          <option value="stage">Top funding stage</option>
          <option value="name">Name (A to Z)</option>
        </Select>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-fg">Roles</legend>
          <FreshersSwitch freshers={job.freshers} count={facets.freshers} onChange={(next) => actions.setJob({ ...job, freshers: next })} />
        </fieldset>

        <Group title="Level">
          {LEVELS.map((item) => {
            const count = facets.levels[item.id] ?? 0;
            const selected = job.levels.includes(item.id);
            return (
              <Chip key={item.id} selected={selected} count={count} disabled={count === 0 && !selected} onClick={() => actions.setJob({ ...job, levels: toggle(job.levels, item.id) })}>
                {item.label}
              </Chip>
            );
          })}
        </Group>

        <Group title="Work mode">
          {WORK_MODES.map((item) => {
            const count = facets.workplaces[item.id] ?? 0;
            const selected = job.workModes.includes(item.id);
            return (
              <Chip key={item.id} selected={selected} count={count} disabled={count === 0 && !selected} onClick={() => actions.setJob({ ...job, workModes: toggle(job.workModes, item.id) })}>
                {item.label}
              </Chip>
            );
          })}
        </Group>

        <Group title="Role type" hint={categories.length > VISIBLE_CATEGORIES ? `${categories.length} types` : undefined}>
          {shownCategories.map((item) => (
            <Chip key={item.id} selected={job.categories.includes(item.id)} count={item.count} onClick={() => actions.setJob({ ...job, categories: toggle(job.categories, item.id) })}>
              {item.label}
            </Chip>
          ))}
          {categories.length > VISIBLE_CATEGORIES && (
            <Button variant="ghost" size="sm" onClick={() => setShowAllCategories((value) => !value)}>
              {showAllCategories ? "Show fewer" : `Show all ${categories.length}`}
            </Button>
          )}
        </Group>

        <Group title="Hiring">
          <Chip selected={filters.hiring} onClick={() => actions.setHiring(!filters.hiring)}>
            Hiring now
          </Chip>
        </Group>

        <Group title="Funding stage">
          {STAGE_OPTIONS.map((option) => (
            <Chip key={option.id} selected={filters.stage === option.id} onClick={() => actions.setStage(option.id)}>
              {option.label}
            </Chip>
          ))}
        </Group>

        <Group title="Tech stack">
          {STACK_OPTIONS.map((stack) => (
            <Chip key={stack} selected={filters.stack === stack} onClick={() => actions.setStack(stack)}>
              {stack === "all" ? "Any stack" : stack}
            </Chip>
          ))}
        </Group>
      </div>
    </Sheet>
  );
}
