"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { MapContainer, Marker, Popup, Tooltip, TileLayer, useMap, useMapEvents } from "react-leaflet";
import Supercluster from "supercluster";
import type { PlaceListing } from "@/components/modern-directory-explorer";
import { generateUberRideLink } from "@/lib/services/transit-links";
import { WeatherAtmosphereOverlay } from "@/components/weather-atmosphere-overlay";
import { getPlaceRating } from "@/lib/services/place-rating";
import type { WeatherType } from "@/lib/services/weather";

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

import { getCompanyLogoUrl, getCompanyInitials } from "@/components/company-brand-avatar";

function getCategoryPinIcon(place: PlaceListing, isSelected: boolean) {
  const cat = (place.category_name || "").toLowerCase();

  let themeColor = "#6366f1";
  let bgLight = "#eef2ff";

  if (cat.includes("hospital") || cat.includes("health") || cat.includes("clinic") || cat.includes("medical") || cat.includes("care")) {
    themeColor = "#dc2626";
    bgLight = "#fef2f2";
  } else if (cat.includes("school") || cat.includes("education") || cat.includes("college") || cat.includes("academy") || cat.includes("institute")) {
    themeColor = "#4f46e5";
    bgLight = "#eef2ff";
  } else if (cat.includes("cafe") || cat.includes("restaurant") || cat.includes("food") || cat.includes("dine") || cat.includes("bakery")) {
    themeColor = "#ea580c";
    bgLight = "#fff7ed";
  } else if (cat.includes("retail") || cat.includes("shop") || cat.includes("store") || cat.includes("market") || cat.includes("mall")) {
    themeColor = "#059669";
    bgLight = "#ecfdf5";
  } else if (cat.includes("hotel") || cat.includes("stay") || cat.includes("resort")) {
    themeColor = "#0284c7";
    bgLight = "#f0f9ff";
  } else if (cat.includes("petrol") || cat.includes("fuel") || cat.includes("pump")) {
    themeColor = "#d97706";
    bgLight = "#fffbeb";
  } else if (cat.includes("art") || cat.includes("creative") || cat.includes("culture")) {
    themeColor = "#db2777";
    bgLight = "#fdf2f8";
  }

  const ratingInfo = getPlaceRating(place);
  const logoUrl = getCompanyLogoUrl(place.website, place.title);
  const initials = getCompanyInitials(place.title);

  // Universal high-res brand logo with clean 2-letter monogram fallback
  const innerIconHtml = logoUrl ? `
    <img src="${logoUrl}" alt="${place.title}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';" style="width: 17px; height: 17px; object-fit: contain; border-radius: 4px;" />
    <span style="display: none; font-size: 10px; font-weight: 800; color: ${themeColor}; line-height: 1;">${initials}</span>
  ` : `
    <span style="font-size: 10px; font-weight: 800; color: ${themeColor}; line-height: 1;">${initials}</span>
  `;

  // Wide 180px text pill is rendered ONLY for the actively selected / clicked pin.
  if (isSelected) {
    const shortTitle = place.title.length > 20 ? place.title.slice(0, 18) + "…" : place.title;
    const html = `
      <div class="locatogo-pill-pin is-active" style="--theme-color: ${themeColor};">
        <div class="locatogo-pin-icon-wrap" style="background: white; color: ${themeColor}; padding: 2px;">
          ${innerIconHtml}
        </div>
        <div class="locatogo-pin-label" style="display: flex; align-items: center; gap: 4px;">
          <span class="locatogo-pin-title">${shortTitle}</span>
          <span style="font-size: 10px; font-weight: 800; color: #b45309; background: #fef3c7; border-radius: 4px; padding: 1px 4px; line-height: 1;">★${ratingInfo.rating.toFixed(1)}</span>
        </div>
        <div class="locatogo-pin-arrow"></div>
      </div>
    `;

    return L.divIcon({
      className: "locatogo-pill-wrapper",
      html,
      iconSize: [180, 36],
      iconAnchor: [90, 36],
      popupAnchor: [0, -38],
    });
  }

  const html = `
    <div class="locatogo-teardrop-pin" style="--theme-color: ${themeColor}; background: ${themeColor};">
      <div class="locatogo-teardrop-inner" style="background: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
        ${innerIconHtml}
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
    const fallbackToIp = async () => {
      try {
        const res = await fetch("/api/geolocation");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.latitude && data.longitude) {
            const loc = { lat: data.latitude, lng: data.longitude };
            onLocationFound(loc);
            map.flyTo([loc.lat, loc.lng], 14, { duration: 1.5 });
            return;
          }
        }
      } catch (e) {
        console.warn("Canvas IP fallback error:", e);
      }
    };

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          onLocationFound(loc);
          map.flyTo([loc.lat, loc.lng], 15, { duration: 1.5 });
        },
        (err) => {
          console.warn("Browser GPS permission not granted or unavailable (" + err.message + "), falling back to network IP location...");
          fallbackToIp();
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
      );
    } else {
      fallbackToIp();
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
  searchQuery,
}: {
  located: (PlaceListing & { latitude: number; longitude: number })[];
  activePlace: (PlaceListing & { latitude: number; longitude: number }) | null;
  userLocation: { lat: number; lng: number } | null;
  flyToUserTrigger: number;
  searchQuery?: string;
}) {
  const map = useMap();
  const prevActiveIdRef = useRef<string | null>(null);
  const prevUserLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevSearchRef = useRef<string>("");
  const prevSigRef = useRef<string>("");

  // 1. Explicit locate me button click trigger
  useEffect(() => {
    if (flyToUserTrigger > 0 && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.5 });
    }
  }, [flyToUserTrigger, userLocation, map]);

  // 2. Initial Mount user location fly-to (only on initial load if no search has happened)
  useEffect(() => {
    if (userLocation && !prevUserLocRef.current && !searchQuery) {
      prevUserLocRef.current = userLocation;
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
    } else if (userLocation) {
      prevUserLocRef.current = userLocation;
    }
  }, [userLocation, searchQuery, map]);

  // 3. Active Place Selection (clicking a card or marker popup)
  useEffect(() => {
    if (activePlace && activePlace.id !== prevActiveIdRef.current) {
      prevActiveIdRef.current = activePlace.id;
      map.flyTo([activePlace.latitude, activePlace.longitude], 16, { duration: 1.2 });
    }
  }, [activePlace, map]);

  // 4. Searching or Filtering: when user types in search or filters, move map to matching place(s)
  useEffect(() => {
    const sig = located.map((l) => l.id).slice(0, 15).join(",");
    const trimmedSearch = (searchQuery || "").trim();
    const searchChanged = trimmedSearch !== prevSearchRef.current;
    const sigChanged = sig !== prevSigRef.current && prevSigRef.current !== "";

    prevSearchRef.current = trimmedSearch;
    prevSigRef.current = sig;

    if (activePlace) return;

    if (located.length > 0 && (searchChanged || (trimmedSearch && sigChanged))) {
      if (located.length === 1) {
        map.flyTo([located[0].latitude, located[0].longitude], 15, { duration: 1.2 });
      } else {
        const bounds = L.latLngBounds(located.map((l) => [l.latitude, l.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [located, activePlace, searchQuery, map]);

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
      radius: 50,
      maxZoom: 16,
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
                    supercluster.getClusterExpansionZoom(cluster.id as number) || 17
                  );
                  map.flyTo([latitude, longitude], targetZoom, { duration: 0.6 });
                },
              }}
            />
          );
        }

        const place = cluster.properties as PlaceListing & { latitude: number; longitude: number };
        const isSelected = activePlaceId === place.id;
        const icon = getCategoryPinIcon(place, isSelected);
        const ratingInfo = getPlaceRating(place);

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
            {!isSelected && (
              <Tooltip direction="top" offset={[0, -28]} opacity={1} className="locatogo-hover-tooltip">
                <div className="flex items-center gap-1.5 px-1 py-0.5 font-sans">
                  <span className="font-bold text-xs text-gray-900">{place.title}</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60">
                    ★{ratingInfo.rating.toFixed(1)}
                  </span>
                </div>
              </Tooltip>
            )}
            <Popup className="locatogo-popup">
              <div className="p-3 max-w-[250px] font-sans">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1">
                    {place.category_name && (
                      <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-900">
                        {place.category_name}
                      </span>
                    )}
                    <span className="rounded-md bg-amber-50 border border-amber-200/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 flex items-center gap-0.5">
                      <span className="text-amber-500">★</span>
                      <span>{ratingInfo.rating.toFixed(1)}</span>
                    </span>
                  </div>

                  {(() => {
                    const dist = typeof place.distanceKm === "number"
                      ? place.distanceKm
                      : (userLocation
                        ? calculateDistanceKm(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                        : null);
                    if (dist === null) return null;
                    return (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md">
                        🚗 {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`}
                      </span>
                    );
                  })()}
                </div>

                <h4 className="font-serif font-bold text-sm text-gray-950 leading-tight">
                  <Link href={`/listing/${place.slug}`} className="hover:text-[#e26a4f] transition-colors">
                    {place.title}
                  </Link>
                </h4>

                {/* Rating Breakdown Banner */}
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  <span className="text-amber-500 text-xs tracking-tight">{ratingInfo.starsText}</span>
                  <span className="text-[11px] font-bold text-gray-800">{ratingInfo.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-500 font-medium">({ratingInfo.reviewCount} reviews)</span>
                </div>

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
                    className="btn-uber flex items-center gap-1 rounded-full !bg-black px-3 py-1.5 text-[11px] font-bold !text-white hover:!bg-gray-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>🚕</span>
                    <span className="!text-white font-bold">Uber</span>
                  </a>

                  <Link
                    href={`/listing/${place.slug}`}
                    className="btn-details flex items-center gap-1 rounded-full !bg-[#e26a4f] px-3.5 py-1.5 text-[11px] font-bold !text-white hover:!bg-[#d8583c] transition-colors shadow-xs cursor-pointer"
                  >
                    <span className="!text-white font-bold">Details</span>
                    <span className="!text-white font-bold">→</span>
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
  weatherType = null,
  showWeatherOverlay = true,
  onMapClick,
  searchQuery,
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
  weatherType?: WeatherType | null;
  showWeatherOverlay?: boolean;
  onMapClick?: (loc: { lat: number; lng: number }) => void;
  searchQuery?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);
  const [activeWeatherFx, setActiveWeatherFx] = useState<WeatherType | null>(weatherType ?? null);
  const [isFxEnabled, setIsFxEnabled] = useState(showWeatherOverlay);

  useEffect(() => {
    if (weatherType !== undefined) {
      setActiveWeatherFx(weatherType);
    }
  }, [weatherType]);
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
        zoomControl={false}
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
          searchQuery={searchQuery}
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

      {/* Atmospheric Animated Weather Layer (e.g. Rain, Storm, Sun shimmer) */}
      {isFxEnabled && activeWeatherFx && (
        <WeatherAtmosphereOverlay weatherType={activeWeatherFx} />
      )}

      {/* Top Floating Map Layer & Zoom Switcher */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[400] flex items-center gap-0.5 sm:gap-1.5 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-md p-0.5 sm:p-1 border border-gray-200/90 shadow-md text-[10px] sm:text-xs font-semibold">
        {/* Quick Weather FX Cycle / Toggle */}
        <button
          onClick={() => {
            if (!activeWeatherFx || activeWeatherFx === "clear") {
              setActiveWeatherFx("rain");
              setIsFxEnabled(true);
            } else if (activeWeatherFx === "rain") {
              setActiveWeatherFx("thunderstorm");
            } else {
              setActiveWeatherFx("clear");
            }
          }}
          title={`Weather Effects: ${activeWeatherFx || "Auto"} (Click to cycle Rain/Storm/Sun)`}
          className={`flex items-center gap-1 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
            activeWeatherFx === "rain" || activeWeatherFx === "thunderstorm"
              ? "bg-blue-600 text-white font-bold shadow-xs animate-pulse"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span>{activeWeatherFx === "thunderstorm" ? "⚡" : activeWeatherFx === "rain" ? "🌧️" : "🌦️"}</span>
          <span className="hidden md:inline">
            {activeWeatherFx === "thunderstorm" ? "Storm FX" : activeWeatherFx === "rain" ? "Rain FX" : "Weather"}
          </span>
        </button>

        <button
          onClick={() => setMapStyle("street")}
          className={`flex items-center gap-1 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
            mapStyle === "street"
              ? "bg-gray-950 text-white font-bold shadow-xs"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span>🗺️</span>
          <span className="hidden sm:inline">Street</span>
        </button>

        <button
          onClick={() => setMapStyle("satellite")}
          className={`flex items-center gap-1 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
            mapStyle === "satellite"
              ? "bg-[#e26a4f] text-white font-bold shadow-xs"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span>🛰️</span>
          <span className="hidden sm:inline">Satellite</span>
        </button>

        {/* Explicit 1-Step Click Zoom Buttons */}
        <div className="flex items-center border-l border-gray-200 pl-0.5 sm:pl-1.5 gap-0.5">
          <button
            onClick={() => zoomInRef.current?.()}
            title="Zoom In (1 Step)"
            className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg bg-gray-100 text-gray-900 font-bold text-xs sm:text-sm hover:bg-gray-200 transition-colors cursor-pointer"
          >
            +
          </button>
          <button
            onClick={() => zoomOutRef.current?.()}
            title="Zoom Out (1 Step)"
            className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg bg-gray-100 text-gray-900 font-bold text-xs sm:text-sm hover:bg-gray-200 transition-colors cursor-pointer"
          >
            −
          </button>
        </div>

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Full Screen Map" : "Full Screen Map"}
            className="border-l border-gray-200 pl-1.5 pr-1 text-gray-600 hover:text-gray-950 text-[10px] sm:text-xs font-bold cursor-pointer"
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
      </div>
    </div>
  );
}
