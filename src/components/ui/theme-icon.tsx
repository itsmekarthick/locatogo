import { cn } from "@/lib/utils/cn";
import { MoonIcon, SunIcon } from "./icons";

/** Sun and moon stacked; the hidden one rotates and shrinks away while the other turns in. Opacity, rotate and scale only. */
export function ThemeIcon({ showSun, className }: { showSun: boolean; className?: string }) {
  const layer = "absolute inset-0 transition-ui duration-300 ease-emphasized";
  return (
    <span aria-hidden="true" className={cn("relative inline-block size-[1em]", className)}>
      <SunIcon className={cn(layer, showSun ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0")} />
      <MoonIcon className={cn(layer, showSun ? "-rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")} />
    </span>
  );
}
