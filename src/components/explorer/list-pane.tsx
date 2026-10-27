"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type ListPaneProps = {
  /** Full header: title, sector chips and filter controls. */
  header: ReactNode;
  /** One-line summary shown once the header has collapsed. Tapping it expands the header. */
  pill: ReactNode;
  loading: boolean;
  /** Freezes scrolling, e.g. while a phone sheet is at its peek position. */
  scrollLocked?: boolean;
  /** Receives the scroll container so callers can read or restore its position. */
  onScroller?: (node: HTMLDivElement | null) => void;
  onScrollTop?: (top: number) => void;
  children: ReactNode;
};

/** Scrollable list with a glass header that slides away into a pill as you scroll (transform only). */
export function ListPane({ header, pill, loading, scrollLocked, onScroller, onScrollTop, children }: ListPaneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollerNode = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // The scroller is padded by the measured header height, exposed as --hdr-h.
  useEffect(() => {
    const root = rootRef.current;
    const head = headerRef.current;
    if (!root || !head) return;
    const observer = new ResizeObserver(([entry]) => {
      root.style.setProperty("--hdr-h", `${Math.round(entry.contentRect.height)}px`);
    });
    observer.observe(head);
    return () => observer.disconnect();
  }, []);

  const setScroller = useCallback(
    (node: HTMLDivElement | null) => {
      scrollerNode.current = node;
      onScroller?.(node);
    },
    [onScroller],
  );

  return (
    <div ref={rootRef} className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="ex-progress" data-active={loading} role="progressbar" aria-label="Loading" aria-hidden={!loading} />

      <div
        data-collapsed={collapsed}
        className="ex-collapsible absolute inset-x-0 top-0 z-20 border-b border-line bg-[var(--glass)] backdrop-blur-xl backdrop-saturate-150"
      >
        <div
          ref={headerRef}
          inert={collapsed}
          className={cn("ex-fade", collapsed && "pointer-events-none opacity-0")}
        >
          {header}
        </div>
        <button
          type="button"
          aria-label="Show filters"
          tabIndex={collapsed ? 0 : -1}
          onClick={() => scrollerNode.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className={cn(
            "ex-fade focus-ring absolute inset-x-0 bottom-0 flex h-[3.25rem] items-center gap-3 px-4 text-left",
            collapsed ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <span className="min-w-0 flex-1 truncate text-sm text-fg">{pill}</span>
          <ChevronDownIcon className="size-4 shrink-0 text-fg-subtle" />
        </button>
      </div>

      <div
        ref={setScroller}
        onScroll={(event) => {
          const top = event.currentTarget.scrollTop;
          setCollapsed((previous) => (previous ? top > 8 : top > 56));
          onScrollTop?.(top);
        }}
        style={{ paddingTop: "var(--hdr-h, 0px)" }}
        className={cn("min-h-0 flex-1 overscroll-contain", scrollLocked ? "overflow-hidden" : "overflow-y-auto")}
      >
        {children}
      </div>
    </div>
  );
}
