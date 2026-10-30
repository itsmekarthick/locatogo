"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import "@/components/explorer/explorer.css";

interface ShareButtonProps {
  title: string;
  url?: string;
  className?: string;
  /** Hides the text label below the md breakpoint, leaving an icon-only button. */
  collapseLabel?: boolean;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

export function ShareButton({ title, url, className = "", collapseLabel = false }: ShareButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleShare = async () => {
    const shareUrl = url ?? `${window.location.origin}${window.location.pathname}`;
    const data = { title, url: shareUrl };

    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        // Dismissing the native sheet is not a failure, so don't fall through to copying.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyText(shareUrl);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied",
      description: shareUrl.replace(/^https?:\/\//, ""),
      variant: "success",
      duration: 3000,
    });
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Share this page"
      aria-label={copied ? "Link copied" : "Share this page"}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm font-semibold transition-ui motion-safe:active:scale-95 pointer-coarse:min-h-11",
        copied
          ? "border-success/30 bg-success-soft text-success"
          : "border-line-strong bg-surface-1 text-fg-muted hover:bg-surface-3 hover:text-fg",
        className,
      )}
    >
      {copied ? <CheckIcon key="done" className="ex-pop size-4" /> : <ShareIcon className="size-4" />}
      <span className={cn("text-xs", collapseLabel && "max-md:sr-only")}>{copied ? "Copied" : "Share"}</span>
    </button>
  );
}
