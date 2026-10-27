import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-ui focus-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg elev-sm hover:bg-accent-hover hover:elev-md dark:hover:elev-glow",
  secondary: "border border-line-strong bg-surface-1 text-fg hover:bg-surface-3",
  ghost: "text-fg-muted hover:bg-surface-3 hover:text-fg",
  danger: "bg-danger-solid text-white elev-sm hover:bg-danger-solid-hover",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-lg text-[13px] pointer-coarse:h-11",
  md: "h-10 rounded-xl text-sm pointer-coarse:h-11",
  lg: "h-12 rounded-xl text-base",
};

const padding: Record<ButtonSize, string> = {
  sm: "px-3",
  md: "px-4",
  lg: "px-6",
};

const square: Record<ButtonSize, string> = {
  sm: "w-9 pointer-coarse:w-11",
  md: "w-10 pointer-coarse:w-11",
  lg: "w-12",
};

type VariantOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
};

/** Class string for buttons; also usable on links: `<Link className={buttonVariants({ variant: "secondary" })} />`. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  fullWidth,
  iconOnly,
  className,
}: VariantOptions = {}) {
  return cn(
    base,
    variants[variant],
    sizes[size],
    iconOnly ? square[size] : padding[size],
    fullWidth && "w-full",
    className,
  );
}

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function Button({
  variant,
  size,
  loading = false,
  fullWidth,
  leadingIcon,
  trailingIcon,
  disabled,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, size, fullWidth, className: cn(loading && "disabled:opacity-100", className) })}
      {...props}
    >
      <span className={cn("inline-flex items-center justify-center gap-2", loading && "opacity-0")}>
        {leadingIcon}
        {children}
        {trailingIcon}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner className="text-[1.1em]" />
        </span>
      )}
    </button>
  );
}
