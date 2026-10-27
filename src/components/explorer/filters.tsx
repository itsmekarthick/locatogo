"use client";

import { Button, Chip, Select, Sheet } from "@/components/ui";
import { RollingNumber } from "@/components/explorer/rolling-number";

export type SortKey = "jobs" | "name" | "stage";

export type Filters = {
  type: string;
  stage: string;
  workplace: string;
  stack: string;
  hiring: boolean;
  query: string;
};

export type FilterActions = {
  setType: (value: string) => void;
  setStage: (value: string) => void;
  setWorkplace: (value: string) => void;
  setStack: (value: string) => void;
  setHiring: (value: boolean) => void;
  setQuery: (value: string) => void;
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

export const WORKPLACE_OPTIONS = [
  { id: "all", label: "Any workplace" },
  { id: "remote", label: "Remote" },
  { id: "hybrid", label: "Hybrid" },
  { id: "on_site", label: "On-site" },
];

export const STACK_OPTIONS = ["all", "AI & ML", "TypeScript", "Python", "React", "Cloud"];

type SectorLike = { id: string; name: string };

/** Everything that differs from the defaults, as removable chips. */
export function appliedFilters(filters: Filters, actions: FilterActions, sectors: SectorLike[]) {
  const items: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.query.trim()) items.push({ key: "query", label: `“${filters.query.trim()}”`, onRemove: () => actions.setQuery("") });
  if (filters.type !== "all")
    items.push({ key: "type", label: sectors.find((s) => s.id === filters.type)?.name ?? filters.type, onRemove: () => actions.setType("all") });
  if (filters.stage !== "all")
    items.push({ key: "stage", label: STAGE_OPTIONS.find((s) => s.id === filters.stage)?.label ?? filters.stage, onRemove: () => actions.setStage("all") });
  if (filters.workplace !== "all")
    items.push({ key: "workplace", label: WORKPLACE_OPTIONS.find((w) => w.id === filters.workplace)?.label ?? filters.workplace, onRemove: () => actions.setWorkplace("all") });
  if (filters.stack !== "all") items.push({ key: "stack", label: filters.stack, onRemove: () => actions.setStack("all") });
  if (filters.hiring) items.push({ key: "hiring", label: "Hiring now", onRemove: () => actions.setHiring(false) });
  return items;
}

export function clearAllFilters(actions: FilterActions) {
  actions.setQuery("");
  actions.setType("all");
  actions.setStage("all");
  actions.setWorkplace("all");
  actions.setStack("all");
  actions.setHiring(false);
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

type FiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  actions: FilterActions;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  resultCount: number;
  appliedCount: number;
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-fg">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Full filter set. A bottom sheet on phones, a side sheet from tablets up. */
export function FiltersSheet({ open, onOpenChange, filters, actions, sort, onSortChange, resultCount, appliedCount }: FiltersSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      description="Narrow the companies on the map and in the list."
      footer={
        <>
          <Button variant="secondary" disabled={appliedCount === 0} onClick={() => clearAllFilters(actions)}>
            Clear all
          </Button>
          <Button onClick={() => onOpenChange(false)}>
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

        <Group title="Workplace">
          {WORKPLACE_OPTIONS.map((option) => (
            <Chip key={option.id} selected={filters.workplace === option.id} onClick={() => actions.setWorkplace(option.id)}>
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
