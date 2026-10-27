"use client";

import type { ComponentPropsWithRef, PointerEvent } from "react";
import { cn } from "@/lib/utils/cn";

/** Card whose border and surface glow follow the cursor (mouse only; see .lp-spot). */
export function SpotlightCard({ className, onPointerMove, children, ...props }: ComponentPropsWithRef<"div">) {
  function handleMove(event: PointerEvent<HTMLDivElement>) {
    onPointerMove?.(event);
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      onPointerMove={handleMove}
      className={cn("lp-spot rounded-3xl border border-line bg-surface-1 elev-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}
