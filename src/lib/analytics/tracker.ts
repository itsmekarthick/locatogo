"use client";

type AnalyticsEvent =
  | "page_view"
  | "listing_view"
  | "search"
  | "map_interaction"
  | "website_click"
  | "phone_click"
  | "whatsapp_click"
  | "uber_click"
  | "favorite_click";

type TrackPayload = {
  domainSlug?: string;
  domainId?: string;
  listingId?: string;
  metadata?: Record<string, any>;
};

/**
 * Sends a non-blocking analytics event to /api/analytics
 */
export function trackEvent(eventType: AnalyticsEvent, payload: TrackPayload = {}) {
  if (typeof window === "undefined") return;

  const data = {
    eventType,
    domainSlug: payload.domainSlug || "default",
    domainId: payload.domainId,
    listingId: payload.listingId,
    metadata: {
      ...payload.metadata,
      path: window.location.pathname,
      referrer: document.referrer || null,
      timestamp: new Date().toISOString(),
    },
  };

  try {
    if ("sendBeacon" in navigator) {
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
    } else {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently to never disrupt user experience
  }
}
