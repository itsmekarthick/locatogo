import { useId, type ReactNode } from "react";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type ModuleCardProps = {
  /** Anchor target for the section nav. */
  id?: string;
  title: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  /** Right-aligned header control, e.g. a link or badge. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** Shared shell for every module on a detail page, so headings, spacing and surfaces stay consistent. */
export function ModuleCard({ id, title, icon, description, action, children, className, bodyClassName }: ModuleCardProps) {
  const titleId = useId();

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("scroll-mt-40 rounded-2xl border border-line bg-surface-1 elev-sm", className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex min-w-[min(100%,14rem)] flex-1 items-center gap-3">
          {icon && (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-[1.15rem] text-accent-text">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-fg">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("px-5 pb-5 pt-4 sm:px-6 sm:pb-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Loading placeholder shaped like a ModuleCard. */
export function ModuleSkeleton({ lines = 4, media = false, className }: { lines?: number; media?: boolean; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("rounded-2xl border border-line bg-surface-1 p-5 elev-sm sm:p-6", className)}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-xl" />
        <Skeleton className="h-5 w-40" />
      </div>
      {media && <Skeleton className="mt-5 h-48 w-full rounded-xl" />}
      <SkeletonText lines={lines} className="mt-5" />
    </div>
  );
}
