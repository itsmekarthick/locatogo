"use client";

import { useEffect, useState, type RefObject } from "react";

/** True while the element intersects the viewport. Pass `once` to latch after the first hit. */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { once = false, rootMargin = "0px", threshold = 0 }: { once?: boolean; rootMargin?: string; threshold?: number } = {},
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, once, rootMargin, threshold]);

  return inView;
}
