"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./icon-button";
import { XIcon } from "./icons";
import { useModalDialog } from "./use-modal-dialog";

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizes;
  /** When false, ESC and backdrop clicks do nothing (for confirmations that must be answered). */
  dismissible?: boolean;
  showClose?: boolean;
  className?: string;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  showClose = true,
  className,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const { ref, dialogProps } = useModalDialog({ open, onOpenChange, dismissible });

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="ds-dialog"
      {...dialogProps}
    >
      <div
        tabIndex={-1}
        className={cn(
          "ds-dialog-panel flex max-h-full w-full flex-col overflow-hidden rounded-3xl border border-line bg-surface-2 text-fg outline-none elev-lg",
          sizes[size],
          className,
        )}
      >
        <header className="flex items-start gap-4 px-6 pb-2 pt-6">
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
          {showClose && (
            <IconButton label="Close" size="sm" tooltip={false} onClick={() => onOpenChange(false)} className="-mr-2 -mt-1">
              <XIcon />
            </IconButton>
          )}
        </header>
        {children && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">{children}</div>}
        {footer && (
          <footer className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
