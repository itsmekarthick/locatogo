"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress on route change
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept internal link clicks to trigger instant visual loader
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        !target.hasAttribute("download") &&
        target.getAttribute("target") !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        if (href === pathname) return; // Same page click

        setLoading(true);
        setProgress(30);

        // Animate up to 85% while waiting for SSR
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              clearInterval(interval);
              return 85;
            }
            return prev + Math.random() * 20;
          });
        }, 150);

        // Safety timeout
        setTimeout(() => {
          clearInterval(interval);
          setLoading(false);
          setProgress(0);
        }, 8000);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page..."
      className="fixed top-0 left-0 right-0 z-[99999] h-[3px] pointer-events-none bg-transparent"
    >
      <div
        className="h-full origin-left bg-accent transition-[transform,opacity] duration-200 ease-standard"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
