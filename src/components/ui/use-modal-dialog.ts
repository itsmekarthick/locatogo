"use client";

import { useEffect, useRef, type MouseEvent, type PointerEvent, type SyntheticEvent } from "react";

// Matches the closing animation in globals.css (--dur-fast) plus a small margin.
const CLOSE_MS = 220;

type Options = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissible: boolean;
};

/** Drives a native modal <dialog>: open/close sync, exit animation, ESC and backdrop dismissal. */
export function useModalDialog({ open, onOpenChange, dismissible }: Options) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open) {
      delete el.dataset.state;
      if (!el.open) {
        el.showModal();
        const target =
          el.querySelector<HTMLElement>("[data-autofocus]") ??
          el.querySelector<HTMLElement>(".ds-dialog-panel, .ds-sheet-panel");
        target?.focus({ preventScroll: true });
      }
      return;
    }

    if (!el.open) return;
    el.dataset.state = "closing";
    const timer = window.setTimeout(() => {
      el.close();
      delete el.dataset.state;
    }, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  return {
    ref,
    dialogProps: {
      onCancel: (event: SyntheticEvent) => {
        event.preventDefault();
        if (dismissible) onOpenChange(false);
      },
      onClose: () => {
        if (open) onOpenChange(false);
      },
      onPointerDown: (event: PointerEvent<HTMLDialogElement>) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      },
      onClick: (event: MouseEvent<HTMLDialogElement>) => {
        const clickedBackdrop = pressedBackdrop.current && event.target === event.currentTarget;
        pressedBackdrop.current = false;
        if (clickedBackdrop && dismissible) onOpenChange(false);
      },
    },
  };
}
