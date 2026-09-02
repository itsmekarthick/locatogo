"use client";

import { useState, useEffect, useRef } from "react";
import type { AdSlotItem } from "@/components/admin-advertising-list";

type Props = {
  slot?: AdSlotItem | null;
  slotType?: "flash_banner" | "header_banner" | "featured_listing";
  variant?: "flash" | "in_feed" | "sidebar" | "tech_spotlight";
  className?: string;
};

// Global in-memory set to prevent duplicate impression pings per session
const recordedImpressions = new Set<string>();

export function AdBannerSlot({
  slot: initialSlot,
  slotType = "flash_banner",
  variant = "flash",
  className = "",
}: Props) {
  const [slot, setSlot] = useState<AdSlotItem | null>(initialSlot || null);
  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // If no slot was passed, fetch an active one from Supabase via client if needed
  useEffect(() => {
    if (initialSlot !== undefined) {
      setSlot(initialSlot);
      return;
    }

    let isMounted = true;
    async function fetchAd() {
      try {
        const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
        const supabase = createSupabaseBrowserClient();
        const now = new Date().toISOString();

        const { data } = await supabase
          .from("ad_slots")
          .select("id, sponsor_name, title, description, slot_type, status, price_paid, start_date, end_date, banner_url, target_url, cta_text, badge_text")
          .eq("slot_type", slotType)
          .eq("status", "active")
          .lte("start_date", now)
          .gte("end_date", now)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (isMounted && data) {
          setSlot(data as AdSlotItem);
        }
      } catch (err) {
        console.warn("Failed to fetch ad slot:", err);
      }
    }

    fetchAd();
    return () => {
      isMounted = false;
    };
  }, [initialSlot, slotType]);

  // Impression telemetry via IntersectionObserver
  useEffect(() => {
    if (!slot || !containerRef.current || recordedImpressions.has(slot.id)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !recordedImpressions.has(slot.id)) {
          recordedImpressions.add(slot.id);
          try {
            fetch("/api/ads/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adSlotId: slot.id, eventType: "impression" }),
            }).catch(() => {});
          } catch {}
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [slot]);

  // Click telemetry handler
  const handleAdClick = () => {
    if (!slot) return;
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/ads/track",
          JSON.stringify({ adSlotId: slot.id, eventType: "click" })
        );
      } else {
        fetch("/api/ads/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adSlotId: slot.id, eventType: "click" }),
        }).catch(() => {});
      }
    } catch {}
  };

  if (!slot || isDismissed) return null;

  const targetLink = slot.target_url || "#";
  const badge = slot.badge_text || "Partner Spotlight";
  const cta = slot.cta_text || "Learn More";

  // VARIANT 1: FLASH ANNOUNCEMENT (Slim Top Pill Banner)
  if (variant === "flash") {
    return (
      <div
        ref={containerRef}
        className={`w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md relative z-40 ${className}`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2 sm:py-2.5 text-xs">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <span className="rounded-md bg-white/20 backdrop-blur-xs px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shrink-0">
              {badge}
            </span>
            <p className="font-semibold truncate text-[11px] sm:text-xs text-white">
              <span className="font-bold">{slot.sponsor_name}:</span> {slot.title}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={targetLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="rounded-full bg-white text-slate-900 px-3 py-1 text-[11px] font-bold hover:bg-slate-100 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              {cta} ↗
            </a>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title="Dismiss announcement"
              className="text-white/80 hover:text-white font-bold p-1 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT 2: IN-FEED DIRECTORY PROMOTED CARD
  if (variant === "in_feed") {
    return (
      <article
        ref={containerRef}
        className={`group rounded-2xl border-2 border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-orange-950/20 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between ${className}`}
      >
        <div>
          {/* Header Badge */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="rounded bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <span>⭐</span>
              <span>{badge}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {slot.sponsor_name}
            </span>
          </div>

          {/* Banner cover if provided */}
          {slot.banner_url && (
            <div className="h-28 w-full rounded-xl overflow-hidden mb-3 relative bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.banner_url}
                alt={slot.title || slot.sponsor_name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#e26a4f] transition-colors line-clamp-2">
            {slot.title}
          </h4>

          {slot.description && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {slot.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-2.5 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
            Verified Partner Offer
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

  // VARIANT 3: SIDEBAR PARTNER SPOTLIGHT (Listing Profile Sidebar)
  if (variant === "sidebar") {
    return (
      <div
        ref={containerRef}
        className={`rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 p-5 shadow-xs relative overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {badge}
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            {slot.sponsor_name}
          </span>
        </div>

        {slot.banner_url && (
          <div className="h-32 w-full rounded-2xl overflow-hidden mb-3 relative bg-slate-100 dark:bg-slate-800 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slot.banner_url}
              alt={slot.title || slot.sponsor_name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <h4 className="font-bold text-sm text-slate-950 dark:text-slate-100 leading-snug">
          {slot.title}
        </h4>

        {slot.description && (
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {slot.description}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/60">
          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="block w-full text-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 text-xs shadow-xs transition-colors cursor-pointer"
          >
            {cta} ↗
          </a>
        </div>
      </div>
    );
  }

  // VARIANT 4: TECH ATLAS SPOTLIGHT
  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-indigo-300 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-900/90 via-slate-900 to-purple-900/90 text-white p-4 sm:p-5 shadow-lg relative overflow-hidden ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {badge}
            </span>
            <span className="text-xs font-bold text-indigo-200">{slot.sponsor_name}</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">{slot.title}</h3>
          {slot.description && (
            <p className="text-xs text-indigo-200/80 line-clamp-1">{slot.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={targetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAdClick}
            className="rounded-xl bg-white text-slate-950 font-bold px-4 py-2 text-xs hover:bg-slate-100 shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            {cta} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
