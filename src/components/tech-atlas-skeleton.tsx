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
    <div className="relative w-full h-full min-h-[400px] bg-[var(--paper)] flex flex-col items-center justify-center overflow-hidden select-none">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute h-48 w-48 rounded-full border-2 border-[#0ea5e9]/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute h-32 w-32 rounded-full border-2 border-[#0ea5e9]/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
        <div className="absolute h-20 w-20 rounded-full border-2 border-[#0ea5e9]/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.8s' }} />
        
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--paper)] shadow-xl border border-[var(--line)]">
          <BrandLogo size={28} className="animate-bounce" />
        </div>
      </div>

      <div className="z-10 flex flex-col items-center text-center space-y-1.5 animate-pulse">
        <h3 className="font-bold text-sm text-[var(--foreground)] tracking-tight">
          {title}
        </h3>
        <p className="text-[11px] text-[var(--ink-muted)]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function TechAtlasSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col bg-[var(--background)] items-center justify-center overflow-hidden font-sans antialiased select-none">
      {/* Background Matrix */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none"
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
        <div className="absolute h-64 w-64 rounded-full border border-[#0ea5e9]/10 animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="absolute h-48 w-48 rounded-full border border-[#0ea5e9]/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute h-32 w-32 rounded-full border-2 border-[#0ea5e9]/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
        
        {/* Central Modern Logo Core */}
        <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[#0ea5e9]/40 to-transparent p-[2px] backdrop-blur-xl shadow-[0_0_50px_rgba(14,165,233,0.2)]">
          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[var(--paper)] overflow-hidden">
            {/* Inner ambient glow */}
            <div className="absolute top-0 right-0 h-20 w-20 -translate-y-1/3 translate-x-1/3 rounded-full bg-[#0ea5e9] blur-[24px] opacity-40 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 h-16 w-16 translate-y-1/3 -translate-x-1/3 rounded-full bg-cyan-500 blur-[20px] opacity-20"></div>
            
            {/* Custom LocaToGo Brand Logo */}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center">
              <BrandLogo size={48} className="drop-shadow-[0_0_20px_rgba(14,165,233,0.7)] animate-pulse" />
            </div>
          </div>
          
          {/* Orbiting Satellite Dot */}
          <div className="absolute top-0 left-0 h-full w-full animate-[spin_2s_linear_infinite]">
             <div className="absolute top-0 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0ea5e9] shadow-[0_0_12px_#0ea5e9]"></div>
          </div>
        </div>
      </div>

      <div className="z-10 flex flex-col items-center text-center space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] animate-pulse"><span className="animate-brand-reveal">LocaToGo<span className="text-[#0ea5e9]">.</span></span>
        </h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9] animate-pulse" />
          Synchronizing Global Directory...
        </div>
      </div>
    </div>
  );
}

export default TechAtlasSkeleton;
