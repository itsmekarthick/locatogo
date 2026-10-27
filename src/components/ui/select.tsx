import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { describedBy, Field } from "./field";
import { ChevronDownIcon } from "./icons";
import { controlClasses } from "./input";

export type SelectProps = ComponentPropsWithRef<"select"> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
};

/** Styled native select: keeps the platform picker on mobile and full keyboard support. */
export function Select({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field id={selectId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, { hint, error })}
          className={cn(controlClasses, "appearance-none pr-10", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
      </div>
    </Field>
  );
}
