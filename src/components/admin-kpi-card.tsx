"use client";

import { useEffect, useRef, useState } from "react";

type KpiCardProps = {
  title: string;
  value: number;
  icon: string;
  description: string;
  trend?: { value: number; label: string } | null;
  sparklineData?: number[];
  accentClass?: string;
  href?: string;
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function MiniSparkline({ data, color = "var(--coral)" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Glow dot at last point */}
      {points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={color}>
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

export function AdminKpiCard({ title, value, icon, description, trend, sparklineData, accentClass, href }: KpiCardProps) {
  const { count, ref } = useCountUp(value);

  const content = (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-[var(--line-strong)] ${href ? "cursor-pointer" : ""}`}
    >
      {/* Decorative gradient accent at top */}
      <div className={`absolute inset-x-0 top-0 h-[3px] rounded-t-2xl ${accentClass ?? "bg-gradient-to-r from-[var(--coral)] to-[var(--coral)]/40"}`} />

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
            {count.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--background)] text-base transition-transform duration-300 group-hover:scale-110">
            {icon}
          </span>
          {sparklineData && sparklineData.length > 1 && (
            <MiniSparkline data={sparklineData} />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-[var(--ink-muted)]">{description}</p>
        {trend && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trend.value >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    // Using a regular anchor since this is a client component
    return <a href={href} className="block no-underline">{content}</a>;
  }

  return content;
}
