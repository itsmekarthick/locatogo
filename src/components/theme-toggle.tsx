"use client";

import { useSyncExternalStore } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeIcon } from "@/components/ui/theme-icon";
import { applyTheme, type Theme } from "@/lib/utils/theme-transition";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, (): Theme => "light");
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <IconButton
      label={`Switch to ${next} mode`}
      variant="secondary"
      className={className}
      onClick={() => applyTheme(next)}
    >
      <ThemeIcon showSun={theme === "dark"} />
    </IconButton>
  );
}
