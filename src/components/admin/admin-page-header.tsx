import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

/** Page title block shared by admin and platform screens. */
export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-accent-text">{eyebrow}</p>
        <h1 className="mt-1 text-balance font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-2 max-w-[65ch] text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
