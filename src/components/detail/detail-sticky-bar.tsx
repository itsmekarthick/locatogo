"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import "@/components/detail/detail.css";

/** `aside` sections sit in the sticky sidebar, which is always on screen from lg up, so they drop out of the nav there. */
export type DetailSection = { id: string; label: string; aside?: boolean };

type DetailStickyBarProps = {
  sections: DetailSection[];
  className?: string;
  /** Page actions. Rendered once: inline on lg and up, docked to the bottom of the screen below that. */
  children?: ReactNode;
};

const SPY_MARGIN = "-150px 0px -55% 0px";

export function DetailStickyBar({ sections, className, children }: DetailStickyBarProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const visible = useRef(new Set<string>());
  // A click scrolls past several sections; ignore the observer until it settles so the chosen tab doesn't flicker.
  const lockUntil = useRef(0);

  const ids = sections.map((section) => section.id).join("|");
  const asideIds = sections.filter((section) => section.aside).map((section) => section.id).join("|");

  useEffect(() => {
    const order = ids ? ids.split("|") : [];
    const aside = new Set(asideIds ? asideIds.split("|") : []);
    const wide = window.matchMedia("(min-width: 1024px)");
    const targets = order.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;
    const seen = visible.current;
    seen.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }
        if (performance.now() < lockUntil.current) return;
        const first = order.find((id) => seen.has(id) && !(wide.matches && aside.has(id)));
        if (first) setActive(first);
      },
      { rootMargin: SPY_MARGIN },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids, asideIds]);

  // Keep the active tab in view when the nav scrolls sideways on small screens.
  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLElement>(`[data-section="${CSS.escape(active)}"]`);
    if (!nav || !link) return;
    const target = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [active]);

  function onNavigate(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lockUntil.current = event.timeStamp + 900;
    setActive(id);
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    // No backdrop-filter on this element: it would turn the fixed mobile dock below into a child of the bar instead of the viewport.
    <div className={cn("sticky top-16 z-[var(--z-sticky)] border-b border-line", className)}>
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[var(--glass)] backdrop-blur-xl backdrop-saturate-150" />
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <nav ref={navRef} aria-label="Page sections" className="no-scrollbar -mx-2 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-2">
          {sections.map((section) => {
            const current = section.id === active;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                data-section={section.id}
                aria-current={current ? "true" : undefined}
                onClick={(event) => onNavigate(event, section.id)}
                className={cn(
                  "dt-nav-link focus-ring relative inline-flex h-14 shrink-0 items-center px-3 text-sm font-medium transition-colors pointer-coarse:px-3.5",
                  section.aside && "lg:hidden",
                  current ? "text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {section.label}
              </a>
            );
          })}
        </nav>

        {children && (
          <div
            className={cn(
              "flex items-center gap-2 lg:shrink-0",
              "max-lg:justify-center max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-[var(--z-sticky)] max-lg:border-t max-lg:border-line max-lg:bg-[var(--glass)] max-lg:px-4 max-lg:pt-3 max-lg:backdrop-blur-xl max-lg:backdrop-saturate-150",
              "max-lg:pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
