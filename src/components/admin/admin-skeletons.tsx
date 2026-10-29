import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder shaped like an admin screen: title, KPI row and a table. */
export function AdminPageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface-1 p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="mt-5 h-8 w-24" />
            <Skeleton className="mt-3 h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface-1">
        <div className="border-b border-line bg-surface-2 px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-b-0">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-56 max-w-[40%]" />
            <Skeleton className="ml-auto h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
