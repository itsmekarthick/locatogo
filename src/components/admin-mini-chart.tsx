"use client";

type MiniChartProps = {
  data: { label: string; value: number }[];
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
  activeBarColor = "var(--coral)",
  showLabels = true,
  title,
  subtitle,
}: MiniChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-[var(--background)] p-8 text-center">
        <p className="text-xs text-[var(--ink-muted)]">No data to display yet</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;
  const gap = 4; // percent
  const effectiveBarWidth = barWidth - gap;

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{subtitle}</p>}
        </div>
      )}

      <div className="relative" style={{ height }}>
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((fraction) => (
          <div
            key={fraction}
            className="absolute inset-x-0 border-t border-dashed border-[var(--line)]"
            style={{ bottom: `${fraction * 100}%` }}
          />
        ))}

        {/* Bars */}
        <svg width="100%" height="100%" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
          {data.map((item, i) => {
            const barH = (item.value / max) * height;
            const x = i * barWidth + gap / 2;
            const isLast = i === data.length - 1;
            const color = isLast ? activeBarColor : barColor;

            return (
              <g key={`${item.label}-${i}`}>
                <rect
                  x={`${x}%`}
                  y={height - barH}
                  width={`${effectiveBarWidth}%`}
                  height={barH}
                  rx="3"
                  ry="3"
                  fill={color}
                  opacity={isLast ? 1 : 0.55}
                >
                  <animate
                    attributeName="height"
                    from="0"
                    to={barH}
                    dur="0.8s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.25 0.46 0.45 0.94"
                    keyTimes="0;1"
                  />
                  <animate
                    attributeName="y"
                    from={height}
                    to={height - barH}
                    dur="0.8s"
                    fill="freeze"
                    calcMode="spline"
                    keySplines="0.25 0.46 0.45 0.94"
                    keyTimes="0;1"
                  />
                </rect>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="mt-2 flex" style={{ gap: `${gap}%` }}>
          {data.map((item, i) => (
            <div key={`${item.label}-${i}`} className="flex-1 text-center" style={{ minWidth: 0 }}>
              <p className={`truncate text-[9px] ${i === data.length - 1 ? "font-bold text-[var(--foreground)]" : "text-[var(--ink-muted)]"}`}>
                {item.label}
              </p>
              <p className={`text-[10px] font-mono ${i === data.length - 1 ? "font-bold text-[var(--coral)]" : "text-[var(--ink-faint)]"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type AreaChartProps = {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  title?: string;
  subtitle?: string;
};

export function AdminAreaChart({
  data,
  height = 100,
  color = "var(--coral)",
  title,
  subtitle,
}: AreaChartProps) {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 300;
  const h = height;
  const padding = 2;

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * (w - padding * 2),
    y: padding + (1 - d.value / max) * (h - padding * 2),
  }));

  // Create smooth curve using quadratic bezier
  let pathD = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` Q${cpx},${prev.y} ${curr.x},${curr.y}`;
  }

  const areaD = `${pathD} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{subtitle}</p>}
        </div>
      )}

      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3.5 : 0} fill={color}>
            {i === points.length - 1 && <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />}
          </circle>
        ))}
      </svg>

      <div className="mt-1.5 flex justify-between">
        {data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)).map((d, i) => (
          <span key={`${d.label}-${i}`} className="text-[9px] text-[var(--ink-faint)]">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
