"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { Badge, Chip } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangleIcon, ArrowUpRightIcon, BriefcaseIcon, CheckIcon, MapPinIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { MatchItem } from "@/lib/matching/types";
import { Gauge } from "./scan-parts";

const PAGE_SIZE = 10;

const label = (value: string) => value.replace(/_/g, " ");

const FIT_PARTS = [
  { key: "skills", label: "Skills" },
  { key: "role", label: "Role" },
  { key: "level", label: "Level" },
  { key: "location", label: "Place" },
] as const;

function FitMeter({ breakdown }: { breakdown: MatchItem["breakdown"] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
      {FIT_PARTS.map((part, index) => (
        <div key={part.key}>
          <div className="flex items-baseline justify-between text-xs">
            <dt className="text-fg-subtle">{part.label}</dt>
            <dd className="font-medium tabular-nums text-fg-muted">{breakdown[part.key]}</dd>
          </div>
          <div aria-hidden="true" className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
            <div className="bar-grow h-full rounded-full bg-accent" style={{ "--to": breakdown[part.key] / 100, "--i": index } as CSSProperties} />
          </div>
        </div>
      ))}
    </dl>
  );
}

function MatchCard({ item, position, best }: { item: MatchItem; position: number; best: boolean }) {
  return (
    <li
      style={{ "--i": Math.min(position, 6) } as CSSProperties}
      className={cn(
        "stagger animate-fade-up lift rounded-2xl border p-4 sm:p-5",
        best ? "border-accent/40 bg-accent-soft/50" : "border-line bg-surface-1 hover:border-line-strong",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span aria-hidden="true" className="hidden w-6 shrink-0 pt-1 text-right font-mono text-sm tabular-nums text-fg-subtle sm:block">
          {String(position + 1).padStart(2, "0")}
        </span>
        <CompanyBrandAvatar title={item.company} website={item.website} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="break-words text-base font-medium leading-snug">{item.title}</h3>
            {best && <Badge variant="accent" size="sm">Best match</Badge>}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
            {item.slug ? (
              <Link href={`/listing/${item.slug}`} className="focus-ring rounded font-medium text-fg-muted hover:text-accent-text">
                {item.company}
              </Link>
            ) : (
              <span className="font-medium text-fg-muted">{item.company}</span>
            )}
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-3.5" />
              {item.location}
            </span>
            {item.workplace && (
              <Badge size="sm" className="capitalize">
                {label(item.workplace)}
              </Badge>
            )}
          </p>
        </div>
        <div className="shrink-0">
          <Gauge ratio={item.score / 100} size={best ? 64 : 56} stroke={9}>
            <span aria-hidden="true" className="font-display text-lg font-semibold leading-none tabular-nums">
              {item.score}
            </span>
          </Gauge>
          <span className="sr-only">Fit score {item.score} out of 100</span>
        </div>
      </div>

      <div className="mt-4 sm:pl-10">
        <FitMeter breakdown={item.breakdown} />

        {(item.fitNotes.length > 0 || item.gapNotes.length > 0) && (
          <ul role="list" className="mt-4 space-y-1.5 text-sm">
            {item.fitNotes.map((note) => (
              <li key={note} className="flex items-start gap-2 text-fg-muted">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
                {note}
              </li>
            ))}
            {item.gapNotes.map((note) => (
              <li key={note} className="flex items-start gap-2 text-fg-subtle">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                {note}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {item.applyUrl && (
            <a href={item.applyUrl} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm" })}>
              Apply
              <ArrowUpRightIcon className="size-4" />
            </a>
          )}
          {item.slug && (
            <Link href={`/listing/${item.slug}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View company
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

export function MatchList({ items }: { items: MatchItem[] }) {
  const [workplace, setWorkplace] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const workplaces = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) if (item.workplace) counts.set(item.workplace, (counts.get(item.workplace) ?? 0) + 1);
    return [...counts.entries()];
  }, [items]);

  const filtered = useMemo(() => items.filter((item) => !workplace || item.workplace === workplace), [items, workplace]);
  const visible = expanded ? filtered : filtered.slice(0, PAGE_SIZE);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong">
        <EmptyState
          icon={<BriefcaseIcon />}
          title="No close matches yet"
          description="No open roles in your area relate to your skills right now. Matches refresh as new roles are added."
        />
      </div>
    );
  }

  return (
    <div>
      {workplaces.length > 1 && (
        <div role="group" aria-label="Workplace type" className="mb-4 flex flex-wrap gap-2">
          <Chip selected={workplace === null} count={items.length} onClick={() => setWorkplace(null)}>
            All
          </Chip>
          {workplaces.map(([type, count]) => (
            <Chip key={type} selected={workplace === type} count={count} onClick={() => setWorkplace(workplace === type ? null : type)} className="capitalize">
              {label(type)}
            </Chip>
          ))}
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {filtered.length} {filtered.length === 1 ? "match" : "matches"} shown
      </p>

      <ol role="list" className="space-y-3">
        {visible.map((item, index) => (
          <MatchCard key={item.id} item={item} position={index} best={index === 0 && workplace === null} />
        ))}
      </ol>

      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Show fewer" : `Show all ${filtered.length} matches`}
          </Button>
        </div>
      )}
    </div>
  );
}
