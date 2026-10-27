import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { XIcon } from "./icons";

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const badgeVariants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-3 text-fg-muted",
  accent: "bg-accent-soft text-accent-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

const badgeSizes = {
  sm: "h-5 px-2 text-[11px]",
  md: "h-6 px-2.5 text-xs",
};

type BadgeProps = ComponentPropsWithRef<"span"> & {
  variant?: BadgeVariant;
  size?: keyof typeof badgeSizes;
  /** Leading status dot. */
  dot?: boolean;
  icon?: ReactNode;
};

export function Badge({ variant = "neutral", size = "md", dot, icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        badgeVariants[variant],
        badgeSizes[size],
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {icon}
      {children}
    </span>
  );
}

type ChipProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  /** Toggle state; omit for a plain action chip. */
  selected?: boolean;
  count?: number;
  leadingIcon?: ReactNode;
  /** Renders a trailing remove button. */
  onRemove?: () => void;
  removeLabel?: string;
  children: ReactNode;
};

export function Chip({
  selected,
  count,
  leadingIcon,
  onRemove,
  removeLabel = "Remove",
  className,
  type = "button",
  disabled,
  children,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full border text-[13px] font-medium transition-ui pointer-coarse:h-11",
        selected
          ? "border-accent/40 bg-accent-soft text-accent-text"
          : "border-line-strong bg-surface-1 text-fg-muted hover:bg-surface-3 hover:text-fg",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <button
        type={type}
        disabled={disabled}
        aria-pressed={selected}
        className={cn(
          "focus-ring inline-flex h-full items-center gap-1.5 rounded-full pl-3 active:scale-[0.98]",
          onRemove ? "pr-1.5" : "pr-3",
        )}
        {...props}
      >
        {leadingIcon}
        {children}
        {count != null && <span className="opacity-70">{count.toLocaleString("en-US")}</span>}
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={`${removeLabel} ${typeof children === "string" ? children : ""}`.trim()}
          onClick={onRemove}
          className="focus-ring mr-1 grid size-6 place-items-center rounded-full hover:bg-surface-3 pointer-coarse:size-9"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </span>
  );
}
