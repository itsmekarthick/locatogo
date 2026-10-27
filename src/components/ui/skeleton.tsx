import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div aria-hidden="true" className={cn("ds-skeleton rounded-lg", className)} {...props} />;
}

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return <Skeleton className={cn("shrink-0 rounded-full", className)} style={{ width: size, height: size }} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-3.5", index === lines - 1 && lines > 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}
