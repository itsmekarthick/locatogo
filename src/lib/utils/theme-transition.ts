export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "locatogo_theme";

function setThemeClasses(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

/** Applies and persists a theme, crossfading with the View Transitions API when available. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    setThemeClasses(theme);
    return;
  }

  if (typeof document.startViewTransition === "function") {
    root.classList.add("theme-vt");
    const transition = document.startViewTransition(() => setThemeClasses(theme));
    transition.finished.finally(() => root.classList.remove("theme-vt"));
    return;
  }

  root.classList.add("theme-fallback");
  setThemeClasses(theme);
  window.setTimeout(() => root.classList.remove("theme-fallback"), 300);
}
