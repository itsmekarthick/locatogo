"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { PlaceListing } from "@/components/modern-directory-explorer";
import Link from "next/link";

interface Google3DMapProps {
  listing?: (PlaceListing & { latitude: number; longitude: number }) | null;
  locatedListings?: Array<PlaceListing & { latitude: number; longitude: number }>;
  activePlaceId?: string | null;
  setActivePlaceId?: (id: string | null) => void;
  height?: string;
  className?: string;
  initialMode?: "2d" | "satellite" | "3d";
}

export function Google3DMap({
  listing,
  locatedListings = [],
  activePlaceId,
  setActivePlaceId,
  height = "340px",
  className = "",
  initialMode = "3d",
}: Google3DMapProps) {
  const [mapMode, setMapMode] = useState<"2d" | "satellite" | "3d">(initialMode);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const rotationTimerRef = useRef<any>(null);

  const places = useMemo(() => {
    if (listing) return [listing];
    return locatedListings.length > 0
      ? locatedListings
      : [
          {
            id: "blr-default",
            title: "Bangalore",
            slug: "bangalore",
            latitude: 12.9716,
            longitude: 77.5946,
          },
        ];
  }, [listing, locatedListings]);

  // Center point
  const centerPlace = useMemo(() => {
    if (activePlaceId) {
      const found = places.find((p) => p.id === activePlaceId);
      if (found) return found;
    }
    return places[0] || {
      id: "blr",
      title: "Bangalore",
      slug: "bangalore",
      latitude: 12.9716,
      longitude: 77.5946,
    };
  }, [activePlaceId, places]);

  const lat = centerPlace.latitude ?? 12.9716;
  const lng = centerPlace.longitude ?? 77.5946;

  // 360° Continuous Smooth Rotation
  useEffect(() => {
    if (isRotating && mapMode === "3d") {
      rotationTimerRef.current = setInterval(() => {
        setRotationAngle((prev) => (prev + 1) % 360);
      }, 50);
    } else {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    }
    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [isRotating, mapMode]);

  const googleMaps3dUrl = `https://www.google.com/maps/@${lat},${lng},18z/data=!3m1!1e3`;
  const googleEarthUrl = `https://earth.google.com/web/@${lat},${lng},920a,35y,45h,60t,0r`;

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-gray-800 shadow-md bg-gray-950 select-none ${className}`}>
      {/* Top Controls: Mode Switcher & 360 Rotation */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-xl bg-gray-900/90 backdrop-blur-md p-1 border border-white/10 shadow-lg text-xs font-semibold">
        <button
          onClick={() => {
            setMapMode("2d");
            setIsRotating(false);
            setRotationAngle(0);
          }}
          className={`px-2.5 py-1 rounded-lg transition-ui cursor-pointer ${
            mapMode === "2d" ? "bg-white text-gray-950 font-bold shadow-xs" : "text-gray-300 hover:text-white"
          }`}
        >
          2D
        </button>
        <button
          onClick={() => {
            setMapMode("satellite");
            setIsRotating(false);
            setRotationAngle(0);
          }}
          className={`px-2.5 py-1 rounded-lg transition-ui cursor-pointer ${
            mapMode === "satellite" ? "bg-white text-gray-950 font-bold shadow-xs" : "text-gray-300 hover:text-white"
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapMode("3d")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-ui cursor-pointer ${
            mapMode === "3d" ? "bg-[#0ea5e9] text-white font-bold shadow-xs" : "text-gray-300 hover:text-white"
          }`}
        >
          <span>🏙️</span>
          <span>3D Tilt</span>
        </button>

        {mapMode === "3d" && (
          <button
            onClick={() => setIsRotating((prev) => !prev)}
            title="Auto-Rotate 3D Perspective"
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-ui cursor-pointer ${
              isRotating
                ? "bg-cyan-600 text-white animate-pulse"
                : "bg-gray-800 text-gray-200 hover:bg-gray-700"
            }`}
          >
            {isRotating ? "⏸ Stop" : "🔄 360°"}
          </button>
        )}
      </div>

      {/* 3D Viewport with Perspective Transform */}
      <div
        className="relative w-full h-full min-h-[260px] overflow-hidden flex items-center justify-center"
        style={{
          height,
          perspective: mapMode === "3d" ? "1000px" : "none",
        }}
      >
        {/* Transform Container */}
        <div
          className="relative w-[140%] h-[140%] transition-transform duration-300 ease-out origin-center"
          style={{
            transform:
              mapMode === "3d"
                ? `rotateX(55deg) rotateZ(${rotationAngle}deg) scale(1.15)`
                : "rotateX(0deg) rotateZ(0deg) scale(1.0)",
          }}
        >
          {/* High-Resolution Satellite Map Tile Grid via ESRI World Imagery */}
          <NativeSatelliteCanvas
            latitude={lat}
            longitude={lng}
            mapMode={mapMode}
          />
        </div>

        {/* 3D Floating Target Pin for Center Venue */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div
            className="flex flex-col items-center transition-transform duration-300"
            style={{
              transform: mapMode === "3d" ? "translateY(-24px)" : "translateY(-12px)",
            }}
          >
            {/* Pulsing Target Radar */}
            <div className="relative flex items-center justify-center">
              <span className="absolute h-12 w-12 animate-ping rounded-full bg-[#0ea5e9]/40"></span>
              <span className="absolute h-7 w-7 rounded-full bg-[#0ea5e9]/70"></span>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#0ea5e9] text-white shadow-lg border-2 border-white">
                <span className="text-xs">📍</span>
              </div>
            </div>

            {/* Venue Pill */}
            <div className="mt-2 rounded-xl bg-black/85 backdrop-blur-md px-3.5 py-1.5 text-center border border-white/20 shadow-xl pointer-events-auto">
              <Link
                href={`/listing/${centerPlace.slug}`}
                className="text-white text-xs font-bold tracking-tight hover:text-[#0ea5e9] transition-colors whitespace-nowrap block"
              >
                {centerPlace.title} ↗
              </Link>
              <p className="text-gray-300 text-[10px] font-mono">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info Bar & Deep Links */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <a
            href={googleEarthUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white hover:bg-black transition-colors shadow-md border border-white/10"
          >
            <span>🌍 3D Google Earth ↗</span>
          </a>
          <a
            href={googleMaps3dUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white hover:bg-black transition-colors shadow-md border border-white/10"
          >
            <span>📍 Google Maps ↗</span>
          </a>
        </div>

        <div className="rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-gray-400 border border-white/10 hidden sm:block">
          {mapMode === "3d" ? "3D Tilt 55°" : mapMode.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

/**
 * High-performance Satellite Tile Canvas
 */
function NativeSatelliteCanvas({
  latitude,
  longitude,
  mapMode,
}: {
  latitude: number;
  longitude: number;
  mapMode: "2d" | "satellite" | "3d";
}) {
  const zoom = 16;

  // Convert GPS Lat/Lng to Tile Coordinates
  const x = Math.floor(((longitude + 180) / 360) * Math.pow(2, zoom));
  const latRad = (latitude * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );

  // Generate surrounding tile grid
  const tiles: Array<{ key: string; x: number; y: number; offsetX: number; offsetY: number }> = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      tiles.push({
        key: `${x + dx}_${y + dy}`,
        x: x + dx,
        y: y + dy,
        offsetX: dx * 256,
        offsetY: dy * 256,
      });
    }
  }

  const isSatellite = mapMode === "satellite" || mapMode === "3d";

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-[768px] h-[768px] shrink-0">
        {tiles.map((t) => {
          const tileUrl = isSatellite
            ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${t.y}/${t.x}`
            : `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${t.x}/${t.y}.png`;

          return (
            <img
              key={t.key}
              src={tileUrl}
              alt="Map Tile"
              crossOrigin="anonymous"
              className="absolute w-[256px] h-[256px] object-cover pointer-events-none select-none"
              style={{
                left: `calc(50% + ${t.offsetX - 128}px)`,
                top: `calc(50% + ${t.offsetY - 128}px)`,
              }}
              onError={(e) => {
                e.currentTarget.src = `https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`;
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
