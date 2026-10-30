"use client";

import { useState, useEffect, useRef } from "react";
import type { AdSlotItem } from "@/components/admin-advertising-list";

type Props = {
  slot?: AdSlotItem | null;
  slots?: AdSlotItem[];
  slotType?: "flash_banner" | "header_banner" | "featured_pin" | "featured_listing";
  placementLocation?: "flash" | "in_feed" | "map_overlay" | "sidebar" | "detail_bottom" | "tech_spotlight";
  variant?: "flash" | "in_feed" | "sidebar" | "tech_spotlight" | "map_overlay" | "detail_bottom";
  itemIndex?: number;
  categoryId?: string | null;
  className?: string;
};

// Global in-memory set to prevent duplicate impression pings per session
const recordedImpressions = new Set<string>();
// Client-side in-memory cache for fetched active ad slots across page transitions
const adMemoryCache: Record<string, AdSlotItem[]> = {};

export function AdBannerSlot({
  slot: initialSlot,
  slots: initialSlots,
  slotType = "flash_banner",
  placementLocation,
  variant,
  itemIndex = 0,
  categoryId,
  className = "",
}: Props) {
  const resolvedPlacement = placementLocation || (variant as any) || (slotType === "flash_banner" ? "flash" : "in_feed");
  const resolvedVariant = variant || (resolvedPlacement as any) || "in_feed";
  const cacheKey = `${resolvedPlacement}_${categoryId || "all"}`;

  const [adList, setAdList] = useState<AdSlotItem[]>(() => {
    if (initialSlots && initialSlots.length > 0) return initialSlots;
    if (initialSlot) return [initialSlot];
    if (adMemoryCache[cacheKey] && adMemoryCache[cacheKey].length > 0) return adMemoryCache[cacheKey];
    return [];
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMapMinimized, setIsMapMinimized] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch active ads for this placement location if not passed
  useEffect(() => {
    if (initialSlots && initialSlots.length > 0) {
      setAdList(initialSlots);
      return;
    }
    if (initialSlot) {
      setAdList([initialSlot]);
      return;
    }

    let isMounted = true;
    async function fetchAds() {
      try {
        const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
        const supabase = createSupabaseBrowserClient();
        const now = new Date().toISOString();

        let query = supabase
          .from("ad_slots")
          .select("id, sponsor_name, title, description, slot_type, placement_location, target_category_id, status, price_paid, start_date, end_date, banner_url, target_url, cta_text, badge_text")
          .eq("status", "active")
          .lte("start_date", now)
          .gte("end_date", now)
          .order("created_at", { ascending: false });

        if (resolvedPlacement) {
          query = query.or(`placement_location.eq.${resolvedPlacement},slot_type.eq.${slotType}`);
        }

        const { data } = await query;

        if (isMounted && data && data.length > 0) {
          // Filter by category if categoryId was specified
          let filtered = data as (AdSlotItem & { placement_location?: string; target_category_id?: string })[];
          if (categoryId) {
            filtered = filtered.filter((a) => !a.target_category_id || a.target_category_id === categoryId);
          }
          adMemoryCache[cacheKey] = filtered;
          setAdList(filtered);
        }
      } catch (err) {
        console.warn("Failed to fetch ad slots:", err);
      }
    }

    fetchAds();
    return () => {
      isMounted = false;
    };
  }, [initialSlot, initialSlots, resolvedPlacement, slotType, categoryId]);

  // Determine active slot with combined slide offset and initial item index
  const activeIndex = (currentSlide + itemIndex) % (adList.length || 1);
  const activeSlot = adList.length > 0 ? adList[activeIndex] : null;

  // Auto-rotate carousel every 7 seconds for multi-ad banners (flash, in_feed, detail_bottom)
  useEffect(() => {
    if (adList.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % adList.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [adList.length, isPaused, resolvedVariant]);

  // Impression telemetry via IntersectionObserver
  useEffect(() => {
    if (!activeSlot || !containerRef.current || recordedImpressions.has(activeSlot.id)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !recordedImpressions.has(activeSlot.id)) {
          recordedImpressions.add(activeSlot.id);
          try {
            fetch("/api/ads/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adSlotId: activeSlot.id, eventType: "impression" }),
            }).catch(() => {});
          } catch {}
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeSlot]);

  // Click telemetry handler
  const handleAdClick = () => {
    if (!activeSlot) return;
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/ads/track",
          JSON.stringify({ adSlotId: activeSlot.id, eventType: "click" })
        );
      } else {
        fetch("/api/ads/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adSlotId: activeSlot.id, eventType: "click" }),
        }).catch(() => {});
      }
    } catch {}
  };

  if (!activeSlot || isDismissed) return null;

  const targetLink = activeSlot.target_url || "#";
  const badge = activeSlot.badge_text || "Partner Spotlight";
  const cta = activeSlot.cta_text || "Learn More";

  // VARIANT 1: FLASH ANNOUNCEMENT (Multi-Ad Auto-Rotating Carousel)
  if (resolvedVariant === "flash") {
    return (
      <div
        ref={containerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md relative z-40 transition-colors duration-500 ${className}`}
      >
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-2 sm:py-2.5 text-xs">
          {/* DESKTOP SINGLE-ROW BAR (sm and up) */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            {/* Left: Previous Slide Button if multiple */}
            {adList.length > 1 && (
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + adList.length) % adList.length)}
                className="text-white/80 hover:text-white px-1.5 py-0.5 text-xs cursor-pointer font-bold shrink-0"
                title="Previous Sponsor"
              >
                ‹
              </button>
            )}

            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              <span className="rounded-md bg-white/20 backdrop-blur-xs px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shrink-0">
                {badge}
              </span>
              <p className="font-semibold truncate text-xs text-white">
                <span className="font-bold">{activeSlot.sponsor_name}:</span> {activeSlot.title}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Slide Dots Indicator */}
              {adList.length > 1 && (
                <div className="flex items-center gap-1 shrink-0">
                  {adList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-ui cursor-pointer ${
                        (currentSlide % adList.length) === idx
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              )}

              <a
                href={targetLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAdClick}
                className="rounded-full bg-white text-slate-900 px-3.5 py-1.5 text-xs font-bold hover:bg-slate-100 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
              >
                {cta} ↗
              </a>

              {/* Next Slide Button */}
              {adList.length > 1 && (
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % adList.length)}
                  className="text-white/80 hover:text-white px-1.5 py-0.5 text-xs cursor-pointer font-bold shrink-0"
                  title="Next Sponsor"
                >
                  ›
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                title="Dismiss announcement"
                className="text-white/80 hover:text-white font-bold p-1 cursor-pointer text-xs ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* MOBILE 2-TIER CARD (< sm) */}
          <div className="flex sm:hidden flex-col gap-1.5 py-0.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="rounded bg-white/25 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shrink-0">
                  {badge}
                </span>
                <span className="font-bold text-[11px] text-white truncate">
                  {activeSlot.sponsor_name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {adList.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev - 1 + adList.length) % adList.length)}
                      className="text-white/90 p-0.5 text-xs font-bold"
                      title="Previous"
                    >
                      ‹
                    </button>
                    <span className="text-[10px] text-white/80 font-mono">
                      {(currentSlide % adList.length) + 1}/{adList.length}
                    </span>
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % adList.length)}
                      className="text-white/90 p-0.5 text-xs font-bold"
                      title="Next"
                    >
                      ›
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="text-white/80 hover:text-white p-1 text-xs font-bold"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <p className="text-[11px] font-semibold text-white line-clamp-2 leading-snug flex-1 pr-1">
                {activeSlot.title}
              </p>
              <a
                href={targetLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAdClick}
                className="rounded-full bg-white text-slate-900 px-3 py-1.5 text-[11px] font-bold hover:bg-slate-100 transition-colors shadow-2xs whitespace-nowrap cursor-pointer shrink-0"
              >
                {cta} ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT 2: IN-FEED DIRECTORY PROMOTED CARD
  if (resolvedVariant === "in_feed") {
    return (
      <article
        ref={containerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`group rounded-2xl border-2 border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-orange-950/20 p-4 shadow-sm hover:shadow-md transition-ui relative overflow-hidden flex flex-col justify-between ${className}`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="rounded bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <span>⭐</span>
              <span>{badge}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {activeSlot.sponsor_name}
              </span>
              {adList.length > 1 && (
                <div className="flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 text-[9px] font-bold text-amber-900 dark:text-amber-300 font-mono">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide((prev) => (prev - 1 + adList.length) % adList.length);
                    }}
                    className="hover:text-black dark:hover:text-white px-0.5 cursor-pointer font-bold"
                    title="Previous sponsor"
                  >
                    ‹
                  </button>
                  <span>{activeIndex + 1}/{adList.length}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide((prev) => (prev + 1) % adList.length);
                    }}
                    className="hover:text-black dark:hover:text-white px-0.5 cursor-pointer font-bold"
                    title="Next sponsor"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeSlot.banner_url && (
            <div className="h-28 w-full rounded-xl overflow-hidden mb-3 relative bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeSlot.banner_url}
                alt={activeSlot.title || activeSlot.sponsor_name}
                className="h-full w-full object-cover motion-safe:group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#0ea5e9] transition-colors line-clamp-2">
            {activeSlot.title}
          </h4>

          {activeSlot.description && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {activeSlot.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-2.5 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
            Featured Directory Partner
          </span>
          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>{cta}</span>
            <span>↗</span>
          </a>
        </div>
      </article>
    );
  }

  // VARIANT 3: INTERACTIVE MAP CANVAS OVERLAY (Mobile Collapsible)
  if (resolvedVariant === "map_overlay") {
    // If minimized on mobile, show compact floating pill
    if (isMapMinimized) {
      return (
        <div
          ref={containerRef}
          className={`flex items-center gap-1.5 rounded-full bg-slate-950/90 dark:bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 text-xs shadow-xl border border-amber-400/80 z-[450] animate-fade-in ${className}`}
        >
          <span className="text-amber-400 text-xs">📍</span>
          <span className="font-bold text-[11px] text-amber-300 truncate max-w-[120px] sm:max-w-[180px]">
            {activeSlot.sponsor_name}
          </span>
          <button
            type="button"
            onClick={() => setIsMapMinimized(false)}
            className="text-[10px] font-bold text-slate-300 hover:text-white px-1 cursor-pointer"
            title="Expand partner card"
          >
            ▲
          </button>
          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="text-[10px] font-bold text-amber-400 hover:underline pl-0.5"
          >
            {cta} ↗
          </a>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-white/60 hover:text-white text-xs pl-1 font-bold cursor-pointer"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      );
    }

    // Expanded card
    return (
      <div
        ref={containerRef}
        className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-amber-300/80 dark:border-amber-700/80 p-3 shadow-xl max-w-[280px] sm:max-w-xs text-xs z-[450] animate-fade-up ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="rounded bg-amber-400 text-slate-950 font-bold px-2 py-0.5 text-[9px] uppercase tracking-wider flex items-center gap-1">
            <span>📍</span>
            <span>{badge}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">
              {activeSlot.sponsor_name}
            </span>
            <button
              type="button"
              onClick={() => setIsMapMinimized(true)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold px-1 cursor-pointer"
              title="Minimize to pill"
            >
              ▼
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>

        <p className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
          {activeSlot.title}
        </p>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">Map Spotlight</span>
          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="rounded-lg bg-slate-900 dark:bg-cyan-600 text-white font-bold px-2.5 py-1 text-[10px] hover:bg-slate-800 transition-colors"
          >
            {cta} ↗
          </a>
        </div>
      </div>
    );
  }

  // VARIANT 4: SIDEBAR PARTNER SPOTLIGHT
  if (resolvedVariant === "sidebar") {
    return (
      <div
        ref={containerRef}
        className={`rounded-3xl border border-cyan-200 dark:border-cyan-900/60 bg-gradient-to-br from-cyan-50/50 via-white to-purple-50/40 dark:from-cyan-950/30 dark:via-slate-900 dark:to-purple-950/20 p-5 shadow-xs relative overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {badge}
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            {activeSlot.sponsor_name}
          </span>
        </div>

        {activeSlot.banner_url && (
          <div className="h-32 w-full rounded-2xl overflow-hidden mb-3 relative bg-slate-100 dark:bg-slate-800 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeSlot.banner_url}
              alt={activeSlot.title || activeSlot.sponsor_name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <h4 className="font-bold text-sm text-slate-950 dark:text-slate-100 leading-snug">
          {activeSlot.title}
        </h4>

        {activeSlot.description && (
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {activeSlot.description}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-cyan-100 dark:border-cyan-900/60">
          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="block w-full text-center rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 text-xs shadow-xs transition-colors cursor-pointer"
          >
            {cta} ↗
          </a>
        </div>
      </div>
    );
  }

  // VARIANT 5: PLACE DETAIL PAGE BOTTOM SHOWCASE
  if (resolvedVariant === "detail_bottom") {
    return (
      <div
        ref={containerRef}
        className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900/60 p-6 shadow-xs ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {activeSlot.banner_url ? (
              <div className="h-16 w-24 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSlot.banner_url}
                  alt={activeSlot.sponsor_name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center text-xl shrink-0 font-bold">
                ⭐
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {badge}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeSlot.sponsor_name}
                </span>
              </div>
              <h4 className="mt-1 font-bold text-sm text-slate-950 dark:text-slate-100">
                {activeSlot.title}
              </h4>
              {activeSlot.description && (
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {activeSlot.description}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center">
            <a
              href={targetLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="rounded-full bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{cta}</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT 6: TECH ATLAS SPOTLIGHT
  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-cyan-300 dark:border-cyan-800/80 bg-gradient-to-r from-cyan-900/90 via-slate-900 to-purple-900/90 text-white p-4 sm:p-5 shadow-lg relative overflow-hidden ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {badge}
            </span>
            <span className="text-xs font-bold text-cyan-200">{activeSlot.sponsor_name}</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">{activeSlot.title}</h3>
          {activeSlot.description && (
            <p className="text-xs text-cyan-200/80 line-clamp-1">{activeSlot.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="rounded-xl bg-white text-slate-950 font-bold px-4 py-2 text-xs hover:bg-slate-100 shadow-md transition-ui cursor-pointer whitespace-nowrap"
          >
            {cta} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
