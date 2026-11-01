"use client";

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { MatchPin, MatchTopPreview } from "@/lib/matching/types";
import { cn } from "@/lib/utils/cn";
import "./matches.css";

const SIZE = 400;
const PAD = 44;
const GRID = 20;
const HEAT_SIGMA = 38;
const ZOOM = 1.8;

type Point = { x: number; y: number };

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

/** Fits the pins into the square, keeping east-west distances true for their latitude. */
function projector(pins: MatchPin[]) {
  if (pins.length === 0) return () => ({ x: SIZE / 2, y: SIZE / 2 });
  const lats = pins.map((pin) => pin.lat);
  const lngs = pins.map((pin) => pin.lng);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const k = Math.cos((midLat * Math.PI) / 180);
  const spanX = Math.max((Math.max(...lngs) - Math.min(...lngs)) * k, 0.02);
  const spanY = Math.max(Math.max(...lats) - Math.min(...lats), 0.02);
  const scale = (SIZE - PAD * 2) / Math.max(spanX, spanY);
  return (lat: number, lng: number): Point => ({ x: SIZE / 2 + (lng - midLng) * k * scale, y: SIZE / 2 - (lat - midLat) * scale });
}

function route(from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const bend = 0.16;
  const cx = (from.x + to.x) / 2 - dy * bend;
  const cy = (from.y + to.y) / 2 + dx * bend;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

type AtlasMapProps = {
  pins: MatchPin[];
  top: MatchTopPreview[] | null;
  /** 0 read, 1 shortlist, 2 rank, 3 explain, 4 reveal. */
  stage: number;
  hubLabel: string;
  /** Listing id to call out, for example the role a note is being written for. */
  highlightId?: string | null;
  /** Reports the pin under the pointer so the list beside the map can follow it. */
  onHover?: (id: string | null) => void;
  /** Logos that have already loaded, by listing id; a pin shows its rank number until its logo is ready. */
  logos?: Record<string, string>;
  className?: string;
};

/** A drawn map of the hub built from real listing coordinates; pins are companies with roles that relate to the profile. */
export function AtlasMap({ pins, top, stage, hubLabel, highlightId = null, onHover, logos = {}, className }: AtlasMapProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const layout = useMemo(() => {
    const project = projector(pins);
    const you = pins.length ? project(median(pins.map((pin) => pin.lat)), median(pins.map((pin) => pin.lng))) : { x: SIZE / 2, y: SIZE / 2 };
    const placed = pins.map((pin) => {
      const at = project(pin.lat, pin.lng);
      return { pin, at, dist: Math.hypot(at.x - you.x, at.y - you.y) };
    });
    const maxDist = Math.max(1, ...placed.map((item) => item.dist));

    // Demand heat: every grid dot glows by how many strong matches sit near it.
    const cell = (SIZE - PAD * 2) / (GRID - 1);
    const dots: { x: number; y: number; heat: number; dist: number }[] = [];
    for (let row = 0; row < GRID; row += 1) {
      for (let col = 0; col < GRID; col += 1) {
        const x = PAD + col * cell;
        const y = PAD + row * cell;
        let heat = 0;
        for (const item of placed) {
          const d2 = (item.at.x - x) ** 2 + (item.at.y - y) ** 2;
          heat += (item.pin.score / 100) ** 2 * Math.exp(-d2 / (2 * HEAT_SIGMA * HEAT_SIGMA));
        }
        dots.push({ x, y, heat, dist: Math.hypot(x - you.x, y - you.y) });
      }
    }
    const peak = Math.max(0.0001, ...dots.map((dot) => dot.heat));
    return { placed: placed.sort((a, b) => a.pin.score - b.pin.score), you, maxDist, dots: dots.map((dot) => ({ ...dot, heat: dot.heat / peak })) };
  }, [pins]);

  const topRank = useMemo(() => {
    const ranks = new Map<string, number>();
    top?.forEach((item) => {
      if (item.listingId && !ranks.has(item.listingId)) ranks.set(item.listingId, ranks.size + 1);
    });
    return ranks;
  }, [top]);

  const showPins = stage >= 1;
  const showRoutes = stage >= 2;
  const ranked = layout.placed.filter(({ pin }) => topRank.has(pin.id)).sort((a, b) => (topRank.get(a.pin.id) ?? 0) - (topRank.get(b.pin.id) ?? 0));
  const best = ranked[0];
  const zoomed = stage >= 4 && Boolean(best);

  const activeId = hovered ?? highlightId;
  const active = activeId ? layout.placed.find((item) => item.pin.id === activeId) : undefined;

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    frame.style.setProperty("--px", String(((event.clientX - rect.left) / rect.width) * 2 - 1));
    frame.style.setProperty("--py", String(((event.clientY - rect.top) / rect.height) * 2 - 1));
  };
  const onPointerLeave = () => {
    frameRef.current?.style.setProperty("--px", "0");
    frameRef.current?.style.setProperty("--py", "0");
  };

  const hover = (id: string | null) => {
    setHovered(id);
    onHover?.(id);
  };

  return (
    <div ref={frameRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className={cn("relative overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Map of ${pins.length} ${pins.length === 1 ? "company" : "companies"} with roles that match your profile, near ${hubLabel}`}
        className="block size-full"
      >
        <defs>
          <radialGradient id="atlas-fade" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="var(--surface-2)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--surface-2)" stopOpacity="1" />
          </radialGradient>
        </defs>

        <g
          className="atlas-world"
          style={{ transformOrigin: best ? `${best.at.x}px ${best.at.y}px` : "50% 50%", transform: zoomed ? `scale(${ZOOM})` : "none" } as CSSProperties}
        >
          <g className="atlas-layer" style={{ "--depth": 2 } as CSSProperties}>
            {layout.dots.map((dot) => (
              <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r="1.2" className="fill-fg-subtle" opacity="0.28" />
            ))}
            {showPins &&
              layout.dots
                .filter((dot) => dot.heat > 0.06)
                .map((dot) => (
                  <circle
                    key={`h-${dot.x}-${dot.y}`}
                    cx={dot.x}
                    cy={dot.y}
                    r={1.6 + dot.heat * 3.4}
                    className="atlas-heat fill-accent"
                    opacity={0.18 + dot.heat * 0.55}
                    style={{ "--d": Math.round((dot.dist / layout.maxDist) * 900) } as CSSProperties}
                  />
                ))}
          </g>

          {stage === 0 && (
            <g className="atlas-layer" style={{ "--depth": 3 } as CSSProperties}>
              {[0, 1, 2].map((n) => (
                <circle key={n} cx={layout.you.x} cy={layout.you.y} r="190" fill="none" strokeWidth="1.5" className="atlas-ripple stroke-accent" style={{ "--i": n } as CSSProperties} />
              ))}
              <g className="atlas-sweep" style={{ transformOrigin: `${layout.you.x}px ${layout.you.y}px` } as CSSProperties}>
                <line x1={layout.you.x} y1={layout.you.y} x2={layout.you.x + 190} y2={layout.you.y} className="stroke-accent" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
              </g>
            </g>
          )}

          {showRoutes && (
            <g className="atlas-layer" style={{ "--depth": 5 } as CSSProperties}>
              <g fill="none" className="stroke-accent" strokeWidth="1.5" strokeLinecap="round">
                {ranked.map(({ pin, at }, index) => (
                  <path
                    key={pin.id}
                    d={route(layout.you, at)}
                    pathLength={1}
                    className="atlas-route"
                    style={{ "--i": index } as CSSProperties}
                    opacity={activeId ? (activeId === pin.id ? 1 : 0.25) : index === 0 ? 1 : 0.55}
                  />
                ))}
              </g>
            </g>
          )}

          {showPins && (
            <g className="atlas-layer" style={{ "--depth": 7 } as CSSProperties}>
              {layout.placed.map(({ pin, at, dist }) => {
                const rank = topRank.get(pin.id);
                const isTop = showRoutes && rank !== undefined;
                const weight = Math.min(1, Math.max(0, (pin.score - 50) / 40));
                const dimmed = (stage === 3 || stage === 4) && !isTop;
                const isActive = activeId === pin.id;
                return (
                  <g
                    key={pin.id}
                    className="atlas-pin cursor-pointer"
                    style={{ "--d": 120 + Math.round((dist / layout.maxDist) * 800), opacity: dimmed ? 0.3 : undefined, transition: "opacity var(--dur-base) var(--ease-standard)" } as CSSProperties}
                    onPointerEnter={() => hover(pin.id)}
                    onPointerLeave={() => hover(null)}
                  >
                    {isTop && rank === 1 && <circle cx={at.x} cy={at.y} r="9" className="atlas-ring stroke-accent" fill="none" strokeWidth="1.5" />}
                    {(isTop || isActive) && <circle cx={at.x} cy={at.y} r={isTop ? 13 : 8} fill="none" strokeWidth="1" className="stroke-accent" opacity={isActive ? 0.9 : 0.35} />}
                    {isTop ? (
                      logos[pin.id] ? (
                        <>
                          <circle cx={at.x} cy={at.y} r="9" className="fill-surface-1 stroke-accent" strokeWidth="1.5" />
                          <image href={logos[pin.id]} x={at.x - 6} y={at.y - 6} width="12" height="12" preserveAspectRatio="xMidYMid meet" />
                          <circle cx={at.x + 7} cy={at.y - 7} r="4.5" className="fill-accent" />
                          <text x={at.x + 7} y={at.y - 4.2} textAnchor="middle" className="fill-accent-fg" fontSize="7" fontWeight="600">
                            {rank}
                          </text>
                        </>
                      ) : (
                        <>
                          <circle cx={at.x} cy={at.y} r="9" className="fill-accent" />
                          <text x={at.x} y={at.y + 3.5} textAnchor="middle" className="fill-accent-fg" fontSize="10" fontWeight="600">
                            {rank}
                          </text>
                        </>
                      )
                    ) : (
                      <circle cx={at.x} cy={at.y} r={2.6 + weight * 2.4} className="fill-accent" opacity={0.35 + weight * 0.5} />
                    )}
                    <circle cx={at.x} cy={at.y} r="12" fill="transparent" />
                  </g>
                );
              })}
            </g>
          )}

          <g className="atlas-layer" style={{ "--depth": 4 } as CSSProperties}>
            <circle cx={layout.you.x} cy={layout.you.y} r="6" className="fill-surface-1 stroke-fg" strokeWidth="2" />
            <circle cx={layout.you.x} cy={layout.you.y} r="2" className="fill-fg" />
            <text x={layout.you.x} y={layout.you.y + 19} textAnchor="middle" className="fill-fg-muted" fontSize="9" fontWeight="500">
              You
            </text>
          </g>
        </g>
        <rect width={SIZE} height={SIZE} fill="url(#atlas-fade)" pointerEvents="none" />
      </svg>

      {active && !zoomed && (
        <div
          role="presentation"
          className="pointer-events-none absolute z-10 flex max-w-[14rem] -translate-x-1/2 -translate-y-full items-baseline gap-2 rounded-lg border border-line-strong bg-surface-1 px-2.5 py-1.5 text-xs elev-md"
          style={{ left: `${Math.min(80, Math.max(20, (active.at.x / SIZE) * 100))}%`, top: `${(active.at.y / SIZE) * 100 - 3}%` }}
        >
          <span className="min-w-0 truncate font-medium text-fg">{active.pin.name}</span>
          <span className="shrink-0 tabular-nums text-fg-muted">{active.pin.score}</span>
        </div>
      )}
    </div>
  );
}
