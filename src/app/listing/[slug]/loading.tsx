export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] font-sans text-slate-900 dark:text-slate-100 antialiased animate-pulse">
      {/* Top Navbar Skeleton */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-8 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </header>

      {/* Main Detail Content Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Back Link Skeleton */}
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 mb-6" />

        {/* Hero Card Skeleton */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-3xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="space-y-2">
                <div className="h-7 w-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-40 rounded-lg bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>

          <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
        </div>

        {/* Two-Column Grid: Map Preview & Info Cards Skeleton */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Reviews / About Skeleton */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
              <div className="h-6 w-36 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-20 w-full rounded-2xl bg-slate-50 dark:bg-slate-850" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Map Preview Widget Skeleton */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
              <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-48 w-full rounded-2xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-10 w-full rounded-full bg-[#e26a4f]/20" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
