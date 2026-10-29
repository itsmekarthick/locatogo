"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";
import { RefreshIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

/** Re-renders the server data on an interval while the tab is visible. */
export function LiveRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [live, setLive] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") startTransition(() => router.refresh());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [live, intervalMs, router]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={live}
        onClick={() => setLive((value) => !value)}
        title={live ? `Refreshing every ${intervalMs / 1000} seconds. Click to pause.` : "Paused. Click to resume live updates."}
        className={cn(
          "focus-ring inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium transition-ui",
          live ? "bg-success-soft text-success" : "bg-surface-3 text-fg-muted hover:text-fg",
        )}
      >
        <span aria-hidden="true" className={cn("size-1.5 rounded-full bg-current", live && "motion-safe:animate-pulse")} />
        {live ? "Live" : "Paused"}
      </button>
      <IconButton label="Refresh now" size="sm" variant="ghost" onClick={() => startTransition(() => router.refresh())} disabled={pending}>
        <RefreshIcon className={cn(pending && "motion-safe:animate-spin")} />
      </IconButton>
      <span role="status" aria-live="polite" className="sr-only">
        {pending ? "Refreshing" : ""}
      </span>
    </div>
  );
}
