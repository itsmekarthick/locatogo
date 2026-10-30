"use client";

import { useEffect, useRef } from "react";

/** Thin bar that tracks reading progress. Scroll writes a transform straight to the DOM, so React never re-renders. */
export function ArticleReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      bar.style.transform = `scaleX(${progress})`;
      bar.style.opacity = progress > 0 ? "1" : "0";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-toast)] h-[3px]" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full origin-left bg-accent opacity-0 transition-opacity duration-200"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
