"use client";

import { useEffect, useId, useRef, type CSSProperties, type PointerEvent, type ReactNode, type UIEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./icon-button";
import { XIcon } from "./icons";
import { useModalDialog } from "./use-modal-dialog";

export type SheetSide = "responsive" | "bottom" | "right" | "left";

/** `responsive` is a bottom sheet below 768px and a right side sheet above. */
const layout: Record<SheetSide, { dialog: string; panel: string; handle: string }> = {
  responsive: {
    dialog: "items-end justify-center md:items-stretch md:justify-end",
    panel:
      "max-h-[92dvh] w-full rounded-t-3xl md:h-full md:max-h-none md:max-w-[var(--sheet-w,28rem)] md:rounded-l-3xl md:rounded-tr-none md:pb-0",
    handle: "md:hidden",
  },
  bottom: {
    dialog: "items-end justify-center",
    panel: "max-h-[92dvh] w-full rounded-t-3xl md:max-w-xl",
    handle: "",
  },
  right: {
    dialog: "items-stretch justify-end",
    panel: "h-full w-full max-w-md rounded-l-3xl",
    handle: "hidden",
  },
  left: {
    dialog: "items-stretch justify-start",
    panel: "h-full w-full max-w-md rounded-r-3xl",
    handle: "hidden",
  },
};

type DragState = { startY: number; startTime: number; offset: number };

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  side?: SheetSide;
  dismissible?: boolean;
  className?: string;
  /** Replaces the default title block; the title still names the dialog for assistive tech. */
  header?: ReactNode;
  /** Removes body padding so content can run edge to edge. */
  flush?: boolean;
  onBodyScroll?: (event: UIEvent<HTMLDivElement>) => void;
  /** Panel width from md up, as a CSS length. */
  width?: string;
};

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "responsive",
  dismissible = true,
  className,
  header,
  flush,
  onBodyScroll,
  width,
}: SheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const { ref, dialogProps } = useModalDialog({ open, onOpenChange, dismissible });
  const classes = layout[side];

  // Clear any leftover drag offset so the next open starts clean.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.transform = "";
    panel.style.transition = "";
    panel.style.removeProperty("--drag-y");
    ref.current?.style.removeProperty("--sheet-drag");
  }, [open, ref]);

  function isBottomLayout() {
    return side === "bottom" || (side === "responsive" && !window.matchMedia("(min-width: 768px)").matches);
  }

  function onDragStart(event: PointerEvent<HTMLDivElement>) {
    if (!dismissible || !isBottomLayout() || !panelRef.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input, select, textarea, [role='tab']")) return;
    drag.current = { startY: event.clientY, startTime: event.timeStamp, offset: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    panelRef.current.style.transition = "none";
  }

  function onDragMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const panel = panelRef.current;
    if (!state || !panel) return;
    state.offset = Math.max(0, event.clientY - state.startY);
    panel.style.transform = `translateY(${state.offset}px)`;
    panel.style.setProperty("--drag-y", `${state.offset}px`);
    ref.current?.style.setProperty("--sheet-drag", String(Math.min(1, state.offset / panel.offsetHeight)));
  }

  function onDragEnd(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const panel = panelRef.current;
    drag.current = null;
    if (!state || !panel) return;

    const elapsed = Math.max(1, event.timeStamp - state.startTime);
    const velocity = state.offset / elapsed;
    const dismiss = state.offset > panel.offsetHeight * 0.3 || (velocity > 0.6 && state.offset > 30);

    if (dismiss) {
      onOpenChange(false);
      return;
    }
    panel.style.transition = "transform var(--dur-base) var(--ease-spring)";
    panel.style.transform = "";
    ref.current?.style.setProperty("--sheet-drag", "0");
  }

  return (
    <dialog
      ref={ref}
      data-side={side}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn("ds-sheet", classes.dialog)}
      {...dialogProps}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        style={width ? ({ "--sheet-w": width } as CSSProperties) : undefined}
        className={cn(
          "ds-sheet-panel flex flex-col overflow-hidden border border-line bg-surface-2 text-fg outline-none elev-lg",
          "pb-[env(safe-area-inset-bottom)]",
          classes.panel,
          className,
        )}
      >
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className={cn("shrink-0", classes.handle !== "hidden" && "touch-none select-none")}
        >
          <div className={cn("flex justify-center pb-1 pt-2.5", classes.handle)}>
            <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-line-strong" />
          </div>
          <header className="flex items-start gap-4 px-6 pb-2 pt-3">
            {header ? (
              <>
                <h2 id={titleId} className="sr-only">
                  {title}
                </h2>
                <div className="min-w-0 flex-1">{header}</div>
              </>
            ) : (
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1 text-sm text-fg-muted">
                    {description}
                  </p>
                )}
              </div>
            )}
            <IconButton label="Close" size="sm" tooltip={false} onClick={() => onOpenChange(false)} className="-mr-2 -mt-1">
              <XIcon />
            </IconButton>
          </header>
        </div>
        {children && (
          <div
            onScroll={onBodyScroll}
            className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", !flush && "px-6 py-4")}
          >
            {children}
          </div>
        )}
        {footer && <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">{footer}</footer>}
      </div>
    </dialog>
  );
}
