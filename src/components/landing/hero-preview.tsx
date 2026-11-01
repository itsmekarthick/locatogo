"use client";

import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { WorldDots } from "@/components/landing/world-dots";
import { Badge } from "@/components/ui";
import { GlobeIcon, SlidersIcon, SparklesIcon } from "@/components/ui/icons";
import { LEVELS, ROLE_CATEGORIES } from "@/lib/jobs/taxonomy";
import type { HubTour, LandingLive } from "@/lib/landing/data";
import { MAP_H, MAP_W, projectToMap } from "@/lib/landing/map";
import { cn } from "@/lib/utils/cn";

type HeroPreviewProps = { live: LandingLive; hubCount: number; countryCount: number };

const SCENES = [
  { id: "explore", label: "Explore", Icon: GlobeIcon, seconds: 9 },
  { id: "filter", label: "Filter", Icon: SlidersIcon, seconds: 6 },
  { id: "match", label: "Match", Icon: SparklesIcon, seconds: 6 },
] as const;

// Labels sit to the right of a pin unless a neighbour is in the way.
const LABEL_LEFT = ["london", "bengaluru"];
const ARCS: [string, string][] = [
  ["silicon-valley", "london"],
  ["new-york", "london"],
  ["london", "bengaluru"],
  ["bengaluru", "singapore"],
  ["berlin", "bengaluru"],
];
const FILTER_LEVELS = ["intern", "entry", "mid", "senior"];
const FILTER_CATEGORIES = ["engineering", "ml_ai", "product", "data"];

const fmt = (value: number) => value.toLocaleString("en-US");
const vars = (values: Record<string, string | number>) => values as CSSProperties;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function HeroPreview({ live, hubCount, countryCount }: HeroPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);
  const [run, setRun] = useState(0);

  const choose = useCallback((next: number) => {
    setScene(next);
    setSeen((current) => (current.includes(next) ? current : [...current, next]));
    setRun((current) => current + 1);
  }, []);
  const advance = () => choose((scene + 1) % SCENES.length);

  // Everything that touches the DOM at high frequency lives here and writes styles directly, so scrolling and
  // pointer movement never re-render React. It all stops while the preview is off screen.
  useEffect(() => {
    const root = rootRef.current;
    const frame = frameRef.current;
    const spot = spotRef.current;
    if (!root || !frame || !spot) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gate = { visible: false, focus: false };
    const sync = () => {
      root.dataset.run = gate.visible && !gate.focus && !document.hidden ? "true" : "false";
    };

    let scrollFrame = 0;
    const update = () => {
      scrollFrame = 0;
      if (reduce) return;
      const rect = root.getBoundingClientRect();
      const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
      frame.style.transform =
        window.innerWidth < 768
          ? `translate3d(0, ${(-progress * 16).toFixed(1)}px, 0) rotateX(3deg)`
          : `translate3d(0, ${(-progress * 32).toFixed(1)}px, 0) rotateX(5deg) rotateY(-6deg) rotateZ(0.6deg)`;
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(update);
    };

    let pointerFrame = 0;
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || pointerFrame) return;
      const { clientX, clientY } = event;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const rect = frame.getBoundingClientRect();
        spot.style.setProperty("--sx", `${clientX - rect.left}px`);
        spot.style.setProperty("--sy", `${clientY - rect.top}px`);
      });
    };
    // Only keyboard focus pauses the tour; a mouse click leaves focus on the tab but should not stop it.
    const onFocusIn = (event: FocusEvent) => {
      gate.focus = event.target instanceof HTMLElement && event.target.matches(":focus-visible");
      sync();
    };
    const onFocusOut = () => {
      gate.focus = false;
      sync();
    };

    // The other scenes are mounted one at a time when the browser is idle, so switching to them later is cheap.
    let warmed = false;
    const idle = (callback: () => void) =>
      "requestIdleCallback" in window ? window.requestIdleCallback(callback, { timeout: 2000 }) : setTimeout(callback, 600);
    const mount = (index: number) => setSeen((current) => (current.includes(index) ? current : [...current, index]));
    const warm = () => {
      if (warmed) return;
      warmed = true;
      idle(() => {
        mount(1);
        idle(() => mount(2));
      });
    };

    const observer = new IntersectionObserver(([entry]) => {
      gate.visible = entry.isIntersecting;
      sync();
      if (entry.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        update();
        warm();
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    });
    observer.observe(root);

    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", sync);
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(pointerFrame);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-run="false"
      role="group"
      aria-label="A preview of the Tech Atlas: explore hubs, filter roles and match a profile"
      className="lp-preview relative mx-auto w-full max-w-5xl text-left"
    >
      <div ref={frameRef} className="lp-frame relative overflow-hidden rounded-3xl border border-line bg-surface-1 elev-lg">
        <div ref={spotRef} aria-hidden="true" className="lp-frame-spot pointer-events-none absolute inset-0 z-10" />

        <div className="flex h-11 items-center gap-3 border-b border-line bg-surface-2 px-4">
          <div aria-hidden="true" className="hidden gap-1.5 sm:flex">
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
          </div>
          <div className="mx-auto flex items-center gap-0.5 rounded-xl bg-surface-3 p-0.5">
            {SCENES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={scene === index}
                onClick={() => choose(index)}
                className={cn(
                  "focus-ring transition-ui relative inline-flex h-7 items-center gap-1.5 rounded-[10px] px-3 text-xs font-medium",
                  scene === index ? "bg-surface-1 text-fg elev-sm" : "text-fg-subtle hover:text-fg",
                )}
              >
                <item.Icon className="size-3.5" />
                {item.label}
                {scene === index && (
                  <span
                    key={run}
                    aria-hidden="true"
                    className="lp-tab-bar"
                    style={{ animationDuration: `${item.seconds}s` }}
                    onAnimationEnd={advance}
                  />
                )}
              </button>
            ))}
          </div>
          <Badge variant="success" size="sm" dot className="hidden sm:inline-flex">
            Live
          </Badge>
        </div>

        <div className="lp-stage">
          {SCENES.map((item, index) => (
            <div
              key={item.id}
              data-active={scene === index}
              inert={scene !== index}
              aria-hidden="true"
              className="lp-scene grid grid-cols-1 md:grid-cols-[19rem_minmax(0,1fr)]"
              style={vars({ "--d": `${item.seconds}s` })}
            >
              {seen.includes(index) && index === 0 && <ExploreScene tours={live.tours} hubCount={hubCount} countryCount={countryCount} />}
              {seen.includes(index) && index === 1 && <FilterScene live={live} />}
              {seen.includes(index) && index === 2 && <MatchScene live={live} />}
            </div>
          ))}
        </div>

        <div className="flex h-9 items-center justify-between gap-4 border-t border-line bg-surface-2 px-4 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="relative flex size-2">
              <span className="lp-live absolute inset-0 rounded-full bg-success" />
              <span className="relative size-2 rounded-full bg-success" />
            </span>
            <span>
              <span className="tabular-nums text-fg">{fmt(live.dayRoles)}</span> roles posted in the last 24 hours
            </span>
          </span>
          <span className="hidden sm:inline">
            <span className="tabular-nums text-fg">{fmt(live.companies)}</span> companies hiring ·{" "}
            <span className="tabular-nums text-fg">{hubCount}</span> hubs ·{" "}
            <span className="tabular-nums text-fg">{countryCount}</span> countries
          </span>
        </div>
      </div>
    </div>
  );
}

function SceneHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-fg">{title}</p>
      <p className="truncate text-xs text-fg-subtle">{detail}</p>
    </div>
  );
}

const ExploreScene = memo(function ExploreScene({ tours, hubCount, countryCount }: { tours: HubTour[]; hubCount: number; countryCount: number }) {
  const focus = tours.filter((hub) => hub.top.length > 0).slice(0, 3);
  const maxRoles = Math.max(1, ...tours.map((hub) => hub.roles));
  const points = new Map(tours.map((hub) => [hub.id, { hub, ...projectToMap(hub.lat, hub.lng) }]));

  return (
    <>
      <aside className="hidden min-w-0 border-r border-line p-4 md:grid md:grid-cols-1">
        {focus.map((hub, k) => (
          <div key={hub.id} data-k={k} style={vars({ "--k": k })} className="lp-tour flex min-w-0 flex-col gap-3">
            <SceneHeading title={`Hiring in ${hub.name}`} detail={`${fmt(hub.roles)} open roles at ${fmt(hub.companies)} companies`} />
            <div className="flex flex-col gap-1">
              {hub.top.map((company, index) => (
                <div key={company.id} className={cn("flex items-center gap-3 rounded-xl px-2.5 py-2", index === 0 && "bg-accent-soft")}>
                  <CompanyBrandAvatar title={company.title} website={company.website} size={32} />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{company.title}</p>
                  <Badge variant="accent" size="sm">
                    {company.jobs === 1 ? "1 role" : `${fmt(company.jobs)} roles`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <div className="relative min-w-0 overflow-hidden bg-surface-0">
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
          <WorldDots />
          {ARCS.map(([from, to]) => {
            const a = points.get(from);
            const b = points.get(to);
            if (!a || !b) return null;
            const lift = Math.hypot(b.x - a.x, b.y - a.y) * 0.28;
            return (
              <path
                key={`${from}-${to}`}
                d={`M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`}
                fill="none"
                className="lp-arc stroke-accent-500"
                strokeOpacity={0.45}
                strokeWidth={1.2}
                strokeDasharray="3 5"
              />
            );
          })}
          {[...points.values()].map(({ hub, x, y }) => {
            const k = focus.findIndex((item) => item.id === hub.id);
            const radius = 2.8 + 3.4 * Math.sqrt(hub.roles / maxRoles);
            const left = LABEL_LEFT.includes(hub.id);
            return (
              <g key={hub.id}>
                {k >= 0 && (
                  <g className="lp-win" data-k={k} style={vars({ "--k": k })}>
                    <circle cx={x} cy={y} r={radius + 2} className="lp-ping fill-accent-500" />
                  </g>
                )}
                <circle cx={x} cy={y} r={radius} className="fill-accent-500" />
                <circle cx={x} cy={y} r={radius * 0.38} className="fill-surface-1" />
                <text
                  x={left ? x - radius - 5 : x + radius + 5}
                  y={y + 3.5}
                  fontSize={11}
                  textAnchor={left ? "end" : "start"}
                  className="fill-fg-muted"
                  stroke="var(--surface-0)"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {hub.name}
                </text>
                {k >= 0 && (
                  <text
                    x={left ? x - radius - 5 : x + radius + 5}
                    y={y + 16.5}
                    fontSize={10}
                    textAnchor={left ? "end" : "start"}
                    className="lp-win fill-accent-text"
                    data-k={k}
                    style={vars({ "--k": k })}
                    stroke="var(--surface-0)"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {fmt(hub.roles)} roles
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="absolute right-3 top-3 rounded-xl border border-line bg-surface-2 px-3 py-1.5 text-xs text-fg-muted elev-sm">
          <span className="tabular-nums text-fg">{hubCount}</span> hubs · <span className="tabular-nums text-fg">{countryCount}</span> countries
        </div>
      </div>
    </>
  );
});

function Chip({ label, count, on }: { label: string; count: number; on?: number }) {
  return (
    <span className="relative isolate inline-flex h-7 items-center gap-1.5 rounded-full border border-line-strong bg-surface-1 px-2.5 text-xs text-fg-muted">
      {on !== undefined && (
        <span aria-hidden="true" className="lp-flip absolute inset-0 -z-10 rounded-full border border-accent bg-accent-soft" style={vars({ "--t": `${on}s` })} />
      )}
      {label}
      <span className="tabular-nums text-fg-subtle">{fmt(count)}</span>
    </span>
  );
}

function SkeletonRows({ at }: { at: number }) {
  return (
    <div className="lp-gone flex flex-col gap-2" style={vars({ "--t": `${at}s`, gridArea: "1 / 1" })}>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-2.5">
          <span className="size-8 shrink-0 rounded-xl bg-surface-3" />
          <span className="flex-1 space-y-2">
            <span className="block h-2.5 w-3/5 rounded-full bg-surface-3" />
            <span className="block h-2 w-2/5 rounded-full bg-surface-3 opacity-60" />
          </span>
        </div>
      ))}
    </div>
  );
}

const FilterScene = memo(function FilterScene({ live }: { live: LandingLive }) {
  const { facets } = live;
  const levels = FILTER_LEVELS.flatMap((id) => LEVELS.filter((level) => level.id === id));
  const categories = FILTER_CATEGORIES.flatMap((id) => ROLE_CATEGORIES.filter((category) => category.id === id));
  const flipAt = 1.4;

  return (
    <>
      <aside className="hidden min-w-0 flex-col gap-4 border-r border-line p-4 md:flex">
        <div>
          <p className="mb-2 text-xs font-medium text-fg-muted">Level</p>
          <div className="flex flex-wrap gap-1.5">
            {levels.map((level) => (
              <Chip key={level.id} label={level.label} count={facets.levels[level.id] ?? 0} on={level.id === "intern" || level.id === "entry" ? flipAt + 0.1 : undefined} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-fg-muted">Role type</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <Chip key={category.id} label={category.label} count={facets.categories[category.id] ?? 0} />
            ))}
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
          <span className="text-sm font-medium text-fg">Freshers only</span>
          <span className="relative h-5 w-9 shrink-0 rounded-full bg-surface-3">
            <span className="lp-flip absolute inset-0 rounded-full bg-accent" style={vars({ "--t": `${flipAt}s` })} />
            <span className="lp-knob absolute left-0.5 top-0.5 size-4 rounded-full bg-surface-1 elev-sm" style={vars({ "--t": `${flipAt}s` })} />
          </span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-4 p-4">
        <div className="grid grid-cols-1">
          <div className="lp-gone" style={vars({ "--t": `${flipAt + 0.2}s`, gridArea: "1 / 1" })}>
            <p className="font-display text-3xl font-semibold tabular-nums tracking-tight text-fg">{fmt(facets.roles)}</p>
            <p className="text-sm text-fg-muted">open roles across {fmt(live.companies)} companies</p>
          </div>
          <div className="lp-in" style={vars({ "--t": `${flipAt + 0.3}s`, gridArea: "1 / 1" })}>
            <p className="font-display text-3xl font-semibold tabular-nums tracking-tight text-accent-text">{fmt(facets.freshers)}</p>
            <p className="text-sm text-fg-muted">roles open to freshers</p>
          </div>
        </div>
        <div className="grid grid-cols-1">
          <SkeletonRows at={flipAt + 0.3} />
          <div className="flex flex-col gap-2" style={{ gridArea: "1 / 1" }}>
            {live.fresherRoles.slice(0, 3).map((role, index) => (
              <div key={role.id} className={cn("lp-in flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-2.5", index === 2 && "max-sm:hidden")} style={vars({ "--t": `${flipAt + 0.6 + index * 0.16}s` })}>
                <CompanyBrandAvatar title={role.company} website={role.website} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{role.title}</p>
                  <p className="truncate text-xs text-fg-subtle">{[role.company, role.location].filter(Boolean).join(" · ")}</p>
                </div>
                <Badge variant="success" size="sm">
                  Fresher
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
});

const MatchScene = memo(function MatchScene({ live }: { live: LandingLive }) {
  const { demoProfile, demoMatches } = live;
  const revealAt = 1.5;

  return (
    <>
      <aside className="hidden min-w-0 flex-col gap-3 border-r border-line p-4 md:flex">
        <p className="text-xs font-medium text-fg-muted">Sample profile</p>
        <div className="rounded-xl border border-line bg-surface-2 p-3">
          <p className="text-sm font-semibold text-fg">{demoProfile.headline}</p>
          <p className="text-xs text-fg-subtle">
            {demoProfile.years} years · {demoProfile.location}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {demoProfile.skills.map((skill, index) => (
              <span key={skill} className="lp-in" style={vars({ "--t": `${0.1 + index * 0.12}s` })}>
                <Badge size="sm" variant="accent">
                  {skill}
                </Badge>
              </span>
            ))}
          </div>
        </div>
        <p className="mt-auto text-xs text-fg-subtle">Your resume is read the same way, then scored against every open role.</p>
      </aside>

      <div className="relative flex min-w-0 flex-col gap-3 overflow-hidden p-4">
        <div className="lp-scan pointer-events-none absolute inset-0" />
        <SceneHeading title="Best matches" detail={`Scored ${fmt(live.demoRead)} open roles in ${demoProfile.location} and remote`} />
        <div className="grid grid-cols-1">
          <SkeletonRows at={revealAt} />
          <div className="flex flex-col gap-2" style={{ gridArea: "1 / 1" }}>
            {demoMatches.map((match, index) => (
              <div key={match.id} className={cn("lp-in rounded-xl border border-line bg-surface-1 p-2.5", index === 2 && "max-sm:hidden")} style={vars({ "--t": `${revealAt + index * 0.22}s` })}>
                <div className="flex items-center gap-3">
                  <CompanyBrandAvatar title={match.company} website={match.website} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{match.title}</p>
                    <p className="truncate text-xs text-fg-subtle">{[match.company, match.location].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-sm font-semibold tabular-nums text-accent-text">{match.score}</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
                  <span
                    className="lp-fill block h-full origin-left rounded-full bg-accent"
                    style={{ width: `${match.score}%`, ...vars({ "--t": `${revealAt + 0.2 + index * 0.22}s` }) }}
                  />
                </div>
                {index === 0 && match.note && <p className="mt-1.5 truncate text-xs text-fg-muted">{match.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
});