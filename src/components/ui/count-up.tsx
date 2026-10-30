"use client";

import { useEffect, useRef } from "react";

type CountUpProps = {
  value: number | null;
  /** Milliseconds; kept short so numbers settle quickly. */
  duration?: number;
  /** ISO 4217 code; formats the number as money. */
  currency?: string;
  className?: string;
};

/**
 * Counts up once when scrolled into view. The server render, assistive tech and reduced motion all get the final value;
 * the animated text is written straight to the DOM, so React never re-renders per frame.
 */
export function CountUp({ value, duration = 800, currency, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const formatter = new Intl.NumberFormat("en-US", currency ? { style: "currency", currency } : undefined);
  const final = value == null ? "—" : formatter.format(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || value == null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const format = new Intl.NumberFormat("en-US", currency ? { style: "currency", currency } : undefined);
    el.textContent = format.format(0);
    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = value * (1 - Math.pow(1 - t, 4));
        el.textContent = format.format(t < 1 && !currency ? Math.round(eased) : t < 1 ? eased : value);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = final;
    };
  }, [value, duration, currency, final]);

  return (
    <span className={`inline-grid tabular-nums ${className ?? ""}`}>
      <span className="sr-only">{final}</span>
      {/* Invisible copy of the final value reserves width so counting never shifts layout. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {final}
      </span>
      <span ref={ref} aria-hidden="true" className="col-start-1 row-start-1">
        {final}
      </span>
    </span>
  );
}
