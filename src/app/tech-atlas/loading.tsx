export default function TechAtlasLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white dark:bg-[#090d16] font-sans antialiased animate-pulse">
      {/* Top Navbar Skeleton */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 px-4 py-3">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-7 w-32 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="hidden md:block flex-1 max-w-md">
            <div className="h-9 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded-full bg-indigo-600/20" />
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </header>

      {/* Hero Map Skeleton */}
      <div className="relative w-full h-[400px] sm:h-[480px] bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full bg-indigo-500/10 animate-ping" />
          <div className="absolute h-24 w-24 rounded-full bg-indigo-500/20 animate-pulse" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700">
            <span className="text-2xl animate-bounce">💼</span>
          </div>
        </div>

        {/* Floating Hub Pills Skeleton */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-10">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg backdrop-blur-md flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-7 w-24 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Place / Tech Company Cards Grid Skeleton */}
      <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 pt-16 pb-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-5 w-16 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
