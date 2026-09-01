"use client";

import { useState } from "react";

export function getCompanyDomain(website?: string | null, title?: string): string {
  if (website) {
    try {
      const urlStr = website.startsWith("http") ? website : `https://${website}`;
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }
  }

  if (title) {
    // Generate probable domain from title if clean
    const clean = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.length > 2) return `${clean}.com`;
  }

  return "";
}

export function getCompanyLogoUrl(website?: string | null, title?: string): string {
  const domain = getCompanyDomain(website, title);
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export function getCompanyInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

const GRADIENTS = [
  "from-indigo-600 to-violet-600",
  "from-blue-600 to-cyan-600",
  "from-emerald-600 to-teal-600",
  "from-rose-600 to-pink-600",
  "from-amber-600 to-orange-600",
  "from-purple-600 to-indigo-600",
];

export function CompanyBrandAvatar({
  title,
  website,
  size = 40,
  className = "",
}: {
  title: string;
  website?: string | null;
  size?: number;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = getCompanyLogoUrl(website, title);
  const initials = getCompanyInitials(title);

  // Consistent gradient based on title hash
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = GRADIENTS[hash % GRADIENTS.length];

  if (!logoUrl || imgError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white font-bold text-xs shadow-xs shrink-0 select-none ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs p-1.5 shrink-0 overflow-hidden ${className}`}
    >
      <img
        src={logoUrl}
        alt={title}
        width={size - 8}
        height={size - 8}
        className="h-full w-full object-contain rounded-lg"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
