"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon } from "./icons";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export type ToastInput = {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss; `Infinity` keeps it until dismissed. */
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastItem = ToastInput & { id: string; closing: boolean };

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 4;
const EXIT_MS = 220;

const icons: Record<Exclude<ToastVariant, "default">, { icon: ReactNode; className: string }> = {
  success: { icon: <CheckCircleIcon />, className: "text-success" },
  error: { icon: <AlertCircleIcon />, className: "text-danger" },
  warning: { icon: <AlertTriangleIcon />, className: "text-warning" },
  info: { icon: <InfoIcon />, className: "text-info" },
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>.");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback((id?: string) => {
    setItems((prev) => prev.map((item) => (id === undefined || item.id === id ? { ...item, closing: true } : item)));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `toast-${++counter.current}`;
      setItems((prev) => {
        const active = prev.filter((item) => !item.closing);
        const overflow = active.length + 1 - MAX_VISIBLE;
        const dropped = new Set(active.slice(0, Math.max(0, overflow)).map((item) => item.id));
        return [
          ...prev.map((item) => (dropped.has(item.id) ? { ...item, closing: true } : item)),
          { ...input, id, closing: false },
        ];
      });
      return id;
    },
    [],
  );

  // Closing toasts are removed once their exit animation has had time to finish.
  useEffect(() => {
    if (!items.some((item) => item.closing)) return;
    const timer = window.setTimeout(() => setItems((prev) => prev.filter((item) => !item.closing)), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [items]);

  // Re-adding the popover moves it above any dialog that opened after the last toast.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof el.showPopover !== "function") return;
    try {
      if (el.matches(":popover-open")) el.hidePopover();
      el.showPopover();
    } catch {}
  }, [items.length]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        ref={viewportRef}
        popover="manual"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-relevant="additions"
        className="ds-toast-viewport"
      >
        {items.map((item) => (
          <ToastView key={item.id} item={item} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: (id: string) => void }) {
  const duration = item.duration ?? 5000;
  const timer = useRef<number | undefined>(undefined);
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  const start = useCallback(() => {
    if (timer.current !== undefined || !Number.isFinite(remaining.current)) return;
    startedAt.current = Date.now();
    timer.current = window.setTimeout(() => closeRef.current(item.id), remaining.current);
  }, [item.id]);

  const pause = useCallback(() => {
    if (timer.current === undefined) return;
    window.clearTimeout(timer.current);
    timer.current = undefined;
    remaining.current -= Date.now() - startedAt.current;
  }, []);

  useEffect(() => {
    if (item.closing) return;
    start();
    return pause;
  }, [item.closing, start, pause]);

  const variant = item.variant ?? "default";
  const visual = variant === "default" ? null : icons[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      data-state={item.closing ? "closing" : "open"}
      onPointerEnter={pause}
      onPointerLeave={start}
      onFocus={pause}
      onBlur={start}
      className="ds-toast flex items-start gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-fg elev-lg"
    >
      {visual && <span className={cn("mt-0.5 shrink-0 text-xl", visual.className)}>{visual.icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{item.title}</p>
        {item.description && <p className="mt-0.5 text-sm text-fg-muted">{item.description}</p>}
        {item.action && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => {
              item.action?.onClick();
              onClose(item.id);
            }}
          >
            {item.action.label}
          </Button>
        )}
      </div>
      <IconButton label="Dismiss" size="sm" tooltip={false} onClick={() => onClose(item.id)} className="-mr-2 -mt-1">
        <XIcon />
      </IconButton>
    </div>
  );
}
