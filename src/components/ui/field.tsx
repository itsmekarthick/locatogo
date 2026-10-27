import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircleIcon } from "./icons";

type FieldProps = {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

/** Space-separated ids of the hint/error nodes that describe a control. */
export function describedBy(id: string, { hint, error }: { hint?: ReactNode; error?: ReactNode }) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function Field({ id, label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} aria-live="polite" className="flex items-start gap-1.5 text-[13px] text-danger">
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
