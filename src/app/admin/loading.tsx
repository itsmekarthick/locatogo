export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-80 rounded-lg bg-slate-100 dark:bg-slate-850" />
        </div>
        <div className="h-10 w-36 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* KPI Cards Skeleton Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-slate-300 dark:bg-slate-700" />
            <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Table / Chart Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
              <div className="h-7 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
