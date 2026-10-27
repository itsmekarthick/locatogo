"use client";

import { useSyncExternalStore } from "react";

export type LayoutMode = "mobile" | "tablet" | "desktop";

const QUERIES = ["(min-width: 768px)", "(min-width: 1024px)"] as const;

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((query) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener("change", onChange));
  return () => lists.forEach((list) => list.removeEventListener("change", onChange));
}

function getMode(): LayoutMode {
  if (window.matchMedia(QUERIES[1]).matches) return "desktop";
  return window.matchMedia(QUERIES[0]).matches ? "tablet" : "mobile";
}

/** Breakpoint mode for behaviour that CSS alone cannot express. Layout itself stays CSS-driven. */
export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribe, getMode, (): LayoutMode => "desktop");
}
