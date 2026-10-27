"use client";

import { useEffect, useRef } from "react";

const format = new Intl.NumberFormat("en-US");

type CountUpProps = {
  value: number | null;
  duration?: number;
  className?: string;
};

/** Counts up once when scrolled into view. Server render and reduced motion show the final value. */
export function CountUp({ value, duration = 1400, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const final = value == null ? "—" : format.format(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || value == null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.textContent = format.format(0);
    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = format.format(Math.round(value * (1 - Math.pow(1 - t, 4))));
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
  }, [value, duration, final]);

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
