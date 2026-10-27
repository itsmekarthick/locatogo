"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { Avatar, Badge, Skeleton } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

export type PreviewCompany = {
  id: string;
  title: string;
  locality: string | null;
  city: string | null;
  jobs: number;
  verified: boolean;
};
export type PreviewHub = { id: string; name: string; lat: number; lng: number };

type HeroPreviewProps = {
  companies: PreviewCompany[];
  hubs: PreviewHub[];
  hubCount: number;
  countryCount: number;
};

const W = 640;
const H = 360;
const LABELLED = ["bengaluru", "silicon-valley", "london", "singapore", "new-york", "berlin"];
const LABELS: Record<string, string> = { "silicon-valley": "Silicon Valley", "new-york": "New York" };
// Labels default to the right of the pin; these sit on the left to avoid neighbours.
const LABEL_LEFT = ["london"];
const ARCS: [string, string][] = [
  ["silicon-valley", "london"],
  ["new-york", "london"],
  ["london", "bengaluru"],
  ["bengaluru", "singapore"],
  ["berlin", "bengaluru"],
];

function project(lat: number, lng: number) {
  return { x: ((lng + 170) / 350) * W, y: ((72 - lat) / 120) * H };
}

export function HeroPreview({ companies, hubs, hubCount, countryCount }: HeroPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Scroll parallax: only writes a CSS variable, only while the preview is on screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      root.style.setProperty("--p", Math.min(1, Math.max(0, progress)).toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        update();
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (event.pointerType !== "mouse" || !frame) return;
    const rect = frame.getBoundingClientRect();
    frame.style.setProperty("--sx", `${event.clientX - rect.left}px`);
    frame.style.setProperty("--sy", `${event.clientY - rect.top}px`);
  }

  const points = new Map(hubs.map((hub) => [hub.id, { ...hub, ...project(hub.lat, hub.lng) }]));
  const lead = companies[0];

  return (
    <div ref={rootRef} aria-hidden="true" onPointerMove={onPointerMove} className="lp-preview relative mx-auto w-full max-w-5xl text-left">
      <div ref={frameRef} className="lp-frame relative overflow-hidden rounded-3xl border border-line bg-surface-1 elev-lg">
        <div className="lp-frame-spot pointer-events-none absolute inset-0 z-10" />

        <div className="flex h-11 items-center gap-3 border-b border-line bg-surface-2 px-4">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
            <span className="size-2.5 rounded-full bg-surface-3" />
          </div>
          <div className="mx-auto flex h-7 w-full max-w-xs items-center gap-2 rounded-lg bg-surface-3 px-3 text-xs text-fg-subtle">
            <SearchIcon className="size-3.5" />
            <span className="truncate">Search the Tech Atlas</span>
          </div>
          <Badge variant="success" size="sm" dot className="hidden sm:inline-flex">
            Live
          </Badge>
        </div>

        <div className="grid md:grid-cols-[19rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-1 border-b border-line p-3 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <span className="text-xs font-medium text-fg-muted">Companies</span>
              <span className="text-xs text-fg-subtle">Hiring first</span>
            </div>
            {companies.length > 0
              ? companies.slice(0, 5).map((company, index) => (
                  <div
                    key={company.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-2.5 py-2",
                      index === 0 ? "bg-accent-soft" : "",
                    )}
                  >
                    <Avatar name={company.title} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{company.title}</p>
                      <p className="truncate text-xs text-fg-subtle">
                        {[company.locality, company.city].filter(Boolean).join(", ") || "Global"}
                      </p>
                    </div>
                    {company.jobs > 0 ? (
                      <Badge variant="accent" size="sm">
                        {company.jobs === 1 ? "1 role" : `${company.jobs} roles`}
                      </Badge>
                    ) : company.verified ? (
                      <Badge variant="success" size="sm">
                        Verified
                      </Badge>
                    ) : null}
                  </div>
                ))
              : [0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="flex items-center gap-3 px-2.5 py-2">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
          </div>

          <div className="lp-dots relative aspect-[16/9] overflow-hidden bg-surface-0 md:aspect-auto md:min-h-[18rem]">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
              {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map((lng) => {
                const x = project(0, lng).x;
                return <line key={lng} x1={x} x2={x} y1={0} y2={H} className="stroke-line" strokeWidth={1} />;
              })}
              {[60, 30, 0, -30].map((lat) => {
                const y = project(lat, 0).y;
                return <line key={lat} x1={0} x2={W} y1={y} y2={y} className="stroke-line" strokeWidth={1} />;
              })}

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
                    className="stroke-accent-500"
                    strokeOpacity={0.4}
                    strokeWidth={1.2}
                    strokeDasharray="3 5"
                  />
                );
              })}

              {[...points.values()].map((hub) => {
                const major = LABELLED.includes(hub.id);
                return (
                  <g key={hub.id}>
                    {major && <circle cx={hub.x} cy={hub.y} r={5} className="lp-ping fill-accent-500" />}
                    <circle cx={hub.x} cy={hub.y} r={major ? 4.5 : 2.5} className={major ? "fill-accent-500" : "fill-ink-400"} />
                    {major && <circle cx={hub.x} cy={hub.y} r={1.8} className="fill-surface-1" />}
                    {major && (
                      <text
                        x={LABEL_LEFT.includes(hub.id) ? hub.x - 9 : hub.x + 9}
                        y={hub.y + 4}
                        fontSize={12}
                        textAnchor={LABEL_LEFT.includes(hub.id) ? "end" : "start"}
                        className="fill-fg-muted"
                        stroke="var(--surface-0)"
                        strokeWidth={3}
                        paintOrder="stroke"
                      >
                        {LABELS[hub.id] ?? hub.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {lead && (
              <div className="lp-float absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 pr-4 elev-md">
                <Avatar name={lead.title} size="md" />
                <div className="min-w-0">
                  <p className="max-w-40 truncate text-sm font-medium text-fg">{lead.title}</p>
                  <p className="text-xs text-fg-subtle">
                    {lead.jobs > 0 ? `${lead.jobs} open ${lead.jobs === 1 ? "role" : "roles"}` : lead.city ?? "Tech company"}
                  </p>
                </div>
              </div>
            )}

            <div className="absolute right-4 top-4 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs text-fg-muted elev-sm">
              <span className="tabular-nums text-fg">{hubCount}</span> hubs ·{" "}
              <span className="tabular-nums text-fg">{countryCount}</span> countries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
