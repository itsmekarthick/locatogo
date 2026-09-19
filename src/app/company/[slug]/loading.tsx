export default function CompanyProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* 1. Global Navigation Bar Skeleton */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/30 dark:bg-indigo-600/20 animate-pulse flex items-center justify-center text-white text-sm">
                📍
              </div>
              <div className="space-y-1">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
              </div>
            </div>

            {/* Breadcrumb Skeleton */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
          </div>
        </div>
      </header>

      {/* 2. Main Company Profile Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Company Hero Card Skeleton */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0d1424] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
              {/* Brand Avatar Skeleton */}
              <div className="h-[72px] w-[72px] rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shrink-0 animate-pulse" />

              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-8 w-56 sm:w-72 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-6 w-32 bg-emerald-100/60 dark:bg-emerald-950/40 rounded-full animate-pulse" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <div className="h-4 w-24 bg-indigo-100/60 dark:bg-indigo-950/40 rounded animate-pulse" />
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="space-y-2 pt-1 max-w-2xl">
                  <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded animate-pulse" />
                  <div className="h-3.5 w-4/5 bg-slate-100 dark:bg-slate-800/80 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex flex-col gap-2.5 shrink-0 w-full sm:w-52">
              <div className="h-11 w-full bg-indigo-600/30 dark:bg-indigo-600/20 rounded-xl animate-pulse" />
              <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Quick Metrics Bar Skeleton */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 space-y-2">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Skeleton */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0d1424] p-6 sm:p-7 shadow-xs space-y-4">
          <div className="h-5 w-56 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Open Positions Section Skeleton */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0d1424] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="space-y-2">
              <div className="h-6 w-60 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-3.5 w-72 bg-slate-100 dark:bg-slate-850 rounded animate-pulse" />
            </div>
            <div className="h-4 w-36 bg-slate-100 dark:bg-slate-850 rounded animate-pulse" />
          </div>

          {/* Job Opening Card Skeletons */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="h-5 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="h-4 w-28 bg-slate-100 dark:bg-slate-850 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-slate-100 dark:bg-slate-850 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-slate-100 dark:bg-slate-850 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-9 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
