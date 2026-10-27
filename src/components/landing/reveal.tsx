"use client";

import { useEffect, useRef, type ComponentPropsWithRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

type RevealProps = ComponentPropsWithRef<"div"> & {
  /** Position in a staggered group; each step adds 40ms. */
  index?: number;
};

/** Fades and lifts 12px once on first scroll into view. Content already on screen is left alone. */
export function Reveal({ index = 0, className, style, children, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "in";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("lp-reveal", className)}
      style={{ "--i": index, ...style } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}
