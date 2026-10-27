"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

type TabsVariant = "underline" | "pill";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  variant: TabsVariant;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tab components must be rendered inside <Tabs>.");
  return context;
}

type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  className?: string;
  children: ReactNode;
};

export function Tabs({ value, defaultValue = "", onValueChange, variant = "underline", className, children }: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;

  const setValue = useCallback(
    (next: string) => {
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [value, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current, setValue, baseId, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ className, children, ...props }: ComponentPropsWithRef<"div">) {
  const { value, variant } = useTabs();
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const measured = useRef(false);

  const measure = useCallback(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;

    const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!active) {
      indicator.style.opacity = "0";
      return;
    }

    // The first measurement jumps into place instead of animating from zero.
    if (!measured.current) {
      measured.current = true;
      indicator.style.transition = "none";
      requestAnimationFrame(() => {
        indicator.style.transition = "";
      });
    }
    indicator.style.opacity = "1";
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  }, []);

  useLayoutEffect(measure, [value, measure]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => observer.observe(tab));
    return () => observer.disconnect();
  }, [measure, children]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const tabs = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? []);
    if (tabs.length === 0) return;

    const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;

    event.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex",
        variant === "underline"
          ? "no-scrollbar gap-1 overflow-x-auto border-b border-line"
          : "inline-flex gap-1 rounded-xl bg-surface-3 p-1",
        className,
      )}
      {...props}
    >
      {children}
      <span
        ref={indicatorRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className={cn(
          "pointer-events-none absolute left-0 transition-[transform,width,opacity] duration-300 ease-emphasized",
          variant === "underline" ? "bottom-0 h-0.5 rounded-full bg-accent" : "inset-y-1 rounded-lg bg-surface-1 elev-sm",
        )}
      />
    </div>
  );
}

type TabProps = Omit<ComponentPropsWithRef<"button">, "value"> & {
  value: string;
};

export function Tab({ value, className, children, ...props }: TabProps) {
  const { value: current, setValue, baseId, variant } = useTabs();
  const selected = current === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        "focus-ring relative z-10 inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-200",
        "text-fg-muted hover:text-fg aria-selected:text-fg disabled:pointer-events-none disabled:opacity-50",
        variant === "underline" ? "h-11 rounded-lg px-3" : "h-9 rounded-lg px-3.5 pointer-coarse:h-11",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type TabPanelProps = Omit<ComponentPropsWithRef<"div">, "value"> & {
  value: string;
};

export function TabPanel({ value, className, children, ...props }: TabPanelProps) {
  const { value: current, baseId } = useTabs();
  const selected = current === value;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={!selected}
      tabIndex={0}
      className={cn("focus-ring rounded-lg", className)}
      {...props}
    >
      {selected ? children : null}
    </div>
  );
}
