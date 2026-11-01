"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CompanyBrandAvatar, getCompanyLogoUrl } from "@/components/company-brand-avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, CheckIcon } from "@/components/ui/icons";
import { WEIGHTS } from "@/lib/matching/score";
import type { MatchTopPreview, NoteSample, ReadSample } from "@/lib/matching/types";
import { cn } from "@/lib/utils/cn";
import "./matches.css";

export const TYPE_MS = 14;

export const format = (value: number) => value.toLocaleString("en-US");

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type LogoRequest = { key: string; title: string; website: string | null };

/**
 * Loads a handful of logos in the background so they are cached by the time a stage needs them.
 * Nothing waits on it: each stage shows initials first and a logo only appears once it has really loaded.
 */
export function useLogoWarmup(requests: LogoRequest[]): Record<string, string> {
  const [ready, setReady] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = [];
    for (const request of requests.slice(0, 8)) {
      const url = getCompanyLogoUrl(request.website, request.title);
      if (!url) continue;
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (!cancelled && image.naturalWidth > 8) setReady((current) => ({ ...current, [request.key]: url }));
      };
      image.src = url;
      images.push(image);
    }
    return () => {
      cancelled = true;
      images.forEach((image) => {
        image.onload = null;
      });
    };
  }, [requests]);

  return ready;
}

/** Counts toward a value; the digits are written straight to the DOM so React never re-renders per frame. */
export function LiveNumber({ value, className, duration = 900 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = shown.current;
    if (from === value || reducedMotion()) {
      el.textContent = format(value);
      shown.current = value;
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3)));
      el.textContent = format(next);
      shown.current = next;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span ref={ref} aria-hidden="true" className={cn("tabular-nums", className)}>
      {format(0)}
    </span>
  );
}

/** A progress ring: the arc draws once when it appears and the middle holds whatever is passed in. */
export function Gauge({ ratio, size = 128, stroke = 8, children, className }: { ratio: number; size?: number; stroke?: number; children?: ReactNode; className?: string }) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const radius = 50 - stroke / 2;
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth={stroke} className="stroke-surface-3" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - clamped}
          className="ring-draw stroke-accent"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export type TickerItem = ReadSample & { id: number };

/** The roles being read right now, newest first; every title is a real row from the run. */
export function RoleTicker({ items, visible = 5 }: { items: TickerItem[]; visible?: number }) {
  const shown = items.slice(-visible).reverse();
  return (
    <ul role="list" aria-hidden="true" className="space-y-1.5 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
      {shown.map((item, index) => (
        <li key={item.id} className={cn("ticker-in flex items-baseline justify-between gap-3 rounded-lg bg-surface-2 px-3 py-1.5 text-sm", index >= 3 && "scan-short-hide")} style={{ opacity: 1 - index * 0.13 } as CSSProperties}>
          <span className="min-w-0 truncate text-fg">{item.title}</span>
          <span className="shrink-0 truncate text-xs text-fg-subtle">{item.location}</span>
        </li>
      ))}
    </ul>
  );
}

/** Which of the person's skills real role titles name, as bars that grow to the busiest one. */
export function SkillBars({ hits }: { hits: { skill: string; count: number }[] }) {
  const named = hits.filter((hit) => hit.count > 0).slice(0, 6);
  const silent = hits.filter((hit) => hit.count === 0);
  const max = Math.max(1, ...named.map((hit) => hit.count));
  return (
    <div>
      <ul role="list" className="space-y-2">
        {named.map((hit, index) => (
          <li key={hit.skill} style={{ "--i": index } as CSSProperties} className={cn("scan-rise stagger", index >= 4 && "scan-short-hide")}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{hit.skill}</span>
              <span className="text-xs tabular-nums text-fg-muted">
                <LiveNumber value={hit.count} duration={700} /> {hit.count === 1 ? "title" : "titles"}
              </span>
            </div>
            <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div className="bar-grow h-full rounded-full bg-accent" style={{ "--to": hit.count / max, "--i": index + 2 } as CSSProperties} />
            </div>
          </li>
        ))}
      </ul>
      {silent.length > 0 && (
        <p className="mt-2.5 text-xs leading-4 text-fg-subtle">
          Not in any title: {silent.slice(0, 5).map((hit) => hit.skill).join(", ")}
          {silent.length > 5 ? ` and ${silent.length - 5} more` : ""}.
        </p>
      )}
    </div>
  );
}

const SEGMENTS = [
  { key: "skills", label: "Skills", weight: WEIGHTS.skills, tone: "bg-accent" },
  { key: "role", label: "Work", weight: WEIGHTS.role, tone: "bg-accent/70" },
  { key: "level", label: "Level", weight: WEIGHTS.level, tone: "bg-accent/45" },
  { key: "location", label: "Place", weight: WEIGHTS.location, tone: "bg-accent/25" },
] as const;

/** The five best roles, each score drawn as the four parts that add up to it. */
export function RankRows({ top, activeId, onActive }: { top: MatchTopPreview[]; activeId: string | null; onActive: (id: string | null) => void }) {
  return (
    <div>
      <ol className="space-y-3">
        {top.slice(0, 5).map((item, index) => {
          const active = activeId !== null && activeId === item.listingId;
          return (
            <li
              key={`${item.listingId}-${item.title}-${index}`}
              tabIndex={0}
              onPointerEnter={() => onActive(item.listingId)}
              onPointerLeave={() => onActive(null)}
              onFocus={() => onActive(item.listingId)}
              onBlur={() => onActive(null)}
              style={{ "--i": index } as CSSProperties}
              className={cn("scan-rise stagger focus-ring -mx-2 rounded-xl px-2 py-1.5 transition-colors", active && "bg-surface-2")}
            >
              <div className="flex items-start gap-3">
                <span className="relative shrink-0">
                  <CompanyBrandAvatar title={item.company} website={item.website} size={32} />
                  <span aria-hidden="true" className="absolute -left-1 -top-1 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-fg">
                    {index + 1}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-fg-subtle">
                    {item.company}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                </div>
                <span className="font-display text-lg font-semibold leading-none">
                  <LiveNumber value={item.score} duration={700} />
                </span>
              </div>
              <div aria-hidden="true" className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-surface-3 pl-11">
                {SEGMENTS.map((segment, position) => (
                  <div
                    key={segment.key}
                    className={cn("bar-grow h-full", segment.tone, position === 0 && "rounded-l-full", position === SEGMENTS.length - 1 && "rounded-r-full")}
                    style={{ width: `${Math.max(0, item.breakdown[segment.key] * segment.weight)}%`, "--to": 1, "--i": index + position } as CSSProperties}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ol>
      <ul role="list" className="scan-short-hide mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-subtle">
        {SEGMENTS.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2 rounded-full", segment.tone)} />
            {segment.label} {Math.round(segment.weight * 100)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Writes real text a few characters at a time; screen readers get the full line immediately. */
export function Typed({ text, delay = 0, speed = TYPE_MS }: { text: string; delay?: number; speed?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      el.textContent = text;
      return;
    }
    el.textContent = "";
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      let count = 0;
      setTyping(true);
      interval = setInterval(() => {
        count += 1;
        el.textContent = text.slice(0, count);
        if (count >= text.length) {
          clearInterval(interval);
          setTyping(false);
        }
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [text, delay, speed]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" ref={ref} />
      {typing && (
        <span aria-hidden="true" className="caret ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-fg-muted" />
      )}
    </>
  );
}

const GAP_MS = 380;

/** How long the notes take to write out, so the scan can wait for them. */
export function notesDuration(samples: NoteSample[]) {
  return samples.reduce((total, sample) => total + ((sample.fit?.length ?? 0) + (sample.gap?.length ?? 0)) * TYPE_MS + GAP_MS * 2, 0);
}

/** The notes written for the strongest roles, typed out one role at a time. */
export function NotesPanel({ samples, onFocusIndex }: { samples: NoteSample[]; onFocusIndex: (index: number | null) => void }) {
  const starts: number[] = [];
  let cursor = 200;
  for (const sample of samples) {
    starts.push(cursor);
    cursor += ((sample.fit?.length ?? 0) + (sample.gap?.length ?? 0)) * TYPE_MS + GAP_MS * 2;
  }

  useEffect(() => {
    if (reducedMotion()) return;
    const timers = starts.map((start, index) => setTimeout(() => onFocusIndex(index), start));
    return () => timers.forEach(clearTimeout);
    // The schedule depends only on the samples it was built from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples]);

  return (
    <ol className="space-y-3">
      {samples.map((sample, index) => {
        const fitStart = starts[index];
        const gapStart = fitStart + (sample.fit?.length ?? 0) * TYPE_MS + GAP_MS;
        return (
          <li key={`${sample.title}-${index}`} style={{ "--i": index } as CSSProperties} className={cn("scan-rise stagger rounded-xl border border-line bg-surface-2/60 p-3", index >= 2 && "scan-short-hide")}>
            <div className="flex items-center gap-3">
              <CompanyBrandAvatar title={sample.company} website={sample.website} size={28} />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">{sample.title}</p>
                <p className="text-xs text-fg-subtle">{sample.company}</p>
              </div>
            </div>
            <ul role="list" className="mt-2 space-y-1 text-[13px] leading-5">
              {sample.fit && (
                <li className="flex items-start gap-2 text-fg-muted">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>
                    <Typed text={sample.fit} delay={fitStart} />
                  </span>
                </li>
              )}
              {sample.gap && (
                <li className="flex items-start gap-2 text-fg-subtle">
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>
                    <Typed text={sample.gap} delay={gapStart} />
                  </span>
                </li>
              )}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

export type LogLine = { id: string; label: string; detail: string | null; state: "done" | "active" | "pending" };

/** What has happened so far, kept on screen after each stage moves on. */
export function RunLog({ lines }: { lines: LogLine[] }) {
  return (
    <ol className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Run log">
      {lines.map((line) => (
        <li key={line.id} className="flex min-w-0 items-start gap-2.5 text-xs">
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[0.7rem] transition-colors",
              line.state === "done" ? "bg-success-soft text-success" : line.state === "active" ? "border border-accent bg-accent-soft" : "border border-line-strong",
            )}
          >
            {line.state === "done" ? <CheckIcon className="size-3" /> : line.state === "active" ? <span className="size-1.5 rounded-full bg-accent" /> : null}
          </span>
          <p className="min-w-0 leading-4">
            <span className={cn("block truncate", line.state === "pending" ? "text-fg-subtle" : "font-medium text-fg")}>{line.label}</span>
            <span className="block truncate text-fg-subtle" title={line.detail ?? undefined}>
              {line.detail ?? "\u00a0"}
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}

export function SourceBadge({ source }: { source: "ai" | "rules" }) {
  return (
    <Badge variant={source === "ai" ? "accent" : "neutral"} size="sm">
      {source === "ai" ? "Written by AI" : "Built from your profile"}
    </Badge>
  );
}
