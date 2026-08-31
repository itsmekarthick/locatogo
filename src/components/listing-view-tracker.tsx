"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/tracker";

export function ListingViewTracker({ listingId, domainSlug }: { listingId: string; domainSlug?: string }) {
  useEffect(() => {
    trackEvent("listing_view", {
      listingId,
      domainSlug,
    });
  }, [listingId, domainSlug]);

  return null;
}
