export default function TechAtlasLoading() {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50 dark:bg-[#090d16] animate-pulse">
      {/* Top Navbar Skeleton */}
      <header className="z-[1000] border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 px-4 py-3">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-36 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="hidden md:block flex-1 max-w-md">
            <div className="h-9 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </header>

      {/* Map / Content Area Skeleton */}
      <main className="relative flex-1 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Loading Tech Atlas...</p>
        </div>
      </main>
    </div>
  );
}
