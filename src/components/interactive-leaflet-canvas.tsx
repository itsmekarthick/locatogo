"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { getMapTileConfiguration } from "@/lib/map/provider";
import type { PlaceListing } from "@/components/modern-directory-explorer";

const defaultIcon = L.divIcon({
  className: "mapora-marker",
  html: "<span></span>",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});

const activeIcon = L.divIcon({
  className: "mapora-marker is-active",
  html: "<span></span>",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: '<div class="user-location-pulse"></div><div class="user-location-dot"></div>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
});

function MapUpdater({
  located,
  activePlace,
  userLocation,
  flyToUserTrigger,
}: {
  located: (PlaceListing & { latitude: number; longitude: number })[];
  activePlace: PlaceListing | null;
  userLocation: { lat: number; lng: number } | null;
  flyToUserTrigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (flyToUserTrigger > 0 && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1 });
      return;
    }

    if (activePlace && activePlace.latitude && activePlace.longitude) {
      map.flyTo([activePlace.latitude, activePlace.longitude], 15, { duration: 0.8 });
    } else if (located.length === 1) {
      map.flyTo([located[0].latitude, located[0].longitude], 14, { duration: 0.8 });
    } else if (located.length > 1) {
      const bounds = L.latLngBounds(located.map((l) => [l.latitude, l.longitude]));
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 1 });
    }
  }, [located, activePlace, userLocation, flyToUserTrigger, map]);

  return null;
}

export default function InteractiveLeafletCanvas({
  locatedListings,
  activePlaceId,
  setActivePlaceId,
  userLocation,
  onLocateMe,
  flyToUserTrigger = 0,
}: {
  locatedListings: (PlaceListing & { latitude: number; longitude: number })[];
  activePlaceId: string | null;
  setActivePlaceId: (id: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  onLocateMe?: () => void;
  flyToUserTrigger?: number;
}) {
  const tiles = getMapTileConfiguration();
  const activePlace = useMemo(
    () => (activePlaceId ? locatedListings.find((p) => p.id === activePlaceId) ?? null : null),
    [activePlaceId, locatedListings]
  );

  const initialCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : locatedListings.length
    ? [locatedListings[0].latitude, locatedListings[0].longitude]
    : [12.7985, 77.7032]; // Chandapura Bangalore default

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={initialCenter}
        zoom={locatedListings.length ? 13 : 12}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer attribution={tiles.attribution} url={tiles.urlTemplate} />
        <MapUpdater
          located={locatedListings}
          activePlace={activePlace}
          userLocation={userLocation ?? null}
          flyToUserTrigger={flyToUserTrigger}
        />

        {/* User Location Radar Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup className="mapora-popup">
              <div className="p-1 text-center font-sans">
                <span className="font-bold text-xs text-blue-700">📍 You Are Here</span>
                <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                  Showing nearby places in Chandapura & Bangalore
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Listing Place Markers */}
        {locatedListings.map((place) => {
          const isSelected = activePlaceId === place.id;
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={isSelected ? activeIcon : defaultIcon}
              eventHandlers={{
                click: () => setActivePlaceId(place.id),
              }}
            >
              <Popup className="mapora-popup">
                <div className="p-1 max-w-[220px]">
                  {place.category_name && (
                    <span className="mb-1 inline-block rounded-full bg-[var(--leaf)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--leaf-dark)]">
                      {place.category_name}
                    </span>
                  )}
                  <h4 className="font-semibold text-sm text-[var(--foreground)]">{place.title}</h4>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                    📍 {[place.locality, place.city].filter(Boolean).join(", ")}
                  </p>
                  {place.short_description && (
                    <p className="text-xs text-[var(--ink-muted)] mt-1.5 line-clamp-2">
                      {place.short_description}
                    </p>
                  )}
                  <div className="mt-3 pt-2 border-t border-[var(--line)] flex items-center justify-between">
                    <Link
                      href={`/listing/${place.slug}`}
                      className="text-xs font-bold text-[var(--coral)] hover:underline"
                    >
                      View place →
                    </Link>
                    {place.phone && (
                      <a
                        href={`tel:${place.phone}`}
                        className="text-xs text-[var(--ink-muted)] hover:text-[var(--foreground)]"
                      >
                        📞 Call
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Action Controls on Map */}
      <div className="absolute bottom-5 right-5 z-[400] flex items-center gap-2">
        {onLocateMe && (
          <button
            onClick={onLocateMe}
            title="Auto-detect & Center on My Location"
            className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper)]/95 px-3.5 py-2 text-xs font-bold text-[var(--foreground)] shadow-lg backdrop-blur-md hover:bg-[var(--background)] transition-all cursor-pointer"
          >
            <span>🎯</span>
            <span className="hidden sm:inline">My Location</span>
          </button>
        )}

        <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)]/95 px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-md">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--coral)] animate-pulse" />
          <span>
            {locatedListings.length} {locatedListings.length === 1 ? "place" : "places"}
          </span>
        </div>
      </div>
    </div>
  );
}
