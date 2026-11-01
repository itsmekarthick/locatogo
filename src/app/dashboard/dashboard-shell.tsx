"use client";

import { createContext, useCallback, useContext, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export type ViewId = "overview" | "matches" | "profile" | "activity";

export type DashboardViewDef = { id: ViewId; label: string; badge?: number; content: ReactNode };

const ViewContext = createContext<{ view: ViewId; goTo: (view: ViewId, step?: string) => void } | null>(null);

export function useDashboardView() {
  const context = useContext(ViewContext);
  if (!context) throw new Error("useDashboardView must be used inside <DashboardShell>.");
  return context;
}

// Links written before the views existed still land in the right place.
const LEGACY_HASH: Record<string, { view: ViewId; step?: string }> = {
  "#matches": { view: "matches" },
  "#resume": { view: "matches", step: "upload" },
  "#profile": { view: "profile" },
  "#saved": { view: "activity" },
  "#activity": { view: "activity" },
};

/** One page, several views: switching only updates the URL, so nothing reloads and every view keeps its state. */
export function DashboardShell({ views }: { views: DashboardViewDef[] }) {
  const params = useSearchParams();
  const requested = params.get("view");
  const view = views.find((item) => item.id === requested)?.id ?? views[0].id;
  const barRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((next: ViewId, step?: string) => {
    const query = new URLSearchParams(window.location.search);
    query.set("view", next);
    if (step) query.set("step", step);
    else query.delete("step");
    window.history.pushState(null, "", `?${query.toString()}`);
    const bar = barRef.current;
    if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: "start" });
  }, []);

  useEffect(() => {
    const target = LEGACY_HASH[window.location.hash];
    if (!target) return;
    const query = new URLSearchParams(window.location.search);
    query.set("view", target.view);
    if (target.step) query.set("step", target.step);
    window.history.replaceState(null, "", `${window.location.pathname}?${query.toString()}`);
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    const index = views.findIndex((item) => item.id === view);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % views.length;
    if (event.key === "ArrowLeft") next = (index - 1 + views.length) % views.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = views.length - 1;
    event.preventDefault();
    goTo(views[next].id);
    barRef.current?.querySelector<HTMLButtonElement>(`#dash-tab-${views[next].id}`)?.focus();
  }

  return (
    <ViewContext.Provider value={{ view, goTo }}>
      <div ref={barRef} className="no-scrollbar -mx-1 mt-6 overflow-x-auto px-1 py-1">
        <div role="tablist" aria-label="Dashboard views" onKeyDown={onKeyDown} className="inline-flex gap-1 rounded-xl bg-surface-3 p-1">
          {views.map((item) => {
            const active = item.id === view;
            return (
              <button
                key={item.id}
                id={`dash-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`dash-panel-${item.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => goTo(item.id)}
                className={cn(
                  "focus-ring inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-ui pointer-coarse:h-11",
                  active ? "bg-surface-1 text-fg elev-sm" : "text-fg-muted hover:text-fg",
                )}
              >
                {item.label}
                {item.badge != null && item.badge > 0 && (
                  <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-accent-soft text-accent-text" : "bg-surface-2 text-fg-subtle")}>{item.badge.toLocaleString("en-US")}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {views.map((item) => (
        <div key={item.id} id={`dash-panel-${item.id}`} role="tabpanel" aria-labelledby={`dash-tab-${item.id}`} hidden={item.id !== view} className="mt-6 scroll-mt-4 animate-fade-up">
          {item.content}
        </div>
      ))}
    </ViewContext.Provider>
  );
}
