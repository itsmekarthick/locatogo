"use client";

export function MapCanvasSkeleton({
  title = "Synchronizing Interactive Tech Map...",
  subtitle = "Calibrating metro coordinates & live verified hiring nodes...",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-100 dark:bg-[#060a12] flex items-center justify-center overflow-hidden select-none">
      {/* Subtle Map Grid / Matrix Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #6366f1 1px, transparent 1px),
            linear-gradient(to bottom, #6366f1 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating Center "Search this area" Skeleton Button */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-lg backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>

      {/* Floating Top-Right Controls Skeleton */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-1 shadow-md backdrop-blur-md">
        <div className="h-7 w-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-7 w-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-7 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>

      {/* Floating Bottom-Right "My Location" Skeleton Button */}
      <div className="absolute bottom-5 right-5 z-10 hidden sm:flex">
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-3.5 py-2 shadow-lg backdrop-blur-md">
          <span className="text-sm">🎯</span>
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>

      {/* High-Tech Radar / Atlas Scanner Centerpiece */}
      <div className="relative flex flex-col items-center justify-center p-6 text-center z-10">
        {/* Animated Concentric Radar Waves */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute h-52 w-52 rounded-full border border-indigo-500/20 dark:border-indigo-500/30 animate-ping duration-1000" />
          <div className="absolute h-40 w-40 rounded-full border border-indigo-500/25 dark:border-indigo-500/35 animate-pulse" />
          <div className="absolute h-28 w-28 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 animate-pulse" />

          {/* Central Hologram Radar Core */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-indigo-200 dark:border-indigo-800/80">
            <span className="text-2xl animate-bounce">🛰️</span>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>
          </div>
        </div>

        {/* Loading Text Badge */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#0c121e]/90 px-6 py-3.5 shadow-xl backdrop-blur-md max-w-sm space-y-1.5 animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TechAtlasSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-[#070b14] overflow-hidden font-sans antialiased select-none">
      {/* 1. TOP NAVBAR SKELETON */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#090d16]/95 px-3 sm:px-6 py-2.5 sm:py-3 shrink-0 backdrop-blur-md">
        <div className="mx-auto flex max-w-full items-center justify-between gap-3 sm:gap-4">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-2xs">
              <span className="text-sm font-black">L</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                LocaToGo<span className="text-indigo-600">.</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                <span>Tech Atlas</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>
          </div>

          {/* Center: Command Palette Search Bar Skeleton */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="flex items-center justify-between rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">🔍</span>
                <div className="h-5 w-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-44 rounded bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              </div>
              <div className="h-5 w-8 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-center">
                ⌘K
              </div>
            </div>
          </div>

          {/* Right: Quick Actions (Hiring badge + View Switcher + Theme + Profile) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Pulsing Hiring Now Toggle Skeleton */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="h-3 w-16 rounded bg-emerald-200/60 dark:bg-emerald-900/60 animate-pulse" />
            </div>

            {/* View Mode Switcher: Map vs Grid vs Jobs */}
            <div className="flex rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-bold">
              <div className="rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1 text-xs font-bold">
                🗺️ Map
              </div>
              <div className="rounded-full px-3 py-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                ▦ Grid
              </div>
              <div className="hidden md:flex rounded-full px-3 py-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                💼 Jobs
              </div>
            </div>

            {/* Theme Toggle & Avatar Placeholder */}
            <div className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs animate-pulse">
              🌙
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs">
              U
            </div>
          </div>
        </div>
      </header>

      {/* 2. HORIZONTAL METRO TECH HUBS STRIP */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-[#080d17]/90 px-3 sm:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 shrink-0">
          Tech Hubs:
        </span>
        {/* Active Bengaluru Hub */}
        <div className="shrink-0 rounded-full px-3 py-1 text-xs font-bold bg-indigo-600 text-white shadow-xs flex items-center gap-1.5">
          <span>🇮🇳</span>
          <span>Bengaluru</span>
          <span className="rounded-full bg-indigo-700/80 text-white px-1.5 py-0.2 text-[10px] font-mono">
            3,484
          </span>
        </div>
        {/* Other Hubs */}
        {[
          { flag: "🇮🇳", name: "Hyderabad", count: "1,939" },
          { flag: "🇮🇳", name: "Delhi NCR", count: "4,873" },
          { flag: "🇮🇳", name: "Mumbai", count: "2,386" },
          { flag: "🇮🇳", name: "Chennai", count: "2,128" },
          { flag: "🇮🇳", name: "Pune", count: "2,149" },
          { flag: "🇮🇳", name: "Kolkata", count: "1,278" },
          { flag: "🇮🇳", name: "Kochi", count: "858" },
          { flag: "🇺🇸", name: "Silicon Valley", count: "1,420" },
        ].map((h) => (
          <div
            key={h.name}
            className="shrink-0 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
          >
            <span>{h.flag}</span>
            <span>{h.name}</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-500">
              {h.count}
            </span>
          </div>
        ))}
      </div>

      {/* 3. SPLIT-SCREEN MAIN WORKSPACE (Left Directory Sidebar + Right Map Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: TECH DIRECTORY SKELETON */}
        <aside className="hidden lg:flex w-[380px] xl:w-[420px] flex-col border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0a0f1d] shrink-0">
          {/* Directory Header Bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">IN</span>
                  <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="mt-1 h-3 w-48 rounded bg-slate-100 dark:bg-slate-800/80 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 animate-pulse" />
                <div className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                  ◀
                </div>
              </div>
            </div>

            {/* Quick Sector Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <div className="rounded-full px-2.5 py-1 text-[11px] font-bold bg-indigo-600 text-white shrink-0">
                🌐 All Sectors
              </div>
              {["🤖 AI & ML", "☁️ Product & SaaS", "💼 Tech", "💳 FinTech", "🩺 HealthTech"].map((tag) => (
                <div
                  key={tag}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 shrink-0"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Company Card Skeletons */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3.5 space-y-2.5 animate-pulse">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-850" />
                    </div>
                  </div>
                  {/* Verified Hiring Badge Skeleton */}
                  <div className="h-5 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 shrink-0" />
                </div>

                {/* Tech & Stage Badges */}
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-16 rounded bg-indigo-50 dark:bg-indigo-950/60" />
                  <div className="h-4 w-14 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>

                {/* Description Line */}
                <div className="space-y-1">
                  <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-850" />
                  <div className="h-2.5 w-3/4 rounded bg-slate-100 dark:bg-slate-850" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT AREA: MAP CANVAS SKELETON */}
        <main className="flex-1 h-full relative overflow-hidden">
          <MapCanvasSkeleton />
        </main>
      </div>
    </div>
  );
}

export default TechAtlasSkeleton;
