"use client";

import { BrandLogo } from "@/components/brand-logo";

export function MapCanvasSkeleton({
  title = "Initializing Map Engine...",
  subtitle = "Calibrating geospatial coordinates...",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="relative flex h-full min-h-[400px] w-full select-none flex-col items-center justify-center overflow-hidden bg-surface-1 text-fg">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute size-48 rounded-full border-2 border-accent/20 motion-safe:animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute size-32 rounded-full border-2 border-accent/30 motion-safe:animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
        <div className="absolute size-20 rounded-full border-2 border-accent/40 motion-safe:animate-ping" style={{ animationDuration: '2s', animationDelay: '0.8s' }} />

        <div className="relative flex size-14 items-center justify-center rounded-2xl border border-line bg-surface-2 elev-lg">
          <BrandLogo size={28} className="motion-safe:animate-pulse" />
        </div>
      </div>

      <div className="z-10 flex flex-col items-center space-y-1.5 text-center">
        <h3 className="text-sm font-semibold tracking-tight text-fg">
          {title}
        </h3>
        <p className="text-[11px] text-fg-subtle">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function TechAtlasSkeleton() {
  return (
    <div role="status" aria-live="polite" className="relative flex h-dvh w-full select-none flex-col items-center justify-center overflow-hidden bg-surface-0 font-sans text-fg antialiased">
      {/* Background Matrix */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative flex items-center justify-center mb-10 z-10">
        {/* Radar Waves */}
        <div className="absolute size-64 rounded-full border border-accent/10 motion-safe:animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="absolute size-48 rounded-full border border-accent/20 motion-safe:animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute size-32 rounded-full border-2 border-accent/30 motion-safe:animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />

        {/* Central Modern Logo Core */}
        <div className="relative size-24 rounded-full bg-gradient-to-br from-accent/40 to-transparent p-[2px] backdrop-blur-xl">
          <div className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-surface-2">
            {/* Inner ambient glow */}
            <div className="absolute right-0 top-0 size-20 -translate-y-1/3 translate-x-1/3 rounded-full bg-accent opacity-40 blur-[24px] motion-safe:animate-pulse" />

            <div className="relative z-10 flex size-16 items-center justify-center">
              <BrandLogo size={48} className="motion-safe:animate-pulse" />
            </div>
          </div>

          {/* Orbiting Satellite Dot */}
          <div className="absolute left-0 top-0 size-full motion-safe:animate-[spin_2s_linear_infinite]">
            <div className="absolute left-1/2 top-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
          </div>
        </div>
      </div>

      <div className="z-10 flex flex-col items-center space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          <span className="animate-brand-reveal">LocaToGo<span className="text-accent-text">.</span></span>
        </h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-fg-subtle">
          <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
          Synchronizing Global Directory...
        </div>
      </div>
    </div>
  );
}

export default TechAtlasSkeleton;
