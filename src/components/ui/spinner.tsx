import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
};

export function Spinner({ label = "Loading", className, ...props }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex size-[1em] shrink-0", className)} {...props}>
      <svg viewBox="0 0 24 24" fill="none" className="ds-spinner size-full animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
