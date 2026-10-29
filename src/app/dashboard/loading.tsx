import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-surface-0" aria-busy="true" aria-label="Loading your dashboard">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mb-8 flex items-center gap-4 border-b border-line pb-6">
          <Skeleton className="size-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-56 rounded-2xl" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
