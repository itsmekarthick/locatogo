export default function ListingsLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-80 rounded-lg bg-slate-100 dark:bg-slate-850" />
        </div>
      </div>

      {/* Tabbed Directory Table Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Filter bar skeleton */}
        <div className="border-b border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
          <div className="h-9 w-60 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>

        {/* Row skeletons */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div key={row} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-7 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
