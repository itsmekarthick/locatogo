"use client";

import { useEffect, useState, useCallback } from "react";

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDistance = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setErrorMsg("Geolocation not supported");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const directKm = calculateDistanceKm(
          pos.coords.latitude,
          pos.coords.longitude,
          latitude,
          longitude
        );

        const roadKm = directKm * 1.3;
        const driveMins = Math.max(2, Math.round((roadKm / 22) * 60));
        const walkMins = Math.round((directKm / 4.5) * 60);

        setDistanceInfo({
          km: Number(roadKm.toFixed(1)),
          driveMins,
          walkMins,
        });
        setIsLoading(false);
      },
      (err) => {
        setIsLoading(false);
        if (err.code === 1) {
          setErrorMsg("Location permission needed");
        } else {
          setErrorMsg("Could not detect GPS location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [latitude, longitude]);

  useEffect(() => {
    fetchDistance();
  }, [fetchDistance]);

  if (distanceInfo) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-2 text-xs font-semibold text-emerald-950 shadow-2xs animate-in fade-in duration-200">
        <span className="text-sm">🚗</span>
        <span>
          <strong className="font-bold text-emerald-900">{distanceInfo.driveMins} mins drive</strong>{" "}
          <span className="text-emerald-700 font-medium">({distanceInfo.km} km away)</span>
        </span>
        {distanceInfo.km <= 2 && (
          <span className="hidden sm:inline border-l border-emerald-300 pl-2 text-emerald-800">
            🚶 {distanceInfo.walkMins} mins walk
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={fetchDistance}
      disabled={isLoading}
      className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-gray-50/80 hover:bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition-colors cursor-pointer"
      title="Click to calculate driving distance from your location"
    >
      <span className="text-sm">📍</span>
      <span>
        {isLoading
          ? "Calculating distance..."
          : errorMsg
          ? `${errorMsg} (Retry)`
          : "Calculate distance from you"}
      </span>
    </button>
  );
}

export default PlaceDistanceBadge;
