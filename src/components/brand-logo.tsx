"use client";

import { useId } from "react";

export function BrandLogo({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none transition-transform hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
      title="LocaToGo"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Mask to cut out the center circle of the map pin */}
          <mask id={`pin-hole-${id}`}>
            <rect width="100" height="100" fill="white" />
            <circle cx="50" cy="42" r="20" fill="black" />
          </mask>
          {/* Premium Brand Gradient (Cyber Cyan) */}
          <linearGradient id={`brand-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
        
        {/* 1. The Map Pin (Loca) */}
        <path
          mask={`url(#pin-hole-${id})`}
          d="M 50 4 C 22 4 10 26 10 46 C 10 75 50 96 50 96 C 50 96 90 75 90 46 C 90 26 78 4 50 4 Z"
          fill={`url(#brand-grad-${id})`}
        />
        
        {/* 2. The Forward/Play Arrow (ToGo) */}
        <polygon
          points="44,30 44,54 62,42"
          fill={`url(#brand-grad-${id})`}
        />
      </svg>
    </div>
  );
}
