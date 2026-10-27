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
import "@/app/map-theme.css";
import { Button, buttonVariants, IconButton } from "@/components/ui";
import {
  ArrowRightIcon,
  CheckIcon,
  CloudRainIcon,
  ExpandIcon,
  LayersIcon,
  LocateIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { useTheme } from "@/lib/utils/use-theme";

// Safeguard Leaflet 1.9.4 bug where unbindTooltip leaves active focus events on DOM elements,
// causing "Cannot set properties of null (setting '_source')" when marker is clicked or focused.
if (typeof window !== "undefined" && L && L.Layer) {
  const LayerProto = L.Layer.prototype as any;
  if (LayerProto && !LayerProto.__locatogo_source_safeguard) {
    LayerProto.__locatogo_source_safeguard = true;

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

export type MapStyleId = "street" | "dark" | "satellite";

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
  street: {
    id: "street",
    label: "Street Map",
    icon: "🗺️",
    description: "Standard OpenStreetMap tiles",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abc",
    maxZoom: 19,
  },
  dark: {
    id: "dark",
    label: "Dark Map",
    icon: "🌙",
    description: "Inverted dark theme",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abc",
    maxZoom: 19,
    className: "leaflet-dark-tiles",
  },
  satellite: {
    id: "satellite",
    label: "Satellite",
    icon: "🛰️",
    description: "High-resolution satellite imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
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

import { getCompanyLogoUrl, isKnownBrand } from "@/components/company-brand-avatar";

const pinIconCache = new Map<string, L.DivIcon>();

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const BUILDING_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 10h3a1 1 0 0 1 1 1v10M3 21h18"/><path d="M9 8h2M9 12h2M9 16h2"/></svg>';
const STAR_SVG =
  '<svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/></svg>';

function pinGlyph(logoUrl: string) {
  if (!logoUrl) return BUILDING_SVG;
  return `<img src="${escapeHtml(logoUrl)}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false" /><span hidden>${BUILDING_SVG}</span>`;
}

function getCategoryPinIcon(place: PlaceListing, isSelected: boolean, isTechAtlas = false, zoom = 14): L.DivIcon {
  const cacheKey = `${place.id}_${isSelected ? "sel" : "unsel"}_${isTechAtlas ? "tech" : "gen"}_${zoom < 14 ? "zOut" : "zIn"}_${place.website || ""}`;
  const cached = pinIconCache.get(cacheKey);
  if (cached) return cached;

  const remember = (icon: L.DivIcon) => {
    if (pinIconCache.size < 5000) pinIconCache.set(cacheKey, icon);
    return icon;
  };

  const cat = (place.category_name || "").toLowerCase();
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
  const glyph = pinGlyph(isKnownBrand(place.title) ? getCompanyLogoUrl(place.website, place.title) : "");
  const id = escapeHtml(place.id);
  // Atlas companies have no rating, so only hiring status is shown for them.
  const ratingTag = () =>
    isTechAtlas ? "" : `<span class="lg-pin__tag">${STAR_SVG} ${getPlaceRating(place).rating.toFixed(1)}</span>`;

  if (isSelected) {
    const shortTitle = escapeHtml(place.title.length > 20 ? `${place.title.slice(0, 18)}…` : place.title);
    const tag = isTechPlace && isHiring ? '<span class="lg-pin__tag">Hiring</span>' : ratingTag();
    return remember(
      L.divIcon({
        className: "lg-marker",
        html: `<div class="lg-pin is-active" data-pin-id="${id}"><span class="lg-pin__icon">${glyph}</span><span class="lg-pin__title">${shortTitle}</span>${tag}<span class="lg-pin__arrow"></span></div>`,
        iconSize: [190, 36],
        iconAnchor: [95, 36],
        popupAnchor: [0, -38],
      })
    );
  }

  // Compact dot for the zoomed-out overview to avoid label collisions
  if (isTechPlace && zoom < 14 && !place.is_featured) {
    return remember(
      L.divIcon({
        className: "lg-marker",
        html: `<div class="lg-dot${isHiring ? " is-hiring" : ""}" data-pin-id="${id}">${glyph}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -15],
      })
    );
  }

  if (isTechPlace) {
    const cleanTitle = escapeHtml(place.title.length > 15 ? `${place.title.slice(0, 14)}…` : place.title);
    return remember(
      L.divIcon({
        className: "lg-marker",
        html: `<div class="lg-pin" data-pin-id="${id}"><span class="lg-pin__icon">${glyph}</span><span class="lg-pin__title">${cleanTitle}</span>${isHiring ? '<span class="lg-pin__dot" title="Actively hiring"></span>' : ""}<span class="lg-pin__arrow"></span></div>`,
        iconSize: [130, 32],
        iconAnchor: [65, 32],
        popupAnchor: [0, -34],
      })
    );
  }

  return remember(
    L.divIcon({
      className: "lg-marker",
      html: `<div class="lg-pin" data-pin-id="${id}"><span class="lg-pin__icon">${glyph}</span>${ratingTag()}<span class="lg-pin__arrow"></span></div>`,
      iconSize: [68, 30],
      iconAnchor: [34, 30],
      popupAnchor: [0, -32],
    })
  );
}

const userLocationIcon = L.divIcon({
  className: "lg-marker",
  html: '<div class="lg-user"><div class="lg-user__pulse"></div><div class="lg-user__dot"></div></div>',
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
      try { map.invalidateSize(); } catch { }
    }, 60);
    const t2 = setTimeout(() => {
      try { map.invalidateSize(); } catch { }
    }, 250);
    const t3 = setTimeout(() => {
      try { map.invalidateSize(); } catch { }
    }, 600);

    // 2. ResizeObserver to dynamically invalidate when sidebar collapses or flex changes
    let ro: ResizeObserver | null = null;
    try {
      const container = map.getContainer();
      if (typeof ResizeObserver !== "undefined" && container) {
        ro = new ResizeObserver(() => {
          try { map.invalidateSize(); } catch { }
        });
        ro.observe(container);
      }
    } catch { }

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
  focusPlace = null,
  userLocation,
  hubCenter,
  hubNavTrigger = 0,
  flyToUserTrigger,
  searchQuery,
  isTechAtlas,
  bottomInset = 0,
}: {
  located: (PlaceListing & { latitude: number; longitude: number })[];
  activePlace: (PlaceListing & { latitude: number; longitude: number }) | null;
  focusPlace?: (PlaceListing & { latitude: number; longitude: number }) | null;
  userLocation: { lat: number; lng: number } | null;
  hubCenter?: { lat: number; lng: number; zoom?: number } | null;
  hubNavTrigger?: number;
  flyToUserTrigger: number;
  searchQuery?: string;
  isTechAtlas?: boolean;
  bottomInset?: number;
}) {
  const map = useMap();
  const prevActiveIdRef = useRef<string | null>(null);
  const prevFocusIdRef = useRef<string | null>(null);
  const prevUserLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevSearchRef = useRef<string>("");
  const prevHubRef = useRef<string | null>(null);
  const prevHubNavTriggerRef = useRef<number>(0);
  const prevFlyTriggerRef = useRef<number>(0);

  // 0. Tech Hub change or explicit city/country navigation -> smooth flyTo new hub center
  useEffect(() => {
    if (hubCenter) {
      const hubKey = `${hubCenter.lat.toFixed(4)},${hubCenter.lng.toFixed(4)}`;
      const hasNavTriggered = hubNavTrigger > 0 && hubNavTrigger !== prevHubNavTriggerRef.current;
      if (hasNavTriggered) {
        prevHubNavTriggerRef.current = hubNavTrigger;
      }
      if (prevHubRef.current !== hubKey || hasNavTriggered) {
        prevHubRef.current = hubKey;
        map.flyTo([hubCenter.lat, hubCenter.lng], hubCenter.zoom ?? 12, { duration: 1.2 });
      }
    }
  }, [hubCenter, hubNavTrigger, map]);

  // 1. User location / locate me trigger -> ONLY fires when flyToUserTrigger explicitly increments
  useEffect(() => {
    if (flyToUserTrigger > prevFlyTriggerRef.current && userLocation) {
      prevFlyTriggerRef.current = flyToUserTrigger;
      prevHubRef.current = null;
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

  // 3. Active Place Selection (clicking a card or marker). The inset keeps the pin clear of a bottom sheet.
  useEffect(() => {
    if (activePlace && activePlace.id !== prevActiveIdRef.current) {
      prevActiveIdRef.current = activePlace.id;
      const target = L.latLng(activePlace.latitude, activePlace.longitude);
      const zoom = 16;
      const center = bottomInset > 0 ? map.unproject(map.project(target, zoom).add([0, bottomInset / 2]), zoom) : target;
      map.flyTo(center, zoom, { duration: 0.6, easeLinearity: 0.2 });
    }
  }, [activePlace, bottomInset, map]);

  // 3b. Hovering a list card glides the map to that company without changing the selection.
  useEffect(() => {
    if (!focusPlace) {
      prevFocusIdRef.current = null;
      return;
    }
    if (focusPlace.id === prevFocusIdRef.current) return;
    prevFocusIdRef.current = focusPlace.id;
    const target = L.latLng(focusPlace.latitude, focusPlace.longitude);
    const zoom = Math.max(map.getZoom(), 15);
    const center = bottomInset > 0 ? map.unproject(map.project(target, zoom).add([0, bottomInset / 2]), zoom) : target;
    map.flyTo(center, zoom, { duration: 0.6, easeLinearity: 0.2 });
  }, [focusPlace, bottomInset, map]);

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
  highlightedPlaceId = null,
  setActivePlaceId,
  onHoverPlace,
  userLocation,
  isTechAtlas = false,
}: {
  locatedListings: (PlaceListing & { latitude: number; longitude: number })[];
  activePlaceId: string | null;
  highlightedPlaceId?: string | null;
  setActivePlaceId: (id: string | null) => void;
  onHoverPlace?: (id: string | null) => void;
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
      } catch { }
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
      radius: 80,
      maxZoom: 15,
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

  // Viewport Capping for 60fps Silk Performance & Clean Map Appearance
  const visibleClusters = useMemo(() => {
    if (!clusters.length) return [];

    const clusterItems: any[] = [];
    const placeItems: any[] = [];

    for (const c of clusters) {
      if ((c.properties as any)?.cluster) {
        clusterItems.push(c);
      } else {
        placeItems.push(c);
      }
    }

    // Sort clusters by pointCount desc (biggest hubs first)
    clusterItems.sort(
      (a, b) => ((b.properties as any)?.point_count || 0) - ((a.properties as any)?.point_count || 0)
    );

    // Sort place items: actively selected first, then featured/hiring, then others
    placeItems.sort((a, b) => {
      const aSelected = a.properties?.id === activePlaceId ? 1 : 0;
      const bSelected = b.properties?.id === activePlaceId ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;
      const aHiring = (a.properties as any)?.is_featured ? 1 : 0;
      const bHiring = (b.properties as any)?.is_featured ? 1 : 0;
      return bHiring - aHiring;
    });

    // At overview zoom (zoom < 14):
    // Display up to 32 key cluster beacons + up to 14 top hiring landmarks
    // Limits DOM nodes to ~45 max, completely eliminating lag and visual clutter
    if (zoom < 14) {
      const topClusters = clusterItems.slice(0, 32);
      const topPlaces = placeItems
        .filter((p) => p.properties?.id === activePlaceId || (p.properties as any)?.is_featured)
        .slice(0, 14);
      return [...topClusters, ...topPlaces];
    }

    // At street zoom (zoom >= 14):
    // Render up to 15 subclusters and up to 45 individual street pins
    return [...clusterItems.slice(0, 15), ...placeItems.slice(0, 45)];
  }, [clusters, activePlaceId, zoom]);

  // Mirror a hovered list card onto its pin with a class toggle, so the marker is not rebuilt.
  useEffect(() => {
    if (!highlightedPlaceId) return;
    const pin = map.getContainer().querySelector<HTMLElement>(`[data-pin-id="${CSS.escape(highlightedPlaceId)}"]`);
    if (!pin) return;
    const marker = pin.closest<HTMLElement>(".leaflet-marker-icon");
    const previousZ = marker?.style.zIndex ?? "";
    pin.classList.add("is-highlighted");
    if (marker) marker.style.zIndex = "2000";
    return () => {
      pin.classList.remove("is-highlighted");
      if (marker) marker.style.zIndex = previousZ;
    };
  }, [highlightedPlaceId, visibleClusters, map]);

  return (
    <>
      {visibleClusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties as {
          cluster?: boolean;
          point_count?: number;
        };

        if (isCluster && pointCount) {
          let leaves: any[] = [];
          try {
            leaves = supercluster.getLeaves(cluster.id as number, 4);
          } catch { }

          const hasHiring = leaves.some(
            (l) => l.properties?.is_featured || (l.properties as any)?.active_jobs_count > 0
          );

          const genericCityNames = new Set([
            "bangalore", "bengaluru", "delhi", "new delhi", "noida", "gurugram", "gurgaon",
            "mumbai", "bombay", "chennai", "madras", "pune", "hyderabad", "kolkata", "calcutta",
            "kochi", "cochin", "india"
          ]);

          const validLocalities = leaves
            .map((l) => (l.properties?.locality || "").trim())
            .filter((loc: string) => loc.length >= 3 && loc.length <= 16 && !genericCityNames.has(loc.toLowerCase()));
          const topLoc = validLocalities.length > 0 ? validLocalities[0] : null;

          const tier = pointCount < 10 ? "sm" : pointCount < 50 ? "md" : "lg";
          const iconSize: [number, number] =
            topLoc
              ? [110, 30]
              : pointCount < 10 ? [66, 28] : pointCount < 50 ? [80, 30] : [94, 32];
          const iconAnchor: [number, number] = [iconSize[0] / 2, iconSize[1] / 2];

          const label = topLoc ? escapeHtml(topLoc) : String(pointCount);
          const labelSuffix = topLoc ? String(pointCount) : isTechAtlas ? "tech" : "cos";
          const clusterHtml = `<div class="lg-cluster${tier === "sm" ? "" : ` lg-cluster--${tier}`}"><span>${label}</span><span class="lg-cluster__label">${labelSuffix}</span>${hasHiring ? '<span class="lg-cluster__hiring" title="Active hiring in cluster"></span>' : ""}</div>`;

          const clusterIcon = L.divIcon({
            className: "lg-marker",
            html: clusterHtml,
            iconSize,
            iconAnchor,
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
            >
              <Tooltip direction="top" offset={[0, -16]} opacity={1} className="lg-tooltip">
                <div className="max-w-[220px] font-sans">
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-1.5 text-xs font-medium text-fg">
                    <span>{pointCount} companies</span>
                    {hasHiring && (
                      <span className="rounded bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">Hiring</span>
                    )}
                  </div>
                  <div className="space-y-0.5 py-1.5 text-[11px] text-fg-muted">
                    {leaves.slice(0, 3).map((l: any, i: number) => (
                      <div key={i} className="truncate">
                        {l.properties?.title || "Tech company"}
                      </div>
                    ))}
                    {pointCount > 3 && <div className="pt-0.5 text-[10px] text-fg-subtle">+{pointCount - 3} more</div>}
                  </div>
                  <div className="text-[10px] font-medium text-accent-text">Click to zoom in</div>
                </div>
              </Tooltip>

            </Marker>
          );
        }

        const place = cluster.properties as PlaceListing & { latitude: number; longitude: number };
        const isSelected = activePlaceId === place.id;
        const icon = getCategoryPinIcon(place, isSelected, isTechAtlas, zoom);
        const ratingInfo = getPlaceRating(place);

        return (
          <Marker
            key={`place-${place.id}`}
            position={[place.latitude, place.longitude]}
            icon={icon}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{
              click: () => setActivePlaceId(place.id),
              mouseover: () => onHoverPlace?.(place.id),
              mouseout: () => onHoverPlace?.(null),
            }}
          >
            {!isSelected && (
              <Tooltip direction="top" offset={[0, -28]} opacity={1} className="lg-tooltip">
                <div className="flex items-center gap-2 font-sans">
                  <span className="text-xs font-medium text-fg">{place.title}</span>
                  {place.is_featured ? (
                    <span className="rounded bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">Hiring</span>
                  ) : isTechAtlas ? (
                    place.category_name && (
                      <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent-text">
                        {place.category_name}
                      </span>
                    )
                  ) : (
                    <span className="rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning">
                      {ratingInfo.rating.toFixed(1)} rating
                    </span>
                  )}
                </div>
              </Tooltip>
            )}

            {/* Atlas companies open the detail drawer instead of a popup. */}
            {isSelected && !isTechAtlas && (
              <Popup className="lg-popup" autoPan={false}>
                <div className="max-w-[260px] p-3 font-sans">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {place.category_name && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-text">
                          {place.category_name}
                        </span>
                      )}
                      <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning">
                        {ratingInfo.rating.toFixed(1)} · {ratingInfo.reviewCount} reviews
                      </span>
                    </div>
                    {(() => {
                      const dist =
                        typeof place.distanceKm === "number"
                          ? place.distanceKm
                          : userLocation
                            ? calculateDistanceKm(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                            : null;
                      if (dist === null) return null;
                      return (
                        <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">
                          {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                        </span>
                      );
                    })()}
                  </div>

                  <h4 className="mt-2 font-display text-sm font-semibold leading-tight text-fg">
                    <Link href={`/listing/${place.slug}`} className="transition-colors hover:text-accent-text">
                      {place.title}
                    </Link>
                  </h4>

                  <p className="mt-1 text-[11px] text-fg-subtle">
                    {[place.locality, place.city].filter(Boolean).join(", ")}
                  </p>

                  {place.short_description && (
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-fg-muted">{place.short_description}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                    <a
                      href={generateUberRideLink(place.latitude, place.longitude, place.title, place.locality)}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      Ride
                    </a>
                    <Link href={`/listing/${place.slug}`} className={buttonVariants({ size: "sm" })}>
                      Details
                      <ArrowRightIcon className="size-3.5" />
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

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  mapStyle: MapStyleId;
  onSelectStyle: (id: MapStyleId) => void;
  weatherFx: WeatherType | null;
  onCycleWeather: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen: boolean;
};

function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  mapStyle,
  onSelectStyle,
  weatherFx,
  onCycleWeather,
  onToggleFullscreen,
  isFullscreen,
}: MapControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!groupRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const raining = weatherFx === "rain" || weatherFx === "thunderstorm";

  return (
    <div className="absolute right-3 top-3 z-[400] flex flex-col items-end gap-2 sm:right-4 sm:top-4">
      <div className="glass elev-md flex flex-col rounded-2xl p-1">
        <IconButton label="Zoom in" tooltipSide="left" size="sm" onClick={onZoomIn}>
          <PlusIcon />
        </IconButton>
        <IconButton label="Zoom out" tooltipSide="left" size="sm" onClick={onZoomOut}>
          <MinusIcon />
        </IconButton>
        <span aria-hidden="true" className="mx-1.5 my-0.5 h-px bg-line" />
        <IconButton label="Find my location" tooltipSide="left" size="sm" onClick={onLocate}>
          <LocateIcon />
        </IconButton>
      </div>

      <div ref={groupRef} className="glass elev-md relative flex flex-col rounded-2xl p-1">
        <IconButton
          label="Map style"
          tooltipSide="left"
          size="sm"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <LayersIcon />
        </IconButton>
        <IconButton
          label={`Weather effects: ${weatherFx ?? "off"}`}
          tooltipSide="left"
          size="sm"
          variant={raining ? "primary" : "ghost"}
          onClick={onCycleWeather}
        >
          <CloudRainIcon />
        </IconButton>
        {onToggleFullscreen && (
          <IconButton
            label={isFullscreen ? "Exit full screen" : "Full screen"}
            tooltipSide="left"
            size="sm"
            onClick={onToggleFullscreen}
          >
            <ExpandIcon />
          </IconButton>
        )}

        {menuOpen && (
          <div
            role="menu"
            aria-label="Map style"
            className="absolute right-full top-0 mr-2 w-56 rounded-2xl border border-line bg-surface-2 p-1.5 elev-lg"
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">Map style</p>
            {[MAP_LAYERS.street, MAP_LAYERS.satellite].map((layer) => {
              const selected = mapStyle === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    onSelectStyle(layer.id);
                    setMenuOpen(false);
                  }}
                  className={`focus-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 ${
                    selected ? "bg-accent-soft text-accent-text" : "text-fg hover:bg-surface-3"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-medium">{layer.id === "street" ? "Street" : layer.label}</span>
                    <span className="block text-xs text-fg-subtle">
                      {layer.id === "street" ? "Follows light and dark theme" : layer.description}
                    </span>
                  </span>
                  {selected && <CheckIcon className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


export default function InteractiveLeafletCanvas({
  locatedListings,
  activePlaceId,
  setActivePlaceId,
  hubCenter = null,
  hubNavTrigger = 0,
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
  highlightedPlaceId = null,
  flyToPlaceId = null,
  onHoverPlace,
  bottomInset = 0,
}: {
  locatedListings: (PlaceListing & { latitude: number; longitude: number })[];
  activePlaceId: string | null;
  setActivePlaceId: (id: string | null) => void;
  hubCenter?: { lat: number; lng: number; zoom?: number } | null;
  hubNavTrigger?: number;
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
  /** Pin that mirrors a hovered list card; highlights without moving the map. */
  highlightedPlaceId?: string | null;
  /** Company the map should glide to, e.g. the list card being hovered. */
  flyToPlaceId?: string | null;
  /** Fires when a pin is hovered so the list can highlight the matching card. */
  onHoverPlace?: (id: string | null) => void;
  /** Pixels at the bottom of the map covered by a sheet; flyTo keeps the pin above it. */
  bottomInset?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);
  const [activeWeatherFx, setActiveWeatherFx] = useState<WeatherType | null>(weatherType ?? null);
  const [isFxEnabled, setIsFxEnabled] = useState(showWeatherOverlay);
  const [userPannedBounds, setUserPannedBounds] = useState<MapViewportBounds | null>(null);

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
      if (saved && (saved === "satellite" || saved === "street")) return saved;
    }
    if (initialPerspective === "satellite") return "satellite";
    return "street";
  });

  const handleSelectStyle = (styleId: MapStyleId) => {
    setMapStyle(styleId);
    if (typeof window !== "undefined") {
      localStorage.setItem("locatogo_map_style", styleId);
    }
  };

  const activePlace = useMemo(
    () => (activePlaceId ? locatedListings.find((p) => p.id === activePlaceId) ?? null : null),
    [activePlaceId, locatedListings]
  );

  const focusPlace = useMemo(
    () => (flyToPlaceId ? locatedListings.find((p) => p.id === flyToPlaceId) ?? null : null),
    [flyToPlaceId, locatedListings]
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

  const currentTiles = MAP_LAYERS[mapStyle] || MAP_LAYERS.street;

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

  const theme = useTheme();
  const tileClass = mapStyle === "street" && theme === "dark" ? "leaflet-dark-tiles" : currentTiles.className;

  const cycleWeather = () => {
    if (!activeWeatherFx || activeWeatherFx === "clear") {
      setActiveWeatherFx("rain");
      setIsFxEnabled(true);
    } else if (activeWeatherFx === "rain") {
      setActiveWeatherFx("thunderstorm");
    } else {
      setActiveWeatherFx("clear");
    }
  };

  return (
    <div ref={containerRef} className="relative isolate h-full w-full select-none overflow-hidden bg-surface-3">
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={true}
        className="z-0 h-full w-full"
      >
        <TileLayer
          key={`tiles-${mapStyle}-${tileClass ?? "plain"}`}
          attribution={currentTiles.attribution}
          url={currentTiles.url}
          className={tileClass}
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
          focusPlace={focusPlace}
          userLocation={effectiveLocation}
          hubCenter={hubCenter}
          hubNavTrigger={hubNavTrigger}
          flyToUserTrigger={flyToUserTrigger}
          searchQuery={searchQuery}
          isTechAtlas={isTechAtlas}
          bottomInset={bottomInset}
        />

        {effectiveLocation && (
          <Marker position={[effectiveLocation.lat, effectiveLocation.lng]} icon={userLocationIcon}>
            <Popup className="lg-popup">
              <div className="p-3 text-center font-sans">
                <span className="text-xs font-medium text-fg">You are here</span>
                <p className="mt-0.5 text-[11px] text-fg-subtle">Showing distances and nearby places</p>
              </div>
            </Popup>
          </Marker>
        )}

        {effectiveLocation && typeof radiusKm === "number" && radiusKm > 0 && (
          <Circle
            center={[effectiveLocation.lat, effectiveLocation.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "var(--accent-strong)",
              fillColor: "var(--accent-vivid)",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "6, 6",
            }}
          />
        )}

        <ClusteredMarkersLayer
          locatedListings={locatedListings}
          activePlaceId={activePlaceId}
          highlightedPlaceId={highlightedPlaceId}
          setActivePlaceId={setActivePlaceId}
          onHoverPlace={onHoverPlace}
          userLocation={effectiveLocation}
          isTechAtlas={isTechAtlas}
        />
        <MapBoundsController onUserMoved={handleUserMoved} />
      </MapContainer>

      <div aria-hidden="true" className="lg-vignette" />

      {userPannedBounds && onSearchArea && (
        <div className="absolute left-1/2 top-3 z-[400] -translate-x-1/2 sm:top-4">
          <Button
            variant="secondary"
            size="sm"
            className="elev-md"
            leadingIcon={<RefreshIcon className="size-4" />}
            onClick={() => {
              onSearchArea(userPannedBounds);
              setUserPannedBounds(null);
            }}
          >
            Search this area
          </Button>
        </div>
      )}

      {isFxEnabled && activeWeatherFx && <WeatherAtmosphereOverlay weatherType={activeWeatherFx} />}

      <MapControls
        onZoomIn={() => zoomInRef.current?.()}
        onZoomOut={() => zoomOutRef.current?.()}
        onLocate={handleTriggerLocate}
        mapStyle={mapStyle}
        onSelectStyle={handleSelectStyle}
        weatherFx={activeWeatherFx}
        onCycleWeather={cycleWeather}
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}

