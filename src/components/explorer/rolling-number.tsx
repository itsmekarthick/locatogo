import { cn } from "@/lib/utils/cn";

/** Formatted count that eases in when its value changes. */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const text = Math.max(0, Math.round(value)).toLocaleString("en-US");

  return (
    <span key={text} className={cn("ex-tick inline-block", className)}>
      {text}
    </span>
  );
}
