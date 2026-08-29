"use client";

import { useEffect, useState } from "react";

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function PlaceDistanceBadge({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const [distanceInfo, setDistanceInfo] = useState<{
    km: number;
    driveMins: number;
    walkMins: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const directKm = calculateDistanceKm(
            pos.coords.latitude,
            pos.coords.longitude,
            latitude,
            longitude
          );

          // Road factor approx 1.3x for Bangalore city traffic
          const roadKm = directKm * 1.3;
          // Avg Bangalore speed ~22 km/h in urban traffic
          const driveMins = Math.max(2, Math.round((roadKm / 22) * 60));
          // Avg walking speed ~4.5 km/h
          const walkMins = Math.round((directKm / 4.5) * 60);

          setDistanceInfo({
            km: Number(roadKm.toFixed(1)),
            driveMins,
            walkMins,
          });
        },
        () => {
          // Geolocation not granted or unavailable
        },
        { timeout: 8000 }
      );
    }
  }, [latitude, longitude]);

  if (!distanceInfo) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-3.5 py-2 text-xs font-semibold text-blue-900 shadow-2xs">
      <span className="text-sm">🚗</span>
      <span>
        <strong className="font-bold text-blue-950">{distanceInfo.driveMins} mins</strong> ({distanceInfo.km} km away)
      </span>
      {distanceInfo.km <= 1.5 && (
        <span className="hidden sm:inline border-l border-blue-200 pl-2 text-blue-700">
          🚶 {distanceInfo.walkMins} mins walk
        </span>
      )}
    </div>
  );
}

export default PlaceDistanceBadge;
