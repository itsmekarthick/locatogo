"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Skeleton, Spinner } from "@/components/ui";
import {
  BriefcaseIcon,
  BuildingIcon,
  ClockIcon,
  MapPinIcon,
  SearchIcon,
  type IconProps,
} from "@/components/ui/icons";
import { APP_URL } from "@/lib/constants/app-url";
import { cn } from "@/lib/utils/cn";

export type SearchHub = { id: string; name: string; country: string; countryCode: string };

type CompanyHit = {
  id: string;
  title: string;
  slug: string;
  city: string | null;
  locality: string | null;
  active_jobs_count: number | null;
};
type RoleHit = {
  id: string;
  title: string;
  location: string | null;
  workplace: string | null;
  company: string;
  slug: string;
};
type Remote = { q: string; companies: CompanyHit[]; roles: RoleHit[] };

type OptionKind = "company" | "hub" | "role" | "recent" | "search";
type Option = {
  id: string;
  kind: OptionKind;
  label: string;
  meta?: string;
  badge?: string;
  href?: string;
  query?: string;
};
type Group = { label: string; options: Option[]; onClear?: () => void };

const icons: Record<OptionKind, (props: IconProps) => ReactElement> = {
  company: BuildingIcon,
  hub: MapPinIcon,
  role: BriefcaseIcon,
  recent: ClockIcon,
  search: SearchIcon,
};

const RECENT_KEY = "locatogo_recent_searches";
const recentListeners = new Set<() => void>();

function subscribeRecent(callback: () => void) {
  recentListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    recentListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function readRecent() {
  try {
    return localStorage.getItem(RECENT_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
  } catch {}
  recentListeners.forEach((listener) => listener());
}

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  const at = needle.length >= 2 ? text.toLowerCase().indexOf(needle.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-[3px] bg-accent-soft px-0.5 text-accent-text">{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}

type CommandSearchProps = {
  hubs: SearchHub[];
  popularHubs: SearchHub[];
  /** Real company and hub names that cycle through the placeholder. */
  examples: string[];
};

export function CommandSearch({ hubs, popularHubs, examples }: CommandSearchProps) {
  const router = useRouter();
  const baseId = useId();
  const listId = `${baseId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [remote, setRemote] = useState<Remote | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);

  const shortcut = useSyncExternalStore(
    () => () => {},
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K",
  );
  const recentRaw = useSyncExternalStore(subscribeRecent, readRecent, () => "[]");
  const recents = useMemo<string[]>(() => {
    try {
      const parsed: unknown = JSON.parse(recentRaw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }, [recentRaw]);

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;
  const loading = searching && remote?.q !== trimmed;

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable='true']");
      const isCommandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      const isSlash = event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey;
      if (!isCommandK && !isSlash) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (examples.length < 2 || focused || query) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setExampleIndex((index) => (index + 1) % examples.length), 3000);
    return () => window.clearInterval(timer);
  }, [examples.length, focused, query]);

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = response.ok ? await response.json() : {};
        setRemote({
          q: trimmed,
          companies: Array.isArray(data.companies) ? data.companies : [],
          roles: Array.isArray(data.roles) ? data.roles : [],
        });
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") setRemote({ q: trimmed, companies: [], roles: [] });
      }
    }, 160);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed]);

  const groups = useMemo<Group[]>(() => {
    const hubOption = (hub: SearchHub): Option => ({
      id: `hub:${hub.id}`,
      kind: "hub",
      label: hub.name,
      meta: hub.country,
      href: `/hub/${hub.countryCode.toLowerCase()}/${hub.id}`,
    });

    if (!searching) {
      const result: Group[] = [];
      if (recents.length > 0) {
        result.push({
          label: "Recent",
          options: recents.map((text) => ({ id: `recent:${text}`, kind: "recent", label: text, query: text })),
          onClear: () => writeRecent([]),
        });
      }
      result.push({ label: "Popular hubs", options: popularHubs.map(hubOption) });
      return result;
    }

    const needle = trimmed.toLowerCase();
    const result: Group[] = [];
    const companies = (remote?.companies ?? []).map<Option>((company) => ({
      id: `company:${company.id}`,
      kind: "company",
      label: company.title,
      meta: [company.locality, company.city].filter(Boolean).join(", ") || undefined,
      badge: company.active_jobs_count
        ? `${company.active_jobs_count} ${company.active_jobs_count === 1 ? "role" : "roles"}`
        : undefined,
      href: `/company/${company.slug}`,
    }));
    if (companies.length > 0) result.push({ label: "Companies", options: companies });

    const hubMatches = hubs.filter((hub) => `${hub.name} ${hub.country}`.toLowerCase().includes(needle)).slice(0, 4);
    if (hubMatches.length > 0) result.push({ label: "Hubs", options: hubMatches.map(hubOption) });

    const roles = (remote?.roles ?? []).map<Option>((role) => ({
      id: `role:${role.id}`,
      kind: "role",
      label: role.title,
      meta: [role.company, role.location].filter(Boolean).join(" · "),
      href: `/company/${role.slug}`,
    }));
    if (roles.length > 0) result.push({ label: "Roles", options: roles });

    result.push({
      label: "Search",
      options: [{ id: "search", kind: "search", label: `Search the atlas for “${trimmed}”`, query: trimmed }],
    });
    return result;
  }, [searching, trimmed, remote, hubs, popularHubs, recents]);

  const options = useMemo(() => groups.flatMap((group) => group.options), [groups]);
  const active = options.find((option) => option.id === activeId) ?? (searching ? options[0] : undefined);
  const resultCount = options.filter((option) => option.kind !== "search").length;
  const noMatches = searching && !loading && resultCount === 0;

  useEffect(() => {
    if (!active) return;
    document.getElementById(`${baseId}-${active.id}`)?.scrollIntoView({ block: "nearest" });
  }, [active, baseId]);

  function remember(text: string) {
    const value = text.trim();
    if (value.length < 2) return;
    writeRecent([value, ...recents.filter((item) => item.toLowerCase() !== value.toLowerCase())]);
  }

  function searchAtlas(text: string) {
    remember(text);
    window.location.href = text ? `${APP_URL}/?q=${encodeURIComponent(text)}` : APP_URL;
  }

  function choose(option: Option) {
    inputRef.current?.blur();
    setFocused(false);
    if (option.href) {
      remember(searching ? trimmed : option.label);
      router.push(option.href);
      return;
    }
    searchAtlas(option.query ?? trimmed);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    searchAtlas(trimmed);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setFocused(true);
      if (options.length === 0) return;
      const current = active ? options.indexOf(active) : -1;
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = current === -1 ? (step === 1 ? 0 : options.length - 1) : (current + step + options.length) % options.length;
      setActiveId(options[next].id);
    } else if (event.key === "Enter" && focused && active) {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape") {
      if (focused) {
        event.preventDefault();
        setFocused(false);
      }
      inputRef.current?.blur();
    }
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="relative text-left"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="glass elev-lg flex h-14 items-center gap-3 rounded-2xl pl-4 pr-2 transition-ui focus-within:ring-4 focus-within:ring-accent/20">
        <SearchIcon className="size-5 shrink-0 text-fg-subtle" />
        <div className="relative h-full min-w-0 flex-1">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveId(null);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-label="Search companies, hubs and roles"
            aria-expanded={focused}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={focused && active ? `${baseId}-${active.id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="h-full w-full bg-transparent text-base text-fg outline-none"
          />
          {!query && examples.length > 0 && (
            <span
              key={exampleIndex}
              aria-hidden="true"
              className="lp-ph pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center truncate text-base text-fg-subtle"
            >
              {examples[exampleIndex % examples.length]}
            </span>
          )}
        </div>
        {loading ? (
          <Spinner label="Searching" className="shrink-0 text-lg text-fg-subtle" />
        ) : (
          !focused && (
            <span className="hidden items-center gap-1 sm:flex">
              <kbd className="rounded-md border border-line-strong bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-fg-subtle">
                {shortcut}
              </kbd>
              <kbd className="rounded-md border border-line-strong bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-fg-subtle">
                /
              </kbd>
            </span>
          )
        )}
        <Button type="submit">Search</Button>
      </div>

      {focused && (
        <div className="absolute left-0 right-0 top-full z-[var(--z-dropdown)] mt-2 max-h-[min(26rem,60dvh)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface-2 p-2 elev-lg">
          <div id={listId} role="listbox" aria-label="Search suggestions">
            {loading && !remote && (
              <div aria-hidden="true" className="flex flex-col gap-2 px-3 py-3">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {noMatches && (
              <p className="px-3 py-3 text-sm text-fg-muted">
                No companies, hubs or roles match “{trimmed}” yet. Try a broader term or search the full atlas.
              </p>
            )}

            {groups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label}>
                <div className="flex items-center justify-between px-3 pb-1 pt-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">{group.label}</span>
                  {group.onClear && (
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={group.onClear}
                      className="focus-ring rounded-md px-1.5 text-[11px] text-fg-subtle hover:text-fg"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {group.options.map((option) => {
                  const Icon = icons[option.kind];
                  const isActive = active?.id === option.id;
                  return (
                    <div
                      key={option.id}
                      id={`${baseId}-${option.id}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseMove={() => !isActive && setActiveId(option.id)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(option)}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150",
                        isActive && "bg-surface-3",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg text-lg",
                          isActive ? "bg-accent-soft text-accent-text" : "bg-surface-3 text-fg-muted",
                        )}
                      >
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-fg">
                          {option.kind === "search" ? option.label : <Highlight text={option.label} query={trimmed} />}
                        </span>
                        {option.meta && <span className="block truncate text-xs text-fg-subtle">{option.meta}</span>}
                      </span>
                      {option.badge && (
                        <Badge variant="accent" size="sm">
                          {option.badge}
                        </Badge>
                      )}
                      {isActive && (
                        <kbd className="hidden rounded-md border border-line-strong bg-surface-1 px-1.5 py-0.5 font-mono text-[11px] text-fg-subtle sm:block">
                          ↵
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div role="status" aria-live="polite" className="sr-only">
            {searching && !loading ? `${resultCount} results` : ""}
          </div>
        </div>
      )}
    </form>
  );
}
