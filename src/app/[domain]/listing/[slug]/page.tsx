import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUniquePlacePhotos } from "@/lib/media/place-photos";
import { fetchLivePlaceDetails } from "@/lib/media/google-places";
import { getComprehensiveAboutText } from "@/lib/media/place-overview";
import { PlaceMiniMap } from "@/components/place-mini-map";
import { DetailsAutocompleteSearch } from "@/components/details-autocomplete-search";
import { fetchPlaceWeather } from "@/lib/services/weather";
import { PlaceWeatherBadge } from "@/components/place-weather-badge";
import {
  generateUberRideLink,
  generateOlaRideLink,
  generateWhatsAppInquiryLink,
} from "@/lib/services/transit-links";

type Props = { params: Promise<{ domain: string; slug: string }> };

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function getListing(params: Props["params"]) {
  const { domain: rawDomain, slug: rawSlug } = await params;
  const cleanDomain = decodeURIComponent(rawDomain).trim().toLowerCase();
  const cleanSlug = decodeURIComponent(rawSlug).trim().toLowerCase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

  const supabase = await createSupabaseServerClient();
  const { data: directory } = await supabase
    .from("domains")
    .select("id, name, slug")
    .or(`slug.eq.${cleanDomain},slug.ilike.${cleanDomain}`)
    .eq("status", "published")
    .maybeSingle();

  let query = supabase
    .from("listings")
    .select("id, title, slug, short_description, description, address_line_1, address_line_2, locality, city, administrative_area, country_code, postal_code, website, phone, email, whatsapp, latitude, longitude, verification_status, is_featured, categories:categories!listings_category_id_domain_id_fkey(name)");

  if (directory?.id) {
    query = query.eq("domain_id", directory.id);
  }

  if (isUuid) {
    query = query.or(`slug.eq.${cleanSlug},slug.ilike.${cleanSlug},id.eq.${cleanSlug}`);
  } else {
    query = query.or(`slug.eq.${cleanSlug},slug.ilike.${cleanSlug}`);
  }

  const { data: listing } = await query.limit(1).maybeSingle();

  if (!listing) return null;
  const resolvedDirectory = directory || { id: listing.id, name: "Bangalore Atlas", slug: "bangalore-atlas" };

  const [{ data: hours }, { data: links }, { data: media }, weather, placeDetails] = await Promise.all([
    supabase.from("listing_hours").select("day_of_week, is_closed, is_24_hours, open_time, close_time").eq("listing_id", listing.id).order("day_of_week"),
    supabase.from("listing_social_links").select("platform, url").eq("listing_id", listing.id),
    supabase.from("listing_media").select("id, media_type, public_url, alt_text").eq("listing_id", listing.id).order("sort_order"),
    fetchPlaceWeather(listing.latitude, listing.longitude),
    fetchLivePlaceDetails(listing.title, listing.locality, listing.latitude, listing.longitude),
  ]);

  return { directory: resolvedDirectory, listing, hours, links, media, placeDetails, weather };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getListing(params);
  if (!result) return { title: "Listing not found" };
  return {
    title: `${result.listing.title} | ${result.directory.name}`,
    description: result.listing.short_description ?? result.listing.description ?? `Explore ${result.listing.title}.`,
  };
}

export default async function ListingPage({ params }: Props) {
  const result = await getListing(params);
  if (!result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-white font-sans text-gray-900">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-950">Place Not Found</h1>
        <p className="mt-2 text-sm text-gray-500">This listing is unavailable or has been archived.</p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-[#e26a4f] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#d8583c] transition-colors"
        >
          Back to Directory
        </Link>
      </main>
    );
  }

  const { directory, listing, hours, links, media, placeDetails, weather } = result;
  const rawCategoryName = Array.isArray(listing.categories)
    ? listing.categories[0]?.name
    : (listing.categories as { name?: string } | null)?.name || "General";
  const categoryName = rawCategoryName.toUpperCase();

  const address = [
    listing.address_line_1,
    listing.address_line_2,
    listing.locality,
    listing.city,
    listing.administrative_area,
    listing.country_code,
    listing.postal_code,
  ].filter(Boolean).join(", ");

  let displayPhotos: Array<{ url: string; alt: string; caption: string; source?: string }> = [];

  if (media && media.length > 0) {
    displayPhotos = media.map(m => ({ url: m.public_url, alt: m.alt_text || listing.title, caption: m.alt_text || "Photo" }));
  } else if (placeDetails.photos && placeDetails.photos.length > 0) {
    displayPhotos = placeDetails.photos;
  } else {
    displayPhotos = getUniquePlacePhotos(listing.slug, listing.title, rawCategoryName);
  }

  const aboutData = getComprehensiveAboutText(
    listing.title,
    rawCategoryName,
    listing.locality,
    listing.short_description,
    listing.description
  );

  const heroSummary = listing.short_description || aboutData.overview;

  // Third-Party Communication & Transit Links
  const whatsappUrl = generateWhatsAppInquiryLink(listing.whatsapp || listing.phone, listing.title, rawCategoryName);
  const uberRideUrl = generateUberRideLink(listing.latitude, listing.longitude, listing.title, listing.locality);
  const olaRideUrl = generateOlaRideLink(listing.latitude, listing.longitude, listing.title, listing.locality);
  const googleImagesQuery = encodeURIComponent(`${listing.title} ${listing.locality || ''} Bangalore`);
  const googleMapsQuery = encodeURIComponent(`${listing.title} ${listing.locality || ''} Bangalore`);
  const googleMapsPhotosUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;
  const googleImagesSearchUrl = `https://www.google.com/search?tbm=isch&q=${googleImagesQuery}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.title,
    description: listing.description ?? listing.short_description,
    url: listing.website,
    telephone: listing.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address_line_1,
      addressLocality: listing.locality || listing.city,
      addressRegion: listing.administrative_area,
      addressCountry: listing.country_code,
      postalCode: listing.postal_code,
    },
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fdfdfd] font-sans antialiased text-[#111827]">
      {/* Top Navbar with Autocomplete Search */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-2xs">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/" className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              locatogo<span className="text-[#e26a4f]">.</span>
            </Link>
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-50/60 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
              <span className="text-xs">📍</span>
              <span>{directory.name}</span>
            </div>
          </div>

          {/* Autocomplete Search Bar */}
          <div className="flex-1 max-w-[200px] xs:max-w-[260px] sm:max-w-md mx-1 sm:mx-2 flex justify-center">
            <DetailsAutocompleteSearch />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link
              href={`/${directory.slug}`}
              className="rounded-full border border-gray-200 bg-white px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← <span className="hidden sm:inline">Back</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 lg:pb-12">
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2.5">
          <Link
            href={`/${directory.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-950 transition-colors"
          >
            <span>←</span>
            <span>Back to {directory.name}</span>
          </Link>

          {/* Compact Weather & AQI Header Badge */}
          {weather && (
            <PlaceWeatherBadge weather={weather} locality={listing.locality} compact />
          )}
        </div>

        {/* 1. HERO SHOWCASE CARD */}
        <section className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-xs mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="rounded bg-blue-50/90 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                {categoryName}
              </span>
              {listing.is_featured && (
                <span className="rounded bg-orange-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] font-bold tracking-wider text-[#e26a4f] uppercase flex items-center gap-1">
                  <span>☆</span>
                  <span>FEATURED</span>
                </span>
              )}
              {listing.verification_status === "verified" && (
                <span className="rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  ✓ Verified Place
                </span>
              )}
              {placeDetails.rating && (
                <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 flex items-center gap-1">
                  <span>★</span>
                  <span>{placeDetails.rating} Google Rating</span>
                </span>
              )}
            </div>

            <Link
              href={`/${directory.slug}/listing/${listing.slug}/claim`}
              className="text-xs font-bold text-[#e26a4f] hover:underline flex items-center gap-1"
            >
              <span>🏷️ Claim</span>
            </Link>
          </div>

          <div className="mt-3 sm:mt-4">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-[40px] font-bold text-gray-950 leading-tight">
              {listing.title}
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <span className="text-[#e26a4f] shrink-0">📍</span>
              <span>{placeDetails.formattedAddress || address || "Bangalore, Karnataka, India"}</span>
            </p>

            {/* WHAT THIS PLACE IS FOR (HERO SUMMARY) */}
            <p className="mt-3 text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed max-w-4xl font-normal">
              {heroSummary}
            </p>
          </div>

          {/* Action Button Bar */}
          <div className="mt-5 sm:mt-6 flex items-center gap-2 sm:gap-2.5 border-t border-gray-100 pt-4 sm:pt-5 text-xs overflow-x-auto pb-1.5 sm:pb-0 sm:flex-wrap no-scrollbar">
            {/* WhatsApp 1-Click Direct Inquiry */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 sm:px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs shrink-0"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>
            )}

            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs shrink-0"
              >
                <span>📞</span>
                <span>Call {listing.phone}</span>
              </a>
            )}

            <a
              href={uberRideUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-gray-900 bg-gray-950 px-3.5 sm:px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors shadow-2xs shrink-0"
            >
              <span>🚕</span>
              <span>Uber</span>
            </a>

            <a
              href={olaRideUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-lime-400 bg-lime-50 px-3.5 sm:px-4 py-2 text-xs font-bold text-lime-900 hover:bg-lime-100 transition-colors shadow-2xs shrink-0"
            >
              <span>🛺</span>
              <span>Ola</span>
            </a>

            {listing.website && (
              <a
                href={listing.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs shrink-0"
              >
                <span>🌐</span>
                <span>Website</span>
              </a>
            )}

            {listing.latitude && listing.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs shrink-0"
              >
                <span>🧭</span>
                <span>Directions</span>
              </a>
            )}

            <a
              href={googleImagesSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs shrink-0"
            >
              <span>📸</span>
              <span>Images ↗</span>
            </a>

            <a
              href={googleMapsPhotosUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 sm:px-4 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 transition-colors shrink-0"
            >
              <span>📍</span>
              <span>Maps Photos</span>
            </a>
          </div>
        </section>

        {/* 2. PHOTO MOSAIC SHOWCASE */}
        <section className="mb-6 sm:mb-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="md:col-span-2 relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 bg-gray-100 shadow-xs group">
              <img
                src={displayPhotos[0]?.url || "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80"}
                alt={displayPhotos[0]?.alt || listing.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4 sm:p-5">
                <div>
                  <span className="rounded bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                    {displayPhotos[0]?.caption || "Main Venue Facade"}
                  </span>
                  <p className="text-white text-sm sm:text-base font-semibold mt-1">
                    {listing.title}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-3 sm:gap-4">
              <div className="relative aspect-[16/10] md:aspect-auto md:h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 bg-gray-100 shadow-xs group">
                <img
                  src={displayPhotos[1]?.url || displayPhotos[0]?.url || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80"}
                  alt={displayPhotos[1]?.alt || listing.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold text-white">
                  {displayPhotos[1]?.caption || "Interior"}
                </div>
              </div>

              <div className="relative aspect-[16/10] md:aspect-auto md:h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 bg-gray-100 shadow-xs group">
                <img
                  src={displayPhotos[2]?.url || displayPhotos[0]?.url || "https://images.unsplash.com/photo-1527018607637-a616330326d7?auto=format&fit=crop&w=800&q=80"}
                  alt={displayPhotos[2]?.alt || listing.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <a
                  href={googleMapsPhotosUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white text-[11px] sm:text-xs font-bold hover:bg-black/40 transition-colors p-2 text-center"
                >
                  <span>📸 View All Photos ↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TWO-COLUMN EDITORIAL CONTENT GRID */}
        <section className="w-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
            <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-xs">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                <span className="text-xl">📖</span>
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-950">
                    What this place is for & Overview
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Essential details, community role, and services for {listing.title}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4 text-xs sm:text-sm leading-relaxed text-gray-700">
                <p className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed">
                  {aboutData.overview}
                </p>
                {listing.description && listing.description !== aboutData.overview && (
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-4">
                    {listing.description}
                  </p>
                )}
              </div>

              <div className="mt-6 sm:mt-8 rounded-2xl bg-gray-50/80 border border-gray-200/80 p-4 sm:p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Overview & Key Facts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                  {aboutData.keyFacts.map((fact, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100">
                      <span className="text-gray-500">{fact.label}:</span>
                      <span className="font-semibold text-gray-900">{fact.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 sm:mt-8 border-t border-gray-100 pt-5 sm:pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Key Amenities & Highlights
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs">
                  {aboutData.highlights.map((highlight, idx) => (
                    <span key={idx} className="rounded-full bg-blue-50/70 border border-blue-100 px-3 py-1 text-[11px] sm:text-xs font-medium text-blue-900 flex items-center gap-1.5">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>{highlight}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-950">
                    Community Reviews & Ratings
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Verified Google Maps visitor feedback & ratings
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900">
                  <span>★</span>
                  <span>{placeDetails.rating ? `${placeDetails.rating} / 5.0` : "4.8 / 5.0"}</span>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-gray-900">
                    {placeDetails.userRatingCount
                      ? `${placeDetails.userRatingCount.toLocaleString()} verified Google reviews`
                      : "Read visitor reviews and photo uploads"}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    See detailed recommendations, menus, and verified community experiences.
                  </p>
                </div>
                <a
                  href={googleMapsPhotosUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white whitespace-nowrap hover:bg-gray-800 transition-colors shadow-xs self-stretch sm:self-auto text-center"
                >
                  Read on Google Maps ↗
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: MAP, LIVE WEATHER & TRANSIT SIDEBAR */}
          <div className="space-y-6">
            {/* Live Weather & AQI Card */}
            {weather && (
              <PlaceWeatherBadge weather={weather} locality={listing.locality} />
            )}

            <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 shadow-xs">
              <h3 className="font-serif text-base font-bold text-gray-950 flex items-center gap-1.5">
                <span>🗺️</span>
                <span>Live Map & Directions</span>
              </h3>
              <p className="mt-1 text-xs text-gray-500">Exact GPS positioning in Bangalore</p>

              {listing.latitude && listing.longitude ? (
                <div className="mt-4 space-y-3">
                  <PlaceMiniMap
                    listing={{
                      ...listing,
                      latitude: listing.latitude,
                      longitude: listing.longitude,
                    }}
                  />
                  <div className="flex items-center justify-between text-xs font-mono bg-gray-50 border border-gray-200 p-2.5 rounded-xl">
                    <span className="text-gray-500">GPS:</span>
                    <span className="font-bold text-emerald-700">
                      {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
                    </span>
                  </div>

                  {/* Quick Ride Booking Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={uberRideUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-black py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-colors shadow-xs"
                    >
                      <span>🚕</span>
                      <span>Uber Ride</span>
                    </a>
                    <a
                      href={olaRideUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-lime-400 py-2.5 text-xs font-bold text-lime-950 hover:bg-lime-300 transition-colors shadow-xs"
                    >
                      <span>🛺</span>
                      <span>Ola Cab</span>
                    </a>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full block text-center rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-800 hover:bg-gray-200 transition-colors"
                  >
                    Open Driving Route in Maps 🧭
                  </a>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 shadow-xs">
              <h3 className="font-serif text-base font-bold text-gray-950 flex items-center gap-1.5">
                <span>⏰</span>
                <span>Operating Schedule</span>
              </h3>
              <div className="mt-4 divide-y divide-gray-100 text-xs">
                {daysOfWeek.map((day, idx) => {
                  const schedule = hours?.find((h) => h.day_of_week === idx);
                  return (
                    <div key={day} className="flex items-center justify-between py-2">
                      <span className="font-medium text-gray-700">{day}</span>
                      <span className="text-gray-500 font-semibold">
                        {!schedule || schedule.is_closed ? (
                          <span className="text-red-600">Closed</span>
                        ) : schedule.is_24_hours ? (
                          <span className="text-emerald-700">Open 24 Hours</span>
                        ) : (
                          `${schedule.open_time || "09:00"} - ${schedule.close_time || "18:00"}`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 bg-white p-5 sm:p-6 text-center shadow-xs">
              <span className="text-2xl">🤝</span>
              <h4 className="font-serif text-sm font-bold text-gray-900 mt-2">
                Own or Manage this Place?
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Claim this official listing to manage profile details, upload more photos, and update contact hours.
              </p>
              <Link
                href={`/${directory.slug}/listing/${listing.slug}/claim`}
                className="mt-4 inline-block rounded-full bg-[#e26a4f] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#d8583c] transition-colors"
              >
                Claim This Listing
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FIXED MOBILE BOTTOM ACTION DOCK */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3.5 py-2.5 flex items-center justify-between gap-2 lg:hidden shadow-lg">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
          >
            <span>💬</span>
            <span>WhatsApp</span>
          </a>
        )}
        {listing.phone && (
          <a
            href={`tel:${listing.phone}`}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
          >
            <span>📞</span>
            <span>Call</span>
          </a>
        )}
        <a
          href={uberRideUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform"
        >
          <span>🚕</span>
          <span>Uber</span>
        </a>
        {listing.latitude && listing.longitude && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-3.5 rounded-xl bg-gray-100 text-gray-800 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            <span>🧭</span>
          </a>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 sm:flex-row text-xs text-gray-500">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-gray-900">
            locatogo<span className="text-[#e26a4f]">.</span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-gray-600">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Contact Support
            </Link>
          </div>

          <p className="text-gray-400">
            © 2024 locatogo. All rights reserved.
          </p>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
