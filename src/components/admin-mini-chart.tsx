"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";
import "@/components/admin/admin.css";

type Point = { label: string; value: number; /** Compact visible label; `label` still names the point for assistive tech. */ shortLabel?: string };

function DataTable({ caption, data }: { caption: string; data: Point[] }) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={`${item.label}-${i}`}>
              <th scope="row">{item.label}</th>
              <td>{item.value.toLocaleString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartHeading({ title, subtitle, id }: { title?: string; subtitle?: string; id: string }) {
  if (!title && !subtitle) return null;
  return (
    <div className="mb-4">
      {title && (
        <h3 id={id} className="text-sm font-semibold text-fg">
          {title}
        </h3>
      )}
      {subtitle && <p className="mt-0.5 text-xs text-fg-subtle">{subtitle}</p>}
    </div>
  );
}

type MiniChartProps = {
  data: Point[];
  height?: number;
  barColor?: string;
  activeBarColor?: string;
  showLabels?: boolean;
  title?: string;
  subtitle?: string;
};

export function AdminMiniChart({
  data,
  height = 120,
  barColor = "var(--line-strong)",
  activeBarColor = "var(--accent)",
  showLabels = true,
  title,
  subtitle,
}: MiniChartProps) {
  const titleId = useId();

  if (!data.length) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-2 p-8 text-center">
        <p className="text-sm text-fg-muted">No data to display yet</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const summary = `${title ?? "Bar chart"}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`;

  return (
    <div>
      <ChartHeading title={title} subtitle={subtitle} id={titleId} />

      <div role="img" aria-label={summary}>
        <div className="relative" style={{ height }} aria-hidden="true">
          {[0.25, 0.5, 0.75, 1].map((fraction) => (
            <div key={fraction} className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${fraction * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-1.5">
            {data.map((item, i) => {
              const last = i === data.length - 1;
              return (
                <div key={`${item.label}-${i}`} className="flex h-full min-w-0 flex-1 items-end" title={`${item.label}: ${item.value.toLocaleString("en-US")}`}>
                  <div
                    className={cn("adm-bar w-full rounded-t-md", !last && "opacity-60")}
                    style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0)}%`, background: last ? activeBarColor : barColor, "--i": i } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {showLabels && (
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {data.map((item, i) => {
              const last = i === data.length - 1;
              return (
                <div key={`${item.label}-${i}`} className="min-w-0 flex-1 text-center">
                  <p className={cn("truncate text-[11px]", last ? "font-medium text-fg" : "text-fg-subtle")}>{item.shortLabel ?? item.label}</p>
                  <p className={cn("font-mono text-[11px]", last ? "font-semibold text-accent-text" : "text-fg-subtle")}>{item.value.toLocaleString("en-US")}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <DataTable caption={summary} data={data} />
    </div>
  );
}

type AreaChartProps = {
  data: Point[];
  height?: number;
  color?: string;
  title?: string;
  subtitle?: string;
};

export function AdminAreaChart({ data, height = 100, color = "var(--accent)", title, subtitle }: AreaChartProps) {
  const gradientId = useId();
  const titleId = useId();

  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 300;
  const h = height;
  const padding = 3;

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * (w - padding * 2),
    y: padding + (1 - d.value / max) * (h - padding * 2),
  }));

  let line = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    line += ` Q${(prev.x + curr.x) / 2},${prev.y} ${curr.x},${curr.y}`;
  }
  const area = `${line} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;
  const summary = `${title ?? "Area chart"}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`;
  const ticks = data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2));

  return (
    <div>
      <ChartHeading title={title} subtitle={subtitle} id={titleId} />

      <div role="img" aria-label={summary}>
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} pathLength={1} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="adm-line" />
        </svg>
        <div className="mt-1.5 flex justify-between" aria-hidden="true">
          {ticks.map((d, i) => (
            <span key={`${d.label}-${i}`} className="text-[11px] text-fg-subtle">
              {d.label}
            </span>
          ))}
        </div>
      </div>
      <DataTable caption={summary} data={data} />
    </div>
  );
}
