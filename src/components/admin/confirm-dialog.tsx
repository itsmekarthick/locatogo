"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  /** `danger` for anything destructive. */
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
};

/** Confirmation step for destructive or hard-to-undo admin actions. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, tone = "danger", loading = false, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={title}
      description={description}
      dismissible={!loading}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    />
  );
}
