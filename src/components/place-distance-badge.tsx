"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CarIcon, MapPinIcon } from "@/components/ui/icons";

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
      <div className="inline-flex h-9 items-center gap-2 rounded-full border border-success/30 bg-success-soft px-3 text-sm font-medium text-success animate-fade-in">
        <CarIcon className="size-4" />
        <span>
          {distanceInfo.driveMins} min drive <span className="opacity-70">({distanceInfo.km} km)</span>
        </span>
        {distanceInfo.km <= 2 && <span className="hidden border-l border-success/30 pl-2 sm:inline">{distanceInfo.walkMins} min walk</span>}
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="rounded-full"
      loading={isLoading}
      leadingIcon={<MapPinIcon className="size-4" />}
      onClick={fetchDistance}
      title="Calculate driving distance from your location"
    >
      {isLoading ? "Locating you" : errorMsg ? `${errorMsg}. Retry` : "Distance from you"}
    </Button>
  );
}

export default PlaceDistanceBadge;
