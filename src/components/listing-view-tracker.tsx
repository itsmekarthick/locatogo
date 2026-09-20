"use client";

import { useEffect } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics/tracker";

export function ListingViewTracker({ listingId, domainSlug }: { listingId: string; domainSlug?: string }) {
  useEffect(() => {
    trackEvent("listing_view", {
      listingId,
      domainSlug,
    });

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest("[data-analytics-event]");
      if (target) {
        const eventType = target.getAttribute("data-analytics-event") as AnalyticsEvent;
        if (eventType) trackEvent(eventType, { listingId, domainSlug });
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [listingId, domainSlug]);

  return null;
}
