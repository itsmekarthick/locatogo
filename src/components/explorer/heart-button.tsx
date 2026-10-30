"use client";

import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type HeartButtonProps = {
  saved: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
};

/** Presentational save button. The heart pops with a spring when it becomes saved. */
export function HeartButton({ saved, onToggle, label, className }: HeartButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from saved` : `Save ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        "focus-ring grid size-9 shrink-0 place-items-center rounded-full text-lg transition-ui motion-safe:active:scale-90 pointer-coarse:size-11",
        saved ? "text-danger" : "text-fg-subtle hover:bg-surface-3 hover:text-fg",
        className,
      )}
    >
      {/* Re-keying on `saved` restarts the pop animation each time it is turned on. */}
      <HeartIcon key={String(saved)} className={cn(saved && "ex-pop fill-current")} />
    </button>
  );
}
