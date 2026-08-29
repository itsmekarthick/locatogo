"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { PlaceListing } from "@/components/modern-directory-explorer";

const InteractiveLeafletCanvas = dynamic(
  () => import("@/components/interactive-leaflet-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#f0f4f8] text-xs font-semibold text-gray-400 animate-pulse">
        Loading Map Coordinates...
      </div>
    ),
  }
);

export function PlaceMiniMap({
  listing,
}: {
  listing: PlaceListing & { latitude: number; longitude: number };
}) {
  const [mapPerspective, setMapPerspective] = useState<"street" | "satellite">("street");

  return (
    <div className="space-y-2">
      {/* Top Map Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          <span>Map Layer:</span>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-0.5 text-xs font-semibold">
          <button
            onClick={() => setMapPerspective("street")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              mapPerspective === "street"
                ? "bg-white text-gray-900 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🗺️ Street
          </button>
          <button
            onClick={() => setMapPerspective("satellite")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              mapPerspective === "satellite"
                ? "bg-[#e26a4f] text-white shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>🛰️</span>
            <span>Satellite</span>
          </button>
        </div>
      </div>

      {/* Flat Map Display (0° Tilt) */}
      <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-gray-200 shadow-xs">
        <InteractiveLeafletCanvas
          key={`mini-map-${mapPerspective}`}
          locatedListings={[listing]}
          activePlaceId={listing.id}
          setActivePlaceId={() => {}}
          isFullscreen={false}
          initialPerspective={mapPerspective}
        />
      </div>
    </div>
  );
}
