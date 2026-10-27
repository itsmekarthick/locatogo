import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

export type CardVariant = "default" | "raised" | "outline" | "glass";
export type CardPadding = "none" | "sm" | "md" | "lg";

const variants: Record<CardVariant, string> = {
  default: "border border-line bg-surface-1 elev-sm",
  raised: "border border-line bg-surface-2 elev-md",
  outline: "border border-line-strong bg-transparent",
  glass: "glass elev-md",
};

const paddings: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

// The hover shadow fades in on a pseudo-element so only opacity animates.
const interactiveClasses =
  "relative cursor-pointer transition-ui hover:-translate-y-0.5 active:translate-y-0 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:elev-md after:transition-opacity after:duration-200 hover:after:opacity-100";

type CardProps = ComponentPropsWithRef<"div"> & {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
};

export function Card({ variant = "default", padding = "md", interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl text-fg",
        variants[variant],
        paddings[padding],
        interactive && interactiveClasses,
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithRef<"h3">) {
  return <h3 className={cn("font-display text-base font-semibold tracking-tight text-fg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div className={cn("mt-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div className={cn("mt-5 flex items-center gap-2", className)} {...props} />;
}
