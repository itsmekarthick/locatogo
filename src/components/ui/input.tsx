import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { describedBy, Field } from "./field";

export const controlClasses = cn(
  "h-10 w-full rounded-xl border border-line-strong bg-surface-1 px-3.5 text-base text-fg outline-none transition-ui sm:text-sm pointer-coarse:h-11",
  "placeholder:text-fg-subtle hover:border-fg-subtle",
  "focus:border-accent focus:ring-4 focus:ring-accent/15",
  "disabled:cursor-not-allowed disabled:bg-surface-3 disabled:opacity-60",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15",
);

export type InputProps = Omit<ComponentPropsWithRef<"input">, "size"> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Decorative icon inside the left edge. */
  leading?: ReactNode;
  /** Icon or control inside the right edge. */
  trailing?: ReactNode;
  containerClassName?: string;
};

export function Input({
  label,
  hint,
  error,
  leading,
  trailing,
  containerClassName,
  className,
  id,
  required,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-[1.1rem] text-fg-subtle">
            {leading}
          </span>
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, { hint, error })}
          className={cn(controlClasses, leading ? "pl-10" : "", trailing ? "pr-11" : "", className)}
          {...props}
        />
        {trailing && <span className="absolute inset-y-0 right-2 grid place-items-center">{trailing}</span>}
      </div>
    </Field>
  );
}
