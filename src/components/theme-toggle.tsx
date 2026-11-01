"use client";

import { useEffect, useSyncExternalStore } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeIcon } from "@/components/ui/theme-icon";
import { applyTheme, type Theme } from "@/lib/utils/theme-transition";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

// Counts the toggles that headers have mounted, so the floating fallback only appears on screens without one.
let mounted = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function ThemeButton({ className = "" }: { className?: string }) {
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

export function ThemeToggle({ className = "" }: { className?: string }) {
  useEffect(() => {
    mounted += 1;
    notify();
    return () => {
      mounted -= 1;
      notify();
    };
  }, []);

  return <ThemeButton className={className} />;
}

/** Sits in the top corner of any screen whose own top bar has no theme toggle, so switching theme never needs a menu. */
export function GlobalThemeToggle() {
  const headerHasToggle = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    () => mounted > 0,
    () => true,
  );

  if (headerHasToggle) return null;

  // The delay keeps it from flashing while one page's toggle unmounts and the next page's mounts.
  return (
    <div className="animate-fade-in fixed right-3 top-3 z-[var(--z-header)]" style={{ animationDelay: "300ms" }}>
      <ThemeButton />
    </div>
  );
}