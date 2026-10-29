"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "locatogo_admin_sidebar";
const EVENT = "locatogo:admin-sidebar";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const read = () => window.localStorage.getItem(KEY) === "collapsed";

/** Collapsed state persisted per browser; the server render is always expanded. */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);

  const setCollapsed = useCallback((next: boolean) => {
    window.localStorage.setItem(KEY, next ? "collapsed" : "expanded");
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [collapsed, setCollapsed] as const;
}
