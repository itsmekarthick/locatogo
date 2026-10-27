"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

type Side = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  content: ReactNode;
  side?: Side;
  /** Hover delay in ms; keyboard focus shows immediately. */
  delay?: number;
  disabled?: boolean;
  children: ReactElement<{ "aria-describedby"?: string }>;
};

const GAP = 8;
const EDGE = 8;

function place(anchor: DOMRect, tip: HTMLElement, preferred: Side) {
  const { offsetWidth: w, offsetHeight: h } = tip;
  const room = {
    top: anchor.top - h - GAP,
    bottom: window.innerHeight - anchor.bottom - h - GAP,
    left: anchor.left - w - GAP,
    right: window.innerWidth - anchor.right - w - GAP,
  };
  const opposite: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
  const side = room[preferred] >= 0 ? preferred : room[opposite[preferred]] >= 0 ? opposite[preferred] : preferred;

  let x: number;
  let y: number;
  if (side === "top" || side === "bottom") {
    x = anchor.left + anchor.width / 2 - w / 2;
    y = side === "top" ? anchor.top - h - GAP : anchor.bottom + GAP;
  } else {
    y = anchor.top + anchor.height / 2 - h / 2;
    x = side === "left" ? anchor.left - w - GAP : anchor.right + GAP;
  }
  x = Math.min(Math.max(EDGE, x), window.innerWidth - w - EDGE);
  y = Math.min(Math.max(EDGE, y), window.innerHeight - h - EDGE);
  return { x, y };
}

export function Tooltip({ content, side = "top", delay = 400, disabled, children }: TooltipProps) {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  // Inside a modal <dialog> the tooltip has to join the top layer, so it portals into the dialog.
  const [container, setContainer] = useState<Element | null>(null);
  const open = container !== null;

  function show(wait: number) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setContainer(anchorRef.current?.closest("dialog") ?? document.body);
    }, wait);
  }

  function hide() {
    window.clearTimeout(timer.current);
    setContainer(null);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!open || !anchor || !tip) return;
    const { x, y } = place(anchor.getBoundingClientRect(), tip, side);
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
    tip.style.visibility = "visible";
  }, [open, side, content]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContainer(null);
    };
    const close = () => setContainer(null);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (disabled || content == null || content === "") return children;

  return (
    <span
      ref={anchorRef}
      className="inline-flex"
      onPointerEnter={(event: PointerEvent) => {
        if (event.pointerType !== "touch") show(delay);
      }}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(event: FocusEvent) => {
        if (event.target.matches(":focus-visible")) show(0);
      }}
      onBlur={hide}
    >
      {cloneElement(children, { "aria-describedby": open ? id : children.props["aria-describedby"] })}
      {container &&
        createPortal(
          <div
            ref={tipRef}
            id={id}
            role="tooltip"
            style={{ position: "fixed", left: 0, top: 0, visibility: "hidden", zIndex: "var(--z-tooltip)" }}
            className={cn(
              "ds-tooltip pointer-events-none max-w-xs rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium leading-snug text-ink-50 elev-md",
              "dark:bg-ink-100 dark:text-ink-900",
            )}
          >
            {content}
          </div>,
          container,
        )}
    </span>
  );
}
