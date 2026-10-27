import type { ComponentPropsWithRef, ReactNode } from "react";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button";
import { Spinner } from "./spinner";
import { Tooltip } from "./tooltip";
import { cn } from "@/lib/utils/cn";

export type IconButtonProps = Omit<ComponentPropsWithRef<"button">, "aria-label"> & {
  /** Accessible name; also shown as the tooltip. */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Set false where the control is auto-focused, such as a dialog close button. */
  tooltip?: boolean;
  tooltipSide?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
};

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  loading = false,
  tooltip = true,
  tooltipSide,
  disabled,
  className,
  type = "button",
  children,
  ...props
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({
        variant,
        size,
        iconOnly: true,
        className: cn("text-[1.25em]", loading && "disabled:opacity-100", className),
      })}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );

  return tooltip ? (
    <Tooltip content={label} side={tooltipSide}>
      {button}
    </Tooltip>
  ) : (
    button
  );
}
