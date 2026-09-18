"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { MapContainer, Marker, Popup, Tooltip, TileLayer, Circle, useMap, useMapEvents } from "react-leaflet";
import Supercluster from "supercluster";
import type { PlaceListing } from "@/components/modern-directory-explorer";
import { generateUberRideLink } from "@/lib/services/transit-links";
import { WeatherAtmosphereOverlay } from "@/components/weather-atmosphere-overlay";
import { getPlaceRating } from "@/lib/services/place-rating";
import type { WeatherType } from "@/lib/services/weather";

// Safeguard Leaflet 1.9.4 bug where unbindTooltip leaves active focus events on DOM elements,
// causing "Cannot set properties of null (setting '_source')" when marker is clicked or focused.
if (typeof window !== "undefined" && L && L.Layer) {
  const LayerProto = L.Layer.prototype as any;
  if (LayerProto && !LayerProto.__mapora_source_safeguard) {
    LayerProto.__mapora_source_safeguard = true;

    // 1. Guard _addFocusListenersOnLayer against null this._tooltip
    LayerProto._addFocusListenersOnLayer = function (layer: any) {
      const el = typeof layer.getElement === "function" && layer.getElement();
      if (el) {
        L.DomEvent.on(
          el,
          "focus",
          function (this: any) {
            if (!this._tooltip) return;
            this._tooltip._source = layer;
            this.openTooltip();
          },
          this
        );
        L.DomEvent.on(
          el,
          "blur",
          function (this: any) {
            if (!this._tooltip) return;
            this.closeTooltip();
          },
          this
        );
      }
    };

    // 2. Guard openTooltip against null this._tooltip
    const origOpenTooltip = LayerProto.openTooltip;
    LayerProto.openTooltip = function (this: any, latlng: any) {
      if (!this._tooltip) return this;
      return origOpenTooltip.call(this, latlng);
    };

    // 3. Guard _openTooltip against null this._tooltip
    const origOpenTooltipEvent = LayerProto._openTooltip;
    LayerProto._openTooltip = function (this: any, e: any) {
      if (!this._tooltip || !this._map) return;
      return origOpenTooltipEvent.call(this, e);
    };

    // 4. Guard openPopup against null this._popup
    const origOpenPopup = LayerProto.openPopup;
    LayerProto.openPopup = function (this: any, latlng: any) {
      if (!this._popup) return this;
      return origOpenPopup.call(this, latlng);
    };

    // 5. Guard _openPopup against null this._popup
    const origOpenPopupEvent = LayerProto._openPopup;
    LayerProto._openPopup = function (this: any, e: any) {
      if (!this._popup || !this._map) return;
      return origOpenPopupEvent.call(this, e);
    };
  }
}

export type MapStyleId = "clean_light" | "cyber_dark" | "satellite" | "classic_osm" | "topo";

export const MAP_LAYERS: Record<
  MapStyleId,
  {
    id: MapStyleId;
    label: string;
    icon: string;
    description: string;
    url: string;
    attribution: string;
    subdomains?: string;
    maxZoom: number;
    className?: string;
  }
> = {
  clean_light: {
    id: "clean_light",
    label: "Clean Light",
    icon: "☀️",
    description: "Crisp vector-grade street layout",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, DeLorme, NAVTEQ",
    maxZoom: 19,
  },
  cyber_dark: {
    id: "cyber_dark",
    label: "Cyber Dark",
    icon: "🌙",
    description: "High-contrast midnight theme",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, DeLorme, NAVTEQ",
    maxZoom: 19,
    className: "leaflet-dark-tiles",
  },
  satellite: {
    id: "satellite",
    label: "Satellite",
    icon: "🛰️",
    description: "Esri high-resolution aerial imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  classic_osm: {
    id: "classic_osm",
    label: "Classic OSM",
    icon: "🗺️",
    description: "OpenStreetMap Humanitarian edition",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abc",
    maxZoom: 19,
  },
  topo: {
    id: "topo",
    label: "Topographic",
    icon: "⛰️",
    description: "Elevation contours & geographic relief",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, USGS, NOAA",
    maxZoom: 19,
  },
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    return 0;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(Math.max(0, 1 - clampedA)));
  const dist = R * c;
  return Number.isFinite(dist) ? dist : 0;
}

import { getCompanyLogoUrl, getCompanyInitials, getCompanyCategoryIcon } from "@/components/company-brand-avatar";

const pinIconCache = new Map<string, L.DivIcon>();

function getCategoryPinIcon(place: PlaceListing, isSelected: boolean, isTechAtlas = false): L.DivIcon {
  const cacheKey = `${place.id}_${isSelected ? "sel" : "unsel"}_${isTechAtlas ? "tech" : "gen"}_${place.website || ""}`;
  const cached = pinIconCache.get(cacheKey);
  if (cached) return cached;

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
  const techIcon = getCompanyCategoryIcon(place.title);

  const isTechPlace = Boolean(
    isTechAtlas ||
    (place.category_name &&
      (cat.includes("tech") ||
        cat.includes("product") ||
        cat.includes("saas") ||
        cat.includes("ai") ||
        cat.includes("software") ||
        cat.includes("it") ||
        cat.includes("services") ||
        cat.includes("consulting") ||
        cat.includes("fintech") ||
        cat.includes("giant") ||
        cat.includes("startup")))
  );
  const isHiring = Boolean(place.is_featured);

  // Universal high-res brand logo with rich domain tech icon fallback
  const innerIconHtml = logoUrl ? `
    <img src="${logoUrl}" alt="${place.title}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" style="width: 17px; height: 17px; object-fit: contain; border-radius: 4px;" />
    <span style="display: none; font-size: 11px; line-height: 1; align-items: center; justify-content: center;">${techIcon}</span>
  ` : `
    <span style="font-size: 11px; line-height: 1; display: flex; align-items: center; justify-content: center;">${techIcon}</span>
  `;

  // Active / Selected state: solid black or indigo pill with full title
  if (isSelected) {
    const shortTitle = place.title.length > 20 ? place.title.slice(0, 18) + "…" : place.title;
    const badgeHtml = isTechPlace && isHiring
      ? `<span style="font-size: 9px; font-weight: 800; color: #047857; background: #d1fae5; border-radius: 4px; padding: 1.5px 4px; line-height: 1;">HIRING</span>`
      : `<span style="font-size: 10px; font-weight: 800; color: #b45309; background: #fef3c7; border-radius: 4px; padding: 1px 4px; line-height: 1;">★${ratingInfo.rating.toFixed(1)}</span>`;

    const html = `
      <div class="locatogo-pill-pin is-active" style="--theme-color: ${themeColor};">
        <div class="locatogo-pin-icon-wrap" style="background: white; color: ${themeColor}; padding: 2px;">
          ${innerIconHtml}
        </div>
        <div class="locatogo-pin-label" style="display: flex; align-items: center; gap: 4px;">
          <span class="locatogo-pin-title">${shortTitle}</span>
          ${badgeHtml}
        </div>
        <div class="locatogo-pin-arrow"></div>
      </div>
    `;

    const icon = L.divIcon({
      className: "locatogo-pill-wrapper is-active",
      html,
      iconSize: [190, 36],
      iconAnchor: [95, 36],
      popupAnchor: [0, -38],
    });
    if (pinIconCache.size < 5000) pinIconCache.set(cacheKey, icon);
    return icon;
  }

  // Normal Pill Pin: Tech company title + hiring indicator or place star rating
  if (isTechPlace) {
    const cleanTitle = place.title.length > 15 ? place.title.slice(0, 14) + "…" : place.title;
    const html = `
      <div class="locatogo-pill-pin" style="--theme-color: #4f46e5; max-width: 145px; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px 3px 5px;">
        <div class="locatogo-pin-icon-wrap" style="background: #eef2ff; color: #4f46e5; padding: 1px;">
          ${innerIconHtml}
        </div>
        <span class="locatogo-pin-title" style="font-size: 11px; font-weight: 700; color: #0f172a; line-height: 1;">${cleanTitle}</span>
        ${isHiring ? `<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981; flex-shrink: 0;" title="Actively Hiring"></span>` : ""}
        <div class="locatogo-pin-arrow"></div>
      </div>
    `;

    const icon = L.divIcon({
      className: "locatogo-pill-wrapper",
      html,
      iconSize: [130, 32],
      iconAnchor: [65, 32],
      popupAnchor: [0, -34],
    });
    if (pinIconCache.size < 5000) pinIconCache.set(cacheKey, icon);
    return icon;
  }

  // Fallback Normal Airbnb-style Pill Pin for non-tech places
  const html = `
    <div class="locatogo-pill-pin" style="--theme-color: ${themeColor};">
      <div class="locatogo-pin-icon-wrap" style="background: ${bgLight}; color: ${themeColor}; padding: 1px;">
        ${innerIconHtml}
      </div>
      <span style="font-size: 11px; font-weight: 800; color: #0f172a; line-height: 1;">★${ratingInfo.rating.toFixed(1)}</span>
      <div class="locatogo-pin-arrow"></div>
    </div>
  `;

  const icon = L.divIcon({
    className: "locatogo-pill-wrapper",
    html,
    iconSize: [68, 30],
    iconAnchor: [34, 30],
    popupAnchor: [0, -32],
  });
  if (pinIconCache.size < 5000) pinIconCache.set(cacheKey, icon);
  return icon;
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

      resetTimer = setTimeout(() => {
        if (!isAnimating && Math.abs(accumulatedDelta) >= 30) {
          isAnimating = true;
          if (accumulatedDelta > 0) {
            map.zoomOut(1, { animate: true });
          } else {
            map.zoomIn(1, { animate: true });
          }
          setTimeout(() => {
            isAnimating = false;
            accumulatedDelta = 0;
          }, 250);
        } else {
          accumulatedDelta = 0;
        }
      }, 30);
    };

    const container = map.getContainer();
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [map]);

  return null;
}

function AutoInvalidateSize() {
  const map = useMap();

  useEffect(() => {
    // 1. Staggered invalidations to handle initial flex layout paint
    const t1 = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 60);
    const t2 = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 250);
    const t3 = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 600);

    // 2. ResizeObserver to dynamically invalidate when sidebar collapses or flex changes
    let ro: ResizeObserver | null = null;
    try {
      const container = map.getContainer();
      if (typeof ResizeObserver !== "undefined" && container) {
        ro = new ResizeObserver(() => {
          try { map.invalidateSize(); } catch {}
        });
        ro.observe(container);
      }
    } catch {}

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (ro) ro.disconnect();
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

export type MapViewportBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

function MapBoundsController({
  onUserMoved,
}: {
  onUserMoved: (bounds: MapViewportBounds) => void;
}) {
  const map = useMap();
  useMapEvents({
    dragend: () => {
      const b = map.getBounds();
      onUserMoved({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    },
    zoomend: () => {
      const b = map.getBounds();
      onUserMoved({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
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
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const loc = { lat: data.latitude, lng: data.longitude };
            onLocationFound(loc);
            map.flyTo([loc.lat, loc.lng], 14, { duration: 1.5 });
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
  hubCenter,
  flyToUserTrigger,
  searchQuery,
  isTechAtlas,
}: {
  located: (PlaceListing & { latitude: number; longitude: number })[];
  activePlace: (PlaceListing & { latitude: number; longitude: number }) | null;
  userLocation: { lat: number; lng: number } | null;
  hubCenter?: { lat: number; lng: number; zoom?: number } | null;
  flyToUserTrigger: number;
  searchQuery?: string;
  isTechAtlas?: boolean;
}) {
  const map = useMap();
  const prevActiveIdRef = useRef<string | null>(null);
  const prevUserLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevSearchRef = useRef<string>("");
  const prevSigRef = useRef<string>("");
  const prevHubRef = useRef<string | null>(null);

  // 0. Tech Hub change -> smooth flyTo new hub center
  useEffect(() => {
    if (hubCenter) {
      const hubKey = `${hubCenter.lat.toFixed(4)},${hubCenter.lng.toFixed(4)}`;
      if (prevHubRef.current !== hubKey) {
        prevHubRef.current = hubKey;
        map.flyTo([hubCenter.lat, hubCenter.lng], hubCenter.zoom ?? 12, { duration: 1.2 });
      }
    }
  }, [hubCenter, map]);

  // 1. Explicit locate me button click trigger -> fly to user at 5km radius view (zoom 14)
  useEffect(() => {
    if (flyToUserTrigger > 0 && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
    }
  }, [flyToUserTrigger, userLocation, map]);

  // 2. Initial Mount user location fly-to -> only when not browsing a specific tech hub
  useEffect(() => {
    if (userLocation && !prevUserLocRef.current && !searchQuery && !hubCenter && !isTechAtlas) {
      prevUserLocRef.current = userLocation;
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.0 });
    } else if (userLocation) {
      prevUserLocRef.current = userLocation;
    }
  }, [userLocation, searchQuery, hubCenter, isTechAtlas, map]);

  // 3. Active Place Selection (clicking a card or marker popup)
  useEffect(() => {
    if (activePlace && activePlace.id !== prevActiveIdRef.current) {
      prevActiveIdRef.current = activePlace.id;
      map.flyTo([activePlace.latitude, activePlace.longitude], 16, { duration: 0.5 });
    }
  }, [activePlace, map]);

  // 4. Searching: Only trigger fitBounds when user explicitly enters a search query
  // (Prevents background listing streaming from overriding user zoom or 5km initial view)
  useEffect(() => {
    if (!located.length) return;

    const currentSearch = (searchQuery || "").trim().toLowerCase();
    const isSearchChanged = currentSearch !== prevSearchRef.current;

    if (isSearchChanged && currentSearch.length > 0) {
      prevSearchRef.current = currentSearch;

      if (located.length === 1) {
        const item = located[0];
        map.flyTo([item.latitude, item.longitude], 16, { duration: 0.8 });
      } else if (located.length > 1) {
        try {
          const lats = located.map((l) => l.latitude);
          const lngs = located.map((l) => l.longitude);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          const latDiff = maxLat - minLat;
          const lngDiff = maxLng - minLng;

          if (latDiff > 0.0001 || lngDiff > 0.0001) {
            map.fitBounds(
              [
                [minLat, minLng],
                [maxLat, maxLng],
              ],
              {
                padding: [50, 50],
                maxZoom: 15,
                duration: 0.8,
              }
            );
          }
        } catch (err) {
          console.warn("Could not auto-fit bounds on search:", err);
        }
      }
    } else if (isSearchChanged) {
      prevSearchRef.current = currentSearch;
    }
  }, [located, searchQuery, map]);

  return null;
}

function ClusteredMarkersLayer({
  locatedListings,
  activePlaceId,
  setActivePlaceId,
  userLocation,
  isTechAtlas = false,
}: {
  locatedListings: (PlaceListing & { latitude: number; longitude: number })[];
  activePlaceId: string | null;
  setActivePlaceId: (id: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  isTechAtlas?: boolean;
}) {
  const map = useMap();
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState<number>(map.getZoom());
  const rafRef = useRef<number | null>(null);

  const updateBounds = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      try {
        const b = map.getBounds();
        setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        setZoom(map.getZoom());
      } catch {}
    });
  }, [map]);

  useMapEvents({
    moveend: updateBounds,
    zoomend: updateBounds,
  });

  useEffect(() => {
    updateBounds();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateBounds]);

  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 55,
      maxZoom: 16,
      minPoints: 2,
    });

    const validPoints: Array<GeoJSON.Feature<GeoJSON.Point, PlaceListing & { latitude: number; longitude: number }>> =
      locatedListings
        .filter((listing) => {
          const lat = Number(listing?.latitude);
          const lng = Number(listing?.longitude);
          return (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
          );
        })
        .map((listing) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [Number(listing.longitude), Number(listing.latitude)],
          },
          properties: {
            id: listing.id,
            title: listing.title,
            slug: listing.slug,
            short_description: listing.short_description ?? null,
            city: listing.city ?? null,
            category_name: listing.category_name ?? null,
            website: listing.website ?? null,
            is_featured: listing.is_featured === true,
            latitude: Number(listing.latitude),
            longitude: Number(listing.longitude),
          },
        }));

    try {
      sc.load(validPoints);
    } catch (err) {
      console.warn("Supercluster indexing warning:", err);
    }
    return sc;
  }, [locatedListings]);

  const clusters = useMemo(() => {
    if (!bounds || !Number.isFinite(zoom)) return [];
    try {
      const clampedZoom = Math.max(0, Math.min(18, Math.floor(zoom)));
      return supercluster.getClusters(bounds, clampedZoom);
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
        const icon = getCategoryPinIcon(place, isSelected, isTechAtlas);
        const ratingInfo = getPlaceRating(place);

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
                  {isTechAtlas || place.is_featured ? (
                    place.is_featured ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">
                        🟢 Hiring
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200/60">
                        {place.category_name || "Tech"}
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60">
                      ★{ratingInfo.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </Tooltip>
            )}

            {/* Render Rich Interactive Popup ONLY on the actively selected pin */}
            {isSelected && (
              <Popup className="locatogo-popup" autoPan={false}>
                <div className="p-3 max-w-[260px] font-sans">
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
                      href={generateUberRideLink(place.latitude, place.longitude, place.title, place.locality)}
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
            )}
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
  hubCenter = null,
  isTechAtlas = false,
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
  radiusKm = null,
  onSearchArea,
  searchAsMapMoves = false,
}: {
  locatedListings: (PlaceListing & { latitude: number; longitude: number })[];
  activePlaceId: string | null;
  setActivePlaceId: (id: string | null) => void;
  hubCenter?: { lat: number; lng: number; zoom?: number } | null;
  isTechAtlas?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  setUserLocation?: (loc: { lat: number; lng: number }) => void;
  onLocateMe?: () => void;
  flyToUserTrigger?: number;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  initialPerspective?: MapStyleId | "street" | "satellite";
  weatherType?: WeatherType | null;
  showWeatherOverlay?: boolean;
  onMapClick?: (loc: { lat: number; lng: number }) => void;
  searchQuery?: string;
  radiusKm?: number | null;
  onSearchArea?: (bounds: MapViewportBounds) => void;
  searchAsMapMoves?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const [activeWeatherFx, setActiveWeatherFx] = useState<WeatherType | null>(weatherType ?? null);
  const [isFxEnabled, setIsFxEnabled] = useState(showWeatherOverlay);
  const [userPannedBounds, setUserPannedBounds] = useState<MapViewportBounds | null>(null);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);

  const handleUserMoved = useCallback(
    (bounds: MapViewportBounds) => {
      if (searchAsMapMoves && onSearchArea) {
        onSearchArea(bounds);
      } else {
        setUserPannedBounds(bounds);
      }
    },
    [searchAsMapMoves, onSearchArea]
  );

  useEffect(() => {
    if (weatherType !== undefined) {
      setActiveWeatherFx(weatherType);
    }
  }, [weatherType]);
  const [internalUserLocation, setInternalUserLocation] = useState<{ lat: number; lng: number } | null>(
    userLocation ?? null
  );

  const [mapStyle, setMapStyle] = useState<MapStyleId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locatogo_map_style") as MapStyleId | null;
      if (saved && MAP_LAYERS[saved]) return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "cyber_dark";
      }
    }
    if (initialPerspective === "satellite") return "satellite";
    if (initialPerspective && (initialPerspective as string) in MAP_LAYERS) return initialPerspective as MapStyleId;
    return "clean_light";
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setIsStyleMenuOpen(false);
      }
    };
    if (isStyleMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStyleMenuOpen]);

  const handleSelectStyle = (styleId: MapStyleId) => {
    setMapStyle(styleId);
    setIsStyleMenuOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("locatogo_map_style", styleId);
    }
  };

  const activePlace = useMemo(
    () => (activePlaceId ? locatedListings.find((p) => p.id === activePlaceId) ?? null : null),
    [activePlaceId, locatedListings]
  );

  const effectiveLocation = userLocation ?? internalUserLocation;

  const initialCenter: [number, number] = hubCenter
    ? [hubCenter.lat, hubCenter.lng]
    : effectiveLocation
    ? [effectiveLocation.lat, effectiveLocation.lng]
    : locatedListings.length
    ? [locatedListings[0].latitude, locatedListings[0].longitude]
    : [20.0, 0.0];

  const initialZoom = hubCenter?.zoom ?? (locatedListings.length ? 13 : 2);

  const currentTiles = MAP_LAYERS[mapStyle] || MAP_LAYERS.clean_light;

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
        zoom={initialZoom}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={true}
        className="h-full w-full z-0 cursor-crosshair"
      >
        <TileLayer
          key={`tiles-${mapStyle}`}
          attribution={currentTiles.attribution}
          url={currentTiles.url}
          className={currentTiles.className}
          subdomains={currentTiles.subdomains || "abc"}
          maxZoom={currentTiles.maxZoom || 19}
        />
        <AutoInvalidateSize />
        <StrictSingleStepWheelZoom onZoomChange={handleRegisterZoomFunctions} />
        <LocationController onLocationFound={handleLocationFound} />
        <MapClickHandler onMapClick={onMapClick} />
        <MapUpdater
          located={locatedListings}
          activePlace={activePlace}
          userLocation={effectiveLocation}
          hubCenter={hubCenter}
          flyToUserTrigger={flyToUserTrigger}
          searchQuery={searchQuery}
          isTechAtlas={isTechAtlas}
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

        {/* Active Radius Circle around User Location */}
        {effectiveLocation && typeof radiusKm === "number" && radiusKm > 0 && (
          <Circle
            center={[effectiveLocation.lat, effectiveLocation.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#4f46e5",
              fillColor: "#6366f1",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "6, 6",
            }}
          />
        )}

        {/* Clustered & Rich Pill Place Markers */}
        <ClusteredMarkersLayer
          locatedListings={locatedListings}
          activePlaceId={activePlaceId}
          setActivePlaceId={setActivePlaceId}
          userLocation={effectiveLocation}
          isTechAtlas={isTechAtlas}
        />
        <MapBoundsController onUserMoved={handleUserMoved} />
      </MapContainer>

      {/* Floating Airbnb-Style "Search this area" Button */}
      {userPannedBounds && (
        <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[400] animate-in fade-in slide-in-from-top-3 duration-200">
          <button
            type="button"
            onClick={() => {
              if (onSearchArea && userPannedBounds) {
                onSearchArea(userPannedBounds);
              }
              setUserPannedBounds(null);
            }}
            className="flex items-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
          >
            <span className="text-[#e26a4f] text-sm font-bold">🔄</span>
            <span>Search this area</span>
          </button>
        </div>
      )}

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

        {/* Modern Map Style Switcher Popover */}
        <div ref={styleMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsStyleMenuOpen((prev) => !prev)}
            title="Change Map Style"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold bg-gray-100 hover:bg-gray-200/80 text-gray-900 transition-all cursor-pointer"
          >
            <span>{currentTiles.icon}</span>
            <span className="hidden sm:inline text-[11px] sm:text-xs font-semibold">{currentTiles.label}</span>
            <span className="text-[9px] text-gray-500">▼</span>
          </button>

          {isStyleMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-[500] animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Map Style
              </div>
              <div className="space-y-1">
                {(Object.values(MAP_LAYERS) as typeof MAP_LAYERS[MapStyleId][]).map((layer) => {
                  const isSelected = mapStyle === layer.id;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => handleSelectStyle(layer.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{layer.icon}</span>
                        <div>
                          <p className="leading-none">{layer.label}</p>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {layer.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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
