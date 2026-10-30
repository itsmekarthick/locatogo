"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/ui/count-up";
import { TrendingDownIcon, TrendingUpIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import "@/components/admin/admin.css";

export type KpiTone = "accent" | "success" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<KpiTone, { tile: string; stroke: string }> = {
  accent: { tile: "bg-accent-soft text-accent-text", stroke: "var(--accent)" },
  success: { tile: "bg-success-soft text-success", stroke: "var(--success)" },
  warning: { tile: "bg-warning-soft text-warning", stroke: "var(--warning)" },
  danger: { tile: "bg-danger-soft text-danger", stroke: "var(--danger)" },
  info: { tile: "bg-info-soft text-info", stroke: "var(--info)" },
  neutral: { tile: "bg-surface-3 text-fg-muted", stroke: "var(--text-tertiary)" },
};

type KpiCardProps = {
  title: string;
  value: number;
  icon: ReactNode;
  description: string;
  /** Percentage change; the label says what it is compared with. */
  trend?: { value: number; label: string } | null;
  sparklineData?: number[];
  tone?: KpiTone;
  href?: string;
  /** ISO 4217 code; formats the value as money. */
  currency?: string;
  /** Position in the grid, for the staggered entrance. */
  index?: number;
};

function Sparkline({ data, stroke, label }: { data: number[]; stroke: string; label: string }) {
  const gradientId = useId();
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 88;
  const h = 32;
  const points = data.map((value, i) => ({ x: (i / (data.length - 1)) * w, y: 2 + (h - 4) - ((value - min) / range) * (h - 4) }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg role="img" aria-label={label} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${gradientId})`} />
      <path d={line} pathLength={1} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="adm-line" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={stroke} />
    </svg>
  );
}

export function AdminKpiCard({ title, value, icon, description, trend, sparklineData, tone = "accent", href, currency, index = 0 }: KpiCardProps) {
  const format = (amount: number) => (currency ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount) : amount.toLocaleString("en-US"));
  const colors = TONES[tone];
  const hasSpark = Boolean(sparklineData && sparklineData.length > 1);
  const up = trend ? trend.value >= 0 : true;

  const body = (
    <div
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "adm-rise relative h-full rounded-2xl border border-line bg-surface-1 p-5 elev-sm transition-flat",
        // The hover shadow fades in on an overlay so box-shadow itself is never animated.
        href && "motion-safe:group-hover:-translate-y-0.5 group-hover:border-line-strong after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:elev-md after:transition-opacity after:duration-200 group-hover:after:opacity-100",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-[1.15rem]", colors.tile)}>{icon}</span>
          <p className="truncate text-sm font-medium text-fg-muted">{title}</p>
        </div>
        {trend && (
          <Badge variant={up ? "success" : "danger"} size="sm" icon={up ? <TrendingUpIcon className="size-3.5" /> : <TrendingDownIcon className="size-3.5" />}>
            <span aria-hidden="true">{`${up ? "+" : ""}${trend.value}%`}</span>
            <span className="sr-only">{`${up ? "Up" : "Down"} ${Math.abs(trend.value)} percent ${trend.label}`}</span>
          </Badge>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="font-display text-3xl font-semibold tracking-tight text-fg"><CountUp value={value} currency={currency} /></p>
        {hasSpark && (
          <Sparkline
            data={sparklineData!}
            stroke={colors.stroke}
            label={`${title} trend over ${sparklineData!.length} periods, from ${sparklineData![0].toLocaleString("en-US")} to ${sparklineData![sparklineData!.length - 1].toLocaleString("en-US")}`}
          />
        )}
      </div>

      <p className="mt-2 text-xs text-fg-subtle">
        {description}
        {trend && <span className="text-fg-subtle"> · {trend.label}</span>}
      </p>
    </div>
  );

  if (!href) return body;

  return (
    <Link href={href} aria-label={`${title}: ${format(value)}. ${description}`} className="focus-ring group block h-full rounded-2xl">
      {body}
    </Link>
  );
}
