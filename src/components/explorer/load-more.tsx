"use client";

import { useEffect, useRef, type RefObject } from "react";
import { CompanyRowSkeleton } from "@/components/explorer/company-card";

type LoadMoreProps = {
  onVisible: () => void;
  rootRef: RefObject<HTMLElement | null>;
  /** Changes whenever more rows arrive, so the observer re-checks a sentinel that is still in view. */
  version: number;
};

/** Infinite-scroll sentinel with a skeleton tail so the list never looks cut off. */
export function LoadMore({ onVisible, rootRef, version }: LoadMoreProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible();
      },
      { root: rootRef.current, rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible, rootRef, version]);

  return (
    <div ref={ref} role="status" aria-label="Loading more companies">
      <CompanyRowSkeleton />
      <CompanyRowSkeleton />
    </div>
  );
}
