"use client";

import { useSyncExternalStore } from "react";
import type { Theme } from "@/lib/utils/theme-transition";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

/** Current theme from the root `dark` class; renders as light on the server. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, (): Theme => "light");
}
