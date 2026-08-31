"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggleTheme() {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    const next = isCurrentlyDark ? "light" : "dark";

    setTheme(next);
    localStorage.setItem("locatogo_theme", next);

    if (next === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.style.colorScheme = "light";
    }
  }

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm shadow-xs transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 cursor-pointer ${className}`}
      title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
      aria-label="Toggle theme"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
