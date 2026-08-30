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
      title="locatogo"
    >
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          {/* Warm Radiant Blue Gradient Background */}
          <linearGradient id={`blueBg_${id}`} x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Warm Golden Sunbeam Gradient */}
          <linearGradient id={`gold_${id}`} x1="50" y1="36" x2="78" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          {/* White Porcelain Pin Gradient */}
          <linearGradient id={`pin_${id}`} x1="32" y1="24" x2="96" y2="104" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f9ff" />
          </linearGradient>
        </defs>

        {/* 1. Warm Radiant Sapphire Squircle Base */}
        <rect width="128" height="128" rx="32" fill={`url(#blueBg_${id})`} />
        <rect x="1.5" y="1.5" width="125" height="125" rx="30.5" stroke="white" strokeOpacity="0.35" strokeWidth="2.5" />

        {/* 2. Warm Ambient Sunlit Glow */}
        <circle cx="64" cy="56" r="30" fill="#fef08a" fillOpacity="0.2" />

        {/* 3. Modern Pin & Warm Navigator Needle */}
        <g>
          {/* Outer Precision Pin Loop */}
          <path
            d="M64 22C45.2223 22 30 37.2223 30 56C30 76.8 54 99.4 62.4 104.8C63.4 105.4 64.6 105.4 65.6 104.8C74 99.4 98 76.8 98 56C98 37.2223 82.7777 22 64 22ZM64 74C54.0589 74 46 65.9411 46 56C46 46.0589 54.0589 38 64 38C73.9411 38 82 46.0589 82 56C82 65.9411 73.9411 74 64 74Z"
            fill={`url(#pin_${id})`}
          />

          {/* Dynamic Warm Amber/Gold Compass Needle */}
          <path
            d="M64 42L74 64L64 60L54 64L64 42Z"
            fill={`url(#gold_${id})`}
          />

          {/* Radiant Center Pinpoint */}
          <circle cx="64" cy="58" r="3.5" fill="#1e3a8a" />
        </g>
      </svg>
    </div>
  );
}
