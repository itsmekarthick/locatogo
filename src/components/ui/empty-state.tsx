import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { InboxIcon } from "./icons";

type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Primary and secondary actions. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-[1.75rem] text-accent-text">
        {icon ?? <InboxIcon />}
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
