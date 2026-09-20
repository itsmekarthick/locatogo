"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

interface LocationPinPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
}

// Inner client-only Leaflet component
const InnerMap = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = await import("react-leaflet");
    const L = (await import("leaflet")).default;

    const customPinIcon = L.divIcon({
      className: "custom-pin-marker",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="position: absolute; width: 14px; height: 14px; background: #e26a4f; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(226,106,79,0.7);"></div>
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 2px solid rgba(226,106,79,0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    function MapClickHandler({
      onSelect,
    }: {
      onSelect: (lat: number, lng: number) => void;
    }) {
      useMapEvents({
        click(e) {
          onSelect(e.latlng.lat, e.latlng.lng);
        },
      });
      return null;
    }

    function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
      const map = useMap();
      useEffect(() => {
        map.setView([lat, lng], map.getZoom() < 13 ? 14 : map.getZoom());
      }, [lat, lng, map]);
      return null;
    }

    return function MapComponent({
      lat,
      lng,
      onSelect,
    }: {
      lat: number;
      lng: number;
      onSelect: (lat: number, lng: number) => void;
    }) {
      const { getMapTileConfiguration } = require("@/lib/map/provider");
      const tiles = getMapTileConfiguration();
      
      return (
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution={tiles.attribution}
            url={tiles.urlTemplate}
          />
          <Marker position={[lat, lng]} icon={customPinIcon} />
          <MapClickHandler onSelect={onSelect} />
          <MapRecenter lat={lat} lng={lng} />
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-semibold text-gray-400 animate-pulse">
        Initializing Interactive Map...
      </div>
    ),
  }
);

export function LocationPinPicker({
  initialLat = 12.9716,
  initialLng = 77.5946,
  onLocationChange,
}: LocationPinPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: initialLat || 12.9716,
    lng: initialLng || 77.5946,
  });
  const [isLocating, setIsLocating] = useState(false);

  const handleSelect = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    onLocationChange?.(lat, lng);
  };

  const handleDetect = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        handleSelect(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setIsLocating(false);
        // Fallback to IP
        fetch("/api/geolocation")
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.latitude && data.longitude) {
              handleSelect(data.latitude, data.longitude);
            }
          })
          .catch(() => {});
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
            Exact Map Coordinates (Click to drop pin)
          </label>
          <p className="text-xs text-[var(--ink-muted)]">
            Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDetect}
          disabled={isLocating}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
        >
          {isLocating ? "Locating..." : "🎯 Use My Location"}
        </button>
      </div>

      <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-gray-200 shadow-inner">
        <InnerMap
          lat={position.lat}
          lng={position.lng}
          onSelect={handleSelect}
        />
      </div>

      {/* Hidden inputs to send with the standard form submission */}
      <input type="hidden" name="latitude" value={position.lat} />
      <input type="hidden" name="longitude" value={position.lng} />
    </div>
  );
}
