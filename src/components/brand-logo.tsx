"use client";

import Image from "next/image";

export function BrandLogo({
  size = 38,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none transition-transform motion-safe:hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
      title="LocaToGo"
    >
      <Image
        src="/logo.svg"
        alt="LocaToGo Logo"
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain drop-shadow-sm"
        priority
        unoptimized
      />
    </div>
  );
}
