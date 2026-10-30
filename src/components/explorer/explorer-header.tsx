"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { Chip, Tab, TabList, Tabs } from "@/components/ui";
import {
  BriefcaseIcon,
  CheckIcon,
  ChevronDownIcon,
  GridIcon,
  LocateIcon,
  MapIcon,
} from "@/components/ui/icons";
import { RollingNumber } from "@/components/explorer/rolling-number";
import type { CountryInfo, TechHub } from "@/lib/constants/tech-hubs";
import { cn } from "@/lib/utils/cn";

export type ViewMode = "map" | "grid" | "jobs";

type CountryPickerProps = {
  countries: CountryInfo[];
  counts: Record<string, number>;
  selected: CountryInfo;
  onSelect: (code: string) => void;
};

function CodeChip({ code, active }: { code: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 font-mono text-[10px] leading-none",
        active ? "bg-accent-soft text-accent-text" : "bg-surface-3 text-fg-subtle",
      )}
    >
      {code === "ALL" ? "ALL" : code}
    </span>
  );
}

function CountryPicker({ countries, counts, selected, onSelect }: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "focus-ring inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-ui pointer-coarse:h-11",
          open ? "border-accent bg-accent-soft text-accent-text" : "border-line-strong bg-surface-1 text-fg hover:bg-surface-3",
        )}
      >
        <CodeChip code={selected.code} active={open} />
        <span className="max-w-[7.5rem] truncate sm:max-w-none">{selected.name}</span>
        <ChevronDownIcon className={cn("size-4 text-fg-subtle transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Country"
          className="absolute left-0 top-full z-[var(--z-dropdown)] mt-2 w-64 rounded-2xl border border-line bg-surface-2 p-1.5 elev-lg"
        >
          <div className="max-h-72 space-y-0.5 overflow-y-auto overscroll-contain">
            {countries.map((country) => {
              const active = country.code === selected.code;
              const count = counts[country.code] || 0;
              return (
                <button
                  key={country.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onSelect(country.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "focus-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2.5 text-left text-sm transition-colors duration-150",
                    active ? "bg-accent-soft text-accent-text" : "text-fg hover:bg-surface-3",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <CodeChip code={country.code} active={active} />
                    <span className="truncate">{country.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-fg-subtle">
                    {count > 0 && count.toLocaleString("en-US")}
                    {active && <CheckIcon className="size-4 text-accent-text" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type ExplorerHeaderProps = {
  renderSearch: () => ReactNode;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  hiringOnly: boolean;
  totalOpenings: number;
  onToggleHiring: () => void;
  countries: CountryInfo[];
  countryCounts: Record<string, number>;
  selectedCountry: CountryInfo;
  onSelectCountry: (code: string) => void;
  hubs: TechHub[];
  hubCounts: Record<string, number>;
  selectedHubId: string;
  onSelectHub: (hub: TechHub) => void;
  gpsRequesting: boolean;
  atNearestHub: boolean;
  onLocate: () => void;
};

/** Glass header: brand, search, view switch, then the country and hub strip. */
export function ExplorerHeader({
  renderSearch,
  viewMode,
  onViewMode,
  hiringOnly,
  totalOpenings,
  onToggleHiring,
  countries,
  countryCounts,
  selectedCountry,
  onSelectCountry,
  hubs,
  hubCounts,
  selectedHubId,
  onSelectHub,
  gpsRequesting,
  atNearestHub,
  onLocate,
}: ExplorerHeaderProps) {
  return (
    <header className="relative z-[var(--z-header)] shrink-0 border-b border-line bg-[var(--glass)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2.5 sm:px-5">
        <Link href="/" title="LocaToGo Tech Atlas" className="focus-ring flex shrink-0 items-center gap-2 rounded-lg">
          <BrandLogo size={34} />
          <span className="hidden font-display text-xl font-semibold tracking-tight text-fg lg:inline">
            LocaToGo<span className="text-accent-text">.</span>
          </span>
        </Link>

        <div className="mx-1 hidden min-w-[11rem] max-w-3xl flex-1 md:block lg:mx-2">{renderSearch()}</div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Chip
            selected={hiringOnly && viewMode !== "jobs"}
            onClick={onToggleHiring}
            leadingIcon={
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
            }
          >
            Hiring
            <span className="ml-1.5 opacity-70">{totalOpenings.toLocaleString("en-US")}</span>
          </Chip>

          <Tabs variant="pill" value={viewMode} onValueChange={(next) => onViewMode(next as ViewMode)} className="hidden md:block">
            <TabList aria-label="View">
              <Tab value="map">
                <MapIcon className="size-4" />
                <span className="max-lg:sr-only">Map</span>
              </Tab>
              <Tab value="grid">
                <GridIcon className="size-4" />
                <span className="max-lg:sr-only">Grid</span>
              </Tab>
              <Tab value="jobs">
                <BriefcaseIcon className="size-4" />
                <span className="max-lg:sr-only">Jobs</span>
                <span className="rounded-full bg-success-soft px-1.5 text-[11px] text-success max-lg:hidden">
                  <RollingNumber value={totalOpenings} />
                </span>
              </Tab>
            </TabList>
          </Tabs>

          <UserProfileMenu />
        </div>
      </div>

      <div className="px-3 pb-2.5 md:hidden">{renderSearch()}</div>

      <div className="flex items-center gap-2 px-3 pb-2.5 sm:px-5">
        <CountryPicker countries={countries} counts={countryCounts} selected={selectedCountry} onSelect={onSelectCountry} />
        <span aria-hidden="true" className="h-5 w-px shrink-0 bg-line-strong" />
        <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto py-0.5">
          <Chip
            selected={atNearestHub}
            onClick={onLocate}
            disabled={gpsRequesting}
            leadingIcon={<LocateIcon className={cn("size-4", gpsRequesting && "animate-pulse")} />}
            className="shrink-0"
          >
            {gpsRequesting ? "Locating" : "Near me"}
          </Chip>
          {hubs.map((hub) => (
            <Chip
              key={hub.id}
              selected={hub.id === selectedHubId}
              count={hubCounts[hub.id] || undefined}
              onClick={() => onSelectHub(hub)}
              className="shrink-0"
            >
              {hub.name}
            </Chip>
          ))}
        </div>
      </div>
    </header>
  );
}

type MobileDockProps = {
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  totalOpenings: number;
};

/** Phone navigation between Map, Directory and Jobs. In flow, so views never sit under it. */
export function MobileDock({ viewMode, onViewMode, totalOpenings }: MobileDockProps) {
  const items: { id: ViewMode; label: string; icon: ReactNode }[] = [
    { id: "map", label: "Map", icon: <MapIcon /> },
    { id: "grid", label: "Directory", icon: <GridIcon /> },
    { id: "jobs", label: "Jobs", icon: <BriefcaseIcon /> },
  ];

  return (
    <nav
      aria-label="Views"
      className="relative z-[var(--z-sticky)] shrink-0 border-t border-line bg-[var(--glass)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map((item) => {
          const active = viewMode === item.id;
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onViewMode(item.id)}
                className={cn(
                  "focus-ring relative flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors duration-200 motion-safe:active:scale-[0.97]",
                  active ? "text-accent-text" : "text-fg-subtle",
                )}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
                {item.id === "jobs" && totalOpenings > 0 && (
                  <span className="absolute right-[22%] top-1.5 rounded-full bg-success-soft px-1.5 text-[10px] tabular-nums text-success">
                    {totalOpenings > 999 ? `${(totalOpenings / 1000).toFixed(1)}k` : totalOpenings}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-6 top-0 h-0.5 origin-center rounded-full bg-accent transition-transform duration-300 ease-emphasized",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
