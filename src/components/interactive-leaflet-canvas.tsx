"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import Supercluster from "supercluster";
import type { PlaceListing } from "@/components/modern-directory-explorer";
import { generateUberRideLink } from "@/lib/services/transit-links";

const MAP_LAYERS = {
  street: {
    url: process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
  },
};

function getCategoryPinIcon(place: PlaceListing, isSelected: boolean, zoom: number) {
  const cat = (place.category_name || "").toLowerCase();
  let emoji = "📍";
  let themeColor = "#2563eb";
  let bgLight = "#eff6ff";

  if (cat.includes("hospital") || cat.includes("health") || cat.includes("clinic") || cat.includes("medical") || cat.includes("care")) {
    emoji = "➕";
    themeColor = "#dc2626";
    bgLight = "#fef2f2";
  } else if (cat.includes("school") || cat.includes("education") || cat.includes("college") || cat.includes("academy") || cat.includes("institute")) {
    emoji = "🎓";
    themeColor = "#4f46e5";
    bgLight = "#eef2ff";
  } else if (cat.includes("cafe") || cat.includes("restaurant") || cat.includes("food") || cat.includes("dine") || cat.includes("bakery")) {
    emoji = "🍽️";
    themeColor = "#ea580c";
    bgLight = "#fff7ed";
  } else if (cat.includes("tech") || cat.includes("cowork") || cat.includes("startup") || cat.includes("hub")) {
    emoji = "💻";
    themeColor = "#7c3aed";
    bgLight = "#f5f3ff";
  } else if (cat.includes("retail") || cat.includes("shop") || cat.includes("store") || cat.includes("market")) {
    emoji = "🏬";
    themeColor = "#059669";
    bgLight = "#ecfdf5";
  } else if (cat.includes("petrol") || cat.includes("fuel") || cat.includes("pump")) {
    emoji = "⛽";
    themeColor = "#d97706";
    bgLight = "#fffbeb";
  } else if (cat.includes("art") || cat.includes("creative") || cat.includes("culture")) {
    emoji = "🎨";
    themeColor = "#db2777";
    bgLight = "#fdf2f8";
  }

  const showRichPill = zoom >= 12 || isSelected;
  const shortTitle = place.title.length > 22 ? place.title.slice(0, 20) + "…" : place.title;

  if (showRichPill) {
    const html = `
      <div class="locatogo-pill-pin ${isSelected ? "is-active" : ""}" style="--theme-color: ${themeColor};">
        <div class="locatogo-pin-icon-wrap" style="background: ${bgLight}; color: ${themeColor};">
          <span>${emoji}</span>
        </div>
        <div class="locatogo-pin-label">
          <span class="locatogo-pin-title">${shortTitle}</span>
        </div>
        <div class="locatogo-pin-arrow"></div>
      </div>
    `;

    return L.divIcon({
      className: "locatogo-pill-wrapper",
      html,
      iconSize: [160, 36],
      iconAnchor: [80, 36],
      popupAnchor: [0, -38],
    });
  }

  const html = `
    <div class="locatogo-teardrop-pin ${isSelected ? "is-active" : ""}" style="--theme-color: ${themeColor}; background: ${isSelected ? "#18181b" : themeColor};">
      <div class="locatogo-teardrop-inner">
        <span>${emoji}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "locatogo-teardrop-wrapper",
    html,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -40],
  });
}

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: '<div class="user-location-pulse"></div><div class="user-location-dot"></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

/**
 * Responsive 1-Notch Wheel Zoom with Instant Feedback
 */
function StrictSingleStepWheelZoom({
  onZoomChange,
}: {
  onZoomChange?: (zoomIn: () => void, zoomOut: () => void) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (onZoomChange) {
      onZoomChange(
        () => map.zoomIn(1, { animate: true }),
        () => map.zoomOut(1, { animate: true })
      );
    }
  }, [map, onZoomChange]);

  useEffect(() => {
    if (map.scrollWheelZoom) {
      map.scrollWheelZoom.disable();
    }

    let accumulatedDelta = 0;
    let resetTimer: any = null;
    let isAnimating = false;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (resetTimer) {
        clearTimeout(resetTimer);
      }

      accumulatedDelta += e.deltaY;

      if (!isAnimating && Math.abs(accumulatedDelta) >= 90) {
        isAnimating = true;
        if (accumulatedDelta < 0) {
          map.zoomIn(1, { animate: true });
        } else {
          map.zoomOut(1, { animate: true });
        }
        accumulatedDelta = 0;

        setTimeout(() => {
          isAnimating = false;
        }, 180);
      }

      resetTimer = setTimeout(() => {
        accumulatedDelta = 0;
        isAnimating = false;
      }, 120);
    };

    const container = map.getContainer();
    container.addEventListener("wheel", handleWheel, { passive: false, capture: true });

    return () => {
      container.removeEventListener("wheel", handleWheel, { capture: true });
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [map]);

  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (loc: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

/**
 * Robust Location Controller
 * Directly handles instant smooth flyTo when user clicks "My Location"
 */
function LocationController({
  onLocationFound,
}: {
  onLocationFound: (loc: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  const handleLocateMe = useCallback(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          onLocationFound(loc);
          map.flyTo([loc.lat, loc.lng], 15, { duration: 1.5 });
        },
        (err) => {
          console.warn("Browser GPS permission not granted or unavailable:", err.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  }, [map, onLocationFound]);

  useEffect(() => {
    (window as any).__locatogo_locate_me = handleLocateMe;
    return () => {
      delete (window as any).__locatogo_locate_me;
    };
  }, [handleLocateMe]);

  return null;
}

function MapUpdater({
  located,
  activePlace,
  userLocation,
  flyToUserTrigger,
}: {
  located: (PlaceListing & { latitude: number; longitude: number })[];
  activePlace: (PlaceListing & { latitude: number; longitude: number }) | null;
  userLocation: { lat: number; lng: number } | null;
  flyToUserTrigger: number;
}) {
  const map = useMap();
  const prevActiveIdRef = useRef<string | null>(null);
  const prevCountRef = useRef<number>(-1);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (flyToUserTrigger > 0 && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.5 });
    }
  }, [flyToUserTrigger, userLocation, map]);

  useEffect(() => {
    if (activePlace && activePlace.id !== prevActiveIdRef.current) {
      prevActiveIdRef.current = activePlace.id;
      map.flyTo([activePlace.latitude, activePlace.longitude], 15, { duration: 1.2 });
    }
  }, [activePlace, map]);

  useEffect(() => {
    if (!activePlace && located.length > 0 && flyToUserTrigger === 0) {
      if (!isInitializedRef.current || prevCountRef.current !== located.length) {
        isInitializedRef.current = true;
        prevCountRef.current = located.length;
        if (located.length === 1) {
          map.setView([located[0].latitude, located[0].longitude], 14);
        } else {
          const bounds = L.latLngBounds(located.map((l) => [l.latitude, l.longitude]));
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
        }
      }
    }
  }, [located, activePlace, flyToUserTrigger, map]);

  return null;
}

function ClusteredMarkersLayer({
  locatedListings,
  activePlaceId,
  setActivePlaceId,
  userLocation,
}: {
  locatedListings: (PlaceListing & { latitude: number; longitude: number })[];
  activePlaceId: string | null;
  setActivePlaceId: (id: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState<number>(map.getZoom());

  const updateBounds = useCallback(() => {
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  }, [map]);

  useMapEvents({
    moveend: updateBounds,
    zoomend: updateBounds,
  });

  useEffect(() => {
    updateBounds();
  }, [updateBounds]);

  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 40,
      maxZoom: 15,
      minPoints: 2,
    });

    const points: Array<GeoJSON.Feature<GeoJSON.Point, PlaceListing & { latitude: number; longitude: number }>> =
      locatedListings.map((listing) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [listing.longitude, listing.latitude],
        },
        properties: listing,
      }));

    sc.load(points);
    return sc;
  }, [locatedListings]);

  const clusters = useMemo(() => {
    if (!bounds) return [];
    try {
      return supercluster.getClusters(bounds, Math.floor(zoom));
    } catch {
      return [];
    }
  }, [supercluster, bounds, zoom]);

  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties as {
          cluster?: boolean;
          point_count?: number;
        };

        if (isCluster && pointCount) {
          const clusterIcon = L.divIcon({
            className: "locatogo-cluster-marker",
            html: `<span>${pointCount}</span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          });

          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={clusterIcon}
              eventHandlers={{
                click: () => {
                  const targetZoom = Math.min(
                    map.getZoom() + 2,
                    supercluster.getClusterExpansionZoom(cluster.id as number) || 16
                  );
                  map.flyTo([latitude, longitude], targetZoom, { duration: 0.6 });
                },
              }}
            />
          );
        }

        const place = cluster.properties as PlaceListing & { latitude: number; longitude: number };
        const isSelected = activePlaceId === place.id;
        const icon = getCategoryPinIcon(place, isSelected, zoom);

        const uberUrl = generateUberRideLink(place.latitude, place.longitude, place.title, place.locality);

        return (
          <Marker
            key={`place-${place.id}`}
            position={[place.latitude, place.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => setActivePlaceId(place.id),
            }}
          >
            <Popup className="locatogo-popup">
              <div className="p-3 max-w-[240px] font-sans">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  {place.category_name && (
                    <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-900">
                      {place.category_name}
                    </span>
                  )}
                  {typeof place.distanceKm === "number" && (
                    <span className="text-[10px] font-bold text-emerald-700">
                      🚗 {place.distanceKm.toFixed(1)} km
                    </span>
                  )}
                </div>

                <h4 className="font-serif font-bold text-sm text-gray-950 leading-tight">
                  {place.title}
                </h4>

                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                  <span>📍</span>
                  <span>{[place.locality, place.city].filter(Boolean).join(", ")}</span>
                </p>

                {place.short_description && (
                  <p className="text-[11px] text-gray-600 mt-1.5 line-clamp-2 leading-snug">
                    {place.short_description}
                  </p>
                )}

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                  <a
                    href={uberUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white hover:bg-gray-800 transition-colors shadow-2xs"
                  >
                    <span>🚕</span>
                    <span>Uber</span>
                  </a>

                  <Link
                    href={`/listing/${place.slug}`}
                    className="rounded-full bg-[#e26a4f] px-3 py-1 text-[10px] font-bold text-white hover:bg-[#d8583c] transition-colors shadow-xs"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function InteractiveLeafletCanvas({
  locatedListings,
  activePlaceId,
  setActivePlaceId,
  userLocation,
  setUserLocation,
  onLocateMe,
  flyToUserTrigger = 0,
  onToggleFullscreen,
  isFullscreen = false,
  initialPerspective = "street",
  onMapClick,
}: {
  locatedListings: (PlaceListing & { latitude: number; longitude: number })[];
  activePlaceId: string | null;
  setActivePlaceId: (id: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  setUserLocation?: (loc: { lat: number; lng: number }) => void;
  onLocateMe?: () => void;
  flyToUserTrigger?: number;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  initialPerspective?: "street" | "satellite";
  onMapClick?: (loc: { lat: number; lng: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);
  const [internalUserLocation, setInternalUserLocation] = useState<{ lat: number; lng: number } | null>(
    userLocation ?? null
  );

  const [mapStyle, setMapStyle] = useState<"street" | "satellite">(
    initialPerspective === "satellite" ? "satellite" : "street"
  );

  const activePlace = useMemo(
    () => (activePlaceId ? locatedListings.find((p) => p.id === activePlaceId) ?? null : null),
    [activePlaceId, locatedListings]
  );

  const effectiveLocation = userLocation ?? internalUserLocation;

  const initialCenter: [number, number] = effectiveLocation
    ? [effectiveLocation.lat, effectiveLocation.lng]
    : locatedListings.length
    ? [locatedListings[0].latitude, locatedListings[0].longitude]
    : [20.0, 0.0];

  const currentTiles = MAP_LAYERS[mapStyle];

  const handleRegisterZoomFunctions = useCallback((zoomIn: () => void, zoomOut: () => void) => {
    zoomInRef.current = zoomIn;
    zoomOutRef.current = zoomOut;
  }, []);

  const handleLocationFound = useCallback(
    (loc: { lat: number; lng: number }) => {
      setInternalUserLocation(loc);
      if (setUserLocation) setUserLocation(loc);
    },
    [setUserLocation]
  );

  const handleTriggerLocate = () => {
    if (onLocateMe) {
      onLocateMe();
    } else if (typeof window !== "undefined" && (window as any).__locatogo_locate_me) {
      (window as any).__locatogo_locate_me();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-gray-900 select-none"
    >
      <MapContainer
        center={initialCenter}
        zoom={locatedListings.length ? 13 : 2}
        scrollWheelZoom={false}
        doubleClickZoom={true}
        className="h-full w-full z-0 cursor-crosshair"
      >
        <TileLayer attribution={currentTiles.attribution} url={currentTiles.url} />
        <StrictSingleStepWheelZoom onZoomChange={handleRegisterZoomFunctions} />
        <LocationController onLocationFound={handleLocationFound} />
        <MapClickHandler onMapClick={onMapClick} />
        <MapUpdater
          located={locatedListings}
          activePlace={activePlace}
          userLocation={effectiveLocation}
          flyToUserTrigger={flyToUserTrigger}
        />

        {/* User Location Radar Marker */}
        {effectiveLocation && (
          <Marker position={[effectiveLocation.lat, effectiveLocation.lng]} icon={userLocationIcon}>
            <Popup className="locatogo-popup">
              <div className="p-2 text-center font-sans">
                <span className="font-bold text-xs text-blue-700">📍 You Are Here</span>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Showing distances & nearby places
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Clustered & Rich Pill Place Markers */}
        <ClusteredMarkersLayer
          locatedListings={locatedListings}
          activePlaceId={activePlaceId}
          setActivePlaceId={setActivePlaceId}
          userLocation={effectiveLocation}
        />
      </MapContainer>

      {/* Top Floating Map Layer & Zoom Switcher */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-1.5 rounded-2xl bg-white/95 backdrop-blur-md p-1 border border-gray-200/90 shadow-xl text-xs font-semibold">
        <button
          onClick={() => setMapStyle("street")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            mapStyle === "street"
              ? "bg-gray-950 text-white font-bold shadow-xs"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span>🗺️</span>
          <span>Street</span>
        </button>

        <button
          onClick={() => setMapStyle("satellite")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            mapStyle === "satellite"
              ? "bg-[#e26a4f] text-white font-bold shadow-xs"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span>🛰️</span>
          <span>Satellite</span>
        </button>

        {/* Explicit 1-Step Click Zoom Buttons */}
        <div className="flex items-center border-l border-gray-200 pl-1.5 gap-1">
          <button
            onClick={() => zoomInRef.current?.()}
            title="Zoom In (1 Step)"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-900 font-bold text-sm hover:bg-gray-200 transition-colors cursor-pointer"
          >
            +
          </button>
          <button
            onClick={() => zoomOutRef.current?.()}
            title="Zoom Out (1 Step)"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-900 font-bold text-sm hover:bg-gray-200 transition-colors cursor-pointer"
          >
            −
          </button>
        </div>

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Full Screen Map" : "Full Screen Map"}
            className="border-l border-gray-200 pl-2 pr-1 text-gray-600 hover:text-gray-950 text-xs font-bold cursor-pointer"
          >
            {isFullscreen ? "✕" : "⛶"}
          </button>
        )}
      </div>

      {/* Floating Action Controls on Map (Bottom-Right) */}
      <div className="absolute bottom-5 right-5 z-[400] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={handleTriggerLocate}
          title="Auto-detect & Center on My Location"
          className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-3.5 py-2 text-xs font-bold text-gray-800 shadow-lg backdrop-blur-md hover:bg-gray-50 transition-all cursor-pointer"
        >
          <span className="text-sm">🎯</span>
          <span className="hidden sm:inline">My Location</span>
        </button>

        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3.5 py-2 text-xs font-semibold text-gray-800 shadow-lg backdrop-blur-md">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e26a4f] animate-pulse" />
          <span>
            {locatedListings.length} {locatedListings.length === 1 ? "place" : "places"}
          </span>
        </div>
      </div>
    </div>
  );
}
