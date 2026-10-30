"use client";

import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { getPlaceRating } from "@/lib/services/place-rating";
import { getUniquePlacePhotos } from "@/lib/media/place-photos";
import { generateUberRideLink, generateWhatsAppInquiryLink } from "@/lib/services/transit-links";
import type { PlaceListing } from "@/components/modern-directory-explorer";

type Props = {
  place: PlaceListing;
  isSelected: boolean;
  onHover: (id: string) => void;
  onSelect: (id: string) => void;
};

export function AirbnbListingCard({ place, isSelected, onHover, onSelect }: Props) {
  const ratingInfo = getPlaceRating(place);
  const categoryName = place.category_name || "Place";
  const photos = getUniquePlacePhotos(place.slug, place.title, categoryName);
  const coverPhoto = photos[0]?.url || "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80";

  return (
    <article
      data-listing-id={place.id}
      onMouseEnter={() => onHover(place.id)}
      onClick={() => onSelect(place.id)}
      className={`group relative flex flex-col rounded-3xl border bg-white dark:bg-slate-900 overflow-hidden transition-flat duration-300 cursor-pointer ${
        isSelected
          ? "border-slate-900 dark:border-white ring-2 ring-slate-900/20 dark:ring-white/20 shadow-xl"
          : "border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-lg"
      }`}
    >
      {/* 1. MEDIA CONTAINER (16:10 Aspect Ratio Photo) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={coverPhoto}
          alt={place.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
        />

        {/* Gradient Overlay on Bottom of Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Top-Left: Category Tag */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm">
            {categoryName}
          </span>
          {place.is_featured && (
            <span className="rounded-full bg-[#0ea5e9] text-white px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-xs">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Top-Right: Favorite Button */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 right-2.5 z-10 drop-shadow-md"
        >
          <FavoriteButton listingId={place.id} className="p-2! bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md rounded-full text-sm shadow-xs" />
        </div>

        {/* Bottom-Left: Brand Avatar Badge Overlay */}
        <div className="absolute bottom-2.5 left-3.5 z-10 flex items-center gap-2">
          <div className="rounded-xl ring-2 ring-white dark:ring-slate-900 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
            <CompanyBrandAvatar title={place.title} website={place.website} size={32} />
          </div>
          {place.verification_status === "verified" && (
            <span className="rounded-full bg-cyan-500 text-white px-1.5 py-0.5 text-[9px] font-bold shadow-xs">
              ✓ Verified
            </span>
          )}
        </div>

        {/* Bottom-Right: Distance Pill */}
        {typeof place.distanceKm === "number" && (
          <div className="absolute bottom-2.5 right-3.5 z-10">
            <span className="rounded-full bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              🚗 {place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)}m` : `${place.distanceKm.toFixed(1)} km`}
            </span>
          </div>
        )}
      </div>

      {/* 2. CARD BODY & TYPOGRAPHY */}
      <div className="flex flex-col p-4 sm:p-5 flex-1 justify-between">
        <div>
          {/* Row 1: Title + Star Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-base sm:text-lg font-bold text-slate-950 dark:text-white group-hover:text-[#0ea5e9] transition-colors truncate flex-1">
              <Link href={`/listing/${place.slug}`} onClick={(e) => e.stopPropagation()}>
                {place.title}
              </Link>
            </h3>

            {/* Star Rating Badge */}
            <div className="flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-1.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-300 shrink-0">
              <span className="text-amber-500">★</span>
              <span>{ratingInfo.rating.toFixed(1)}</span>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                ({ratingInfo.reviewCount})
              </span>
            </div>
          </div>

          {/* Row 2: Locality & Area */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
            <span className="text-[#0ea5e9]">📍</span>
            <span>{[place.locality, place.city].filter(Boolean).join(", ") || "Verified Destination"}</span>
          </p>

          {/* Row 3: Short Description Snippet */}
          {place.short_description && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {place.short_description}
            </p>
          )}
        </div>

        {/* Bottom Quick Links & Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {place.phone && (
              <a data-analytics-event="whatsapp_click" href={generateWhatsAppInquiryLink(place.phone, place.title, place.category_name) || `tel:${place.phone}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="WhatsApp Inquiry"
                className="flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-2xs"
              >
                <span>💬</span>
                <span>WA</span>
              </a>
            )}
            {place.latitude && place.longitude && (
              <a data-analytics-event="uber_click" href={generateUberRideLink(place.latitude, place.longitude, place.title, place.locality)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Book Uber to Location"
                className="flex items-center gap-1 rounded-full border border-slate-900 dark:border-slate-700 bg-black dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <span>🚕</span>
                <span>Uber</span>
              </a>
            )}
          </div>

          <Link
            href={`/listing/${place.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-xs text-[#0ea5e9] hover:underline flex items-center gap-1"
          >
            <span>Details</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
