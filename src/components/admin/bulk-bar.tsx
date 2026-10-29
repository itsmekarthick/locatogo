"use client";

import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { XIcon } from "@/components/ui/icons";
import "@/components/admin/admin.css";

type BulkBarProps = {
  count: number;
  onClear: () => void;
  children: ReactNode;
  noun?: string;
};

/** Floating bar that slides up while rows are selected. */
export function BulkBar({ count, onClear, children, noun = "selected" }: BulkBarProps) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="adm-bulk glass elev-lg fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-[var(--z-sticky)] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-2xl px-3 py-2.5 sm:px-4"
    >
      <span aria-live="polite" className="shrink-0 border-r border-line pr-3 text-sm font-medium text-fg">
        {count.toLocaleString("en-US")} {noun}
      </span>
      <div className="flex items-center gap-2">{children}</div>
      <IconButton label="Clear selection" size="sm" onClick={onClear} className="ml-1 shrink-0">
        <XIcon />
      </IconButton>
    </div>
  );
}
