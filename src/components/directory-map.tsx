"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { getMapTileConfiguration } from "@/lib/map/provider";

const markerIcon = L.divIcon({
  className: "mapora-marker",
  html: "<span></span>",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

type MapListing = {
  id: string;
  title: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  short_description?: string | null;
  is_featured?: boolean;
};

type LocatedListing = MapListing & { latitude: number; longitude: number };

function MapController({ located }: { located: LocatedListing[] }) {
  const map = useMap();

  useEffect(() => {
    if (located.length === 1) {
      map.setView([located[0].latitude, located[0].longitude], 14, { animate: true });
    } else if (located.length > 1) {
      const bounds = L.latLngBounds(located.map((l) => [l.latitude, l.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
    }
  }, [located, map]);

  return null;
}

export function DirectoryMap({ listings, domainSlug }: { listings: MapListing[]; domainSlug: string }) {
  const located = listings.filter(
    (listing): listing is LocatedListing =>
      listing.latitude !== null && listing.longitude !== null
  );
  const center: [number, number] = located.length ? [located[0].latitude, located[0].longitude] : [12.7985, 77.7032];
  const tiles = getMapTileConfiguration();

  return (
    <div className="relative h-full min-h-[500px] w-full overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--paper)] shadow-sm">
      <MapContainer
        center={center}
        zoom={located.length ? 13 : 11}
        scrollWheelZoom={false}
        className="h-full min-h-[500px] w-full z-0"
      >
        <TileLayer attribution={tiles.attribution} url={tiles.urlTemplate} />
        <MapController located={located} />

        {located.map((listing) => (
          <Marker key={listing.id} position={[listing.latitude, listing.longitude]} icon={markerIcon}>
            <Popup className="mapora-popup">
              <div className="p-1 max-w-[200px]">
                {listing.is_featured && (
                  <span className="mb-1 inline-block rounded-full bg-[var(--coral-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--coral)]">
                    Featured
                  </span>
                )}
                <h4 className="font-semibold text-sm text-[var(--foreground)]">{listing.title}</h4>
                {listing.city && <p className="text-xs text-[var(--ink-muted)] mt-0.5">{listing.city}</p>}
                {listing.short_description && (
                  <p className="text-xs text-[var(--ink-muted)] mt-1.5 line-clamp-2">{listing.short_description}</p>
                )}
                <div className="mt-2.5 pt-2 border-t border-[var(--line)]">
                  <a
                    href={`/${domainSlug}/listing/${listing.slug}`}
                    className="inline-block text-xs font-bold text-[var(--coral)] hover:underline"
                  >
                    View details →
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map Legend / Summary Pill */}
      <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)]/95 px-4 py-2 text-xs font-semibold shadow-md backdrop-blur-md">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--coral)] animate-pulse" />
        <span>{located.length} {located.length === 1 ? "place" : "places"} mapped</span>
      </div>
    </div>
  );
}
