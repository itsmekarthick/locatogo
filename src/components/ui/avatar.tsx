"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "away" | "busy" | "offline";

const sizes: Record<AvatarSize, { box: string; text: string; px: number; dot: string }> = {
  xs: { box: "size-6", text: "text-[10px]", px: 24, dot: "size-2" },
  sm: { box: "size-8", text: "text-xs", px: 32, dot: "size-2.5" },
  md: { box: "size-10", text: "text-sm", px: 40, dot: "size-3" },
  lg: { box: "size-14", text: "text-lg", px: 56, dot: "size-3.5" },
  xl: { box: "size-20", text: "text-2xl", px: 80, dot: "size-4" },
};

const tones = [
  "bg-accent-soft text-accent-text",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
  "bg-info-soft text-info",
  "bg-surface-3 text-fg-muted",
];

const statusColors: Record<AvatarStatus, string> = {
  online: "bg-success",
  away: "bg-warning",
  busy: "bg-danger",
  offline: "bg-fg-subtle",
};

function initialsOf(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+/u, ""))
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function toneOf(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return tones[hash % tones.length];
}

type AvatarProps = {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
};

export function Avatar({ name = "", src, size = "md", status, className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;
  const { box, text, px, dot } = sizes[size];

  return (
    <span
      role="img"
      aria-label={name || "Avatar"}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full font-semibold",
        box,
        text,
        !showImage && toneOf(name),
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote hosts are not configured for next/image
        <img
          src={src ?? undefined}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src ?? null)}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
      {status && (
        <span
          aria-label={status}
          className={cn("absolute bottom-0 right-0 rounded-full ring-2 ring-surface-1", dot, statusColors[status])}
        />
      )}
    </span>
  );
}
