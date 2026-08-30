import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PlaceMiniMap } from "@/components/place-mini-map";
import { PlaceWeatherBadge } from "@/components/place-weather-badge";
import { PlaceStreetViewButton } from "@/components/place-street-view-modal";
import { PlaceDistanceBadge } from "@/components/place-distance-badge";
import { PlaceGoogleReviews } from "@/components/place-google-reviews";
import { DetailsAutocompleteSearch } from "@/components/details-autocomplete-search";
import { getComprehensiveAboutText } from "@/lib/media/place-overview";
import { fetchPlaceWeather } from "@/lib/services/weather";
import {
  generateUberRideLink,
  generateOlaRideLink,
  generateWhatsAppInquiryLink,
} from "@/lib/services/transit-links";
import { fetchLivePlaceDetails } from "@/lib/media/google-places";
import { ShareButton } from "@/components/share-button";
import { FavoriteButton } from "@/components/favorite-button";
import { WeatherAtmosphereOverlay } from "@/components/weather-atmosphere-overlay";
import { PlaceReviews } from "@/components/place-reviews-section";
import { NearbyPlaces } from "@/components/nearby-places";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getListing(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("listings")
    .select("*, categories:categories!listings_category_id_domain_id_fkey(name, slug)");

  if (isUuid) {
    query = query.or(`slug.eq.${cleanSlug},slug.ilike.${cleanSlug},id.eq.${cleanSlug}`);
  } else {
    query = query.or(`slug.eq.${cleanSlug},slug.ilike.${cleanSlug}`);
  }

  const { data: listing } = await query.limit(1).maybeSingle();

  if (!listing) return null;

  const [{ data: hours }, { data: links }, { data: media }, { data: reviews }, placeDetails, weather] =
    await Promise.all([
      supabase
        .from("listing_hours")
        .select("*")
        .eq("listing_id", listing.id)
        .order("day_of_week", { ascending: true }),
      supabase.from("listing_social_links").select("*").eq("listing_id", listing.id),
      supabase
        .from("listing_media")
        .select("*")
        .eq("listing_id", listing.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("place_reviews")
        .select("id, user_id, rating, body, created_at")
        .eq("listing_id", listing.id)
        .order("created_at", { ascending: false }),
      fetchLivePlaceDetails(listing.title, listing.locality, listing.latitude, listing.longitude),
      listing.latitude && listing.longitude
        ? fetchPlaceWeather(listing.latitude, listing.longitude)
        : Promise.resolve(null),
    ]);

  return { listing, hours, links, media, reviews: reviews ?? [], placeDetails, weather };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getListing(params);
  if (!result) return { title: "Listing not found" };
  return {
    title: `${result.listing.title} | Locatogo Atlas`,
    description: result.listing.short_description ?? result.listing.description ?? `Explore ${result.listing.title}.`,
  };
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ListingDetailPage({ params }: Props) {
  const result = await getListing(params);
  if (!result) notFound();

  const { listing, hours, media, reviews, placeDetails, weather } = result;

  // Generate Authentic Editorial Overview and Highlights
  const categoryName = (listing.categories as any)?.name ?? "Place";
  const aboutData = getComprehensiveAboutText(
    listing.title,
    categoryName,
    listing.locality,
    listing.short_description,
    listing.description
  );

  // High-Resolution Authentic Photos
  const displayPhotos =
    placeDetails.photos.length > 0
      ? placeDetails.photos
      : (media ?? []).map((m: any) => ({
          url: m.public_url || m.url,
          alt: m.alt_text || listing.title,
          caption: m.caption || listing.title,
          source: "curated" as const,
        }));

  // Construct Transit & 1-Click Ride Hailing Deep Links
  const uberRideUrl = generateUberRideLink(
    listing.latitude ?? undefined,
    listing.longitude ?? undefined,
    listing.title,
    listing.locality
  );
  const olaRideUrl = generateOlaRideLink(
    listing.latitude ?? undefined,
    listing.longitude ?? undefined,
    listing.title,
    listing.locality
  );
  const whatsappUrl = generateWhatsAppInquiryLink(
    listing.whatsapp || listing.phone,
    listing.title,
    categoryName
  );

  const address = [
    listing.address_line_1,
    listing.address_line_2,
    listing.locality,
    listing.city,
    listing.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  const heroSummary =
    listing.short_description ||
    placeDetails.editorialSummary ||
    aboutData.overview ||
    listing.description ||
    `Verified local infrastructure in ${listing.locality || listing.city || "the area"}.`;

  // JSON-LD structured data for local business SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.title,
    description: heroSummary,
    image: displayPhotos.map((p: any) => p.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address_line_1,
      addressLocality: listing.locality,
      addressRegion: listing.city,
      postalCode: listing.postal_code,
      addressCountry: listing.country_code,
    },
    ...(listing.latitude &&
      listing.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: listing.latitude,
          longitude: listing.longitude,
        },
      }),
    ...(listing.phone && { telephone: listing.phone }),
    ...(listing.website && { url: listing.website }),
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fdfdfd] font-sans antialiased text-[#111827]">
      {/* Top Navbar with Autocomplete Search */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-2xs">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-3">
          {/* Logo & Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/" className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              locatogo<span className="text-[#e26a4f]">.</span>
            </Link>
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-50/60 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
              <span className="text-xs">📍</span>
              <span>Global Atlas</span>
            </div>
          </div>

          {/* Autocomplete Search Bar in Navbar */}
          <div className="flex-1 max-w-[200px] xs:max-w-[260px] sm:max-w-md mx-1 sm:mx-2 flex justify-center">
            <DetailsAutocompleteSearch />
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/"
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Explore Map
            </Link>
            <Link
              href="/admin/listings"
              className="rounded-xl bg-[#111827] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-black transition-colors shadow-xs"
            >
              + Add Place
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 lg:pb-12">
        {/* Back Link & Quick Weather / Distance Banner */}
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-950 transition-colors"
          >
            <span>←</span>
            <span>Back to Live Atlas</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            {listing.latitude && listing.longitude && (
              <PlaceDistanceBadge
                latitude={listing.latitude}
                longitude={listing.longitude}
              />
            )}
            {weather && (
              <PlaceWeatherBadge weather={weather} locality={listing.locality} compact />
            )}
          </div>
        </div>

        {/* 1. HERO SHOWCASE CARD */}
        <section className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-xs mb-6 sm:mb-8">
          {/* Category & Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="rounded bg-blue-50/90 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                {categoryName}
              </span>

              {/* Live Open Now / Closed Status Badge */}
              {placeDetails.isOpenNow !== undefined && (
                <span
                  className={`rounded border px-2.5 py-0.5 text-[10px] font-bold ${
                    placeDetails.isOpenNow
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-rose-50 border-rose-300 text-rose-800"
                  }`}
                >
                  {placeDetails.isOpenNow ? "🟢 Open Now" : "🔴 Closed"}
                </span>
              )}

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
                  <span>{placeDetails.rating.toFixed(1)}</span>
                  {placeDetails.userRatingCount && (
                    <span className="text-[9px] text-amber-800/80">
                      ({placeDetails.userRatingCount.toLocaleString()})
                    </span>
                  )}
                </span>
              )}
            </div>

            <Link
              href={`/listing/${listing.slug}/claim`}
              className="text-xs font-bold text-[#e26a4f] hover:underline flex items-center gap-1"
            >
              <span>🏷️ Claim</span>
            </Link>
          </div>

          {/* Main Title & Locality Subtitle */}
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

          {/* Action Button Bar with Transit & WhatsApp Integration (Scrollable on Mobile) */}
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

            {/* Phone Call */}
            {(placeDetails.nationalPhoneNumber || listing.phone) && (
              <a
                href={`tel:${placeDetails.nationalPhoneNumber || listing.phone}`}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs shrink-0"
              >
                <span>📞</span>
                <span>Call {placeDetails.nationalPhoneNumber || listing.phone}</span>
              </a>
            )}

            {/* 1-Click Cab Booking: Uber */}
            <a
              href={uberRideUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-gray-900 bg-gray-950 px-3.5 sm:px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors shadow-2xs shrink-0"
            >
              <span>🚕</span>
              <span>Uber</span>
            </a>

            {/* 1-Click Cab Booking: Ola */}
            <a
              href={olaRideUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-lime-400 bg-lime-50 px-3.5 sm:px-4 py-2 text-xs font-bold text-lime-900 hover:bg-lime-100 transition-colors shadow-2xs shrink-0"
            >
              <span>🛺</span>
              <span>Ola</span>
            </a>

            {/* Google Street View 360 Look Around */}
            {listing.latitude && listing.longitude && (
              <PlaceStreetViewButton
                latitude={listing.latitude}
                longitude={listing.longitude}
                title={listing.title}
              />
            )}

            {/* Official Website */}
            {(placeDetails.websiteUri || listing.website) && (
              <a
                href={placeDetails.websiteUri || listing.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs shrink-0"
              >
                <span>🌐</span>
                <span>Website</span>
              </a>
            )}

            {/* Live Navigation */}
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

            {/* Share Place */}
            <ShareButton title={listing.title} className="rounded-full! shrink-0" />

            {/* Save / Favorite */}
            <FavoriteButton listingId={listing.id} showCount className="rounded-full! shrink-0" />
          </div>
        </section>

        {/* 2. PHOTO MOSAIC SHOWCASE (MOBILE OPTIMIZED) */}
        <section className="mb-6 sm:mb-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Main Featured Hero Photo */}
            <div className="md:col-span-2 relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 bg-gray-100 shadow-xs group">
              <img
                src={displayPhotos[0]?.url || "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80"}
                alt={displayPhotos[0]?.alt || listing.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {weather?.weatherType && (
                <WeatherAtmosphereOverlay weatherType={weather.weatherType} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 sm:p-5 pointer-events-none">
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

            {/* Secondary Photo Stack */}
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
                {placeDetails.googleMapsUri && (
                  <a
                    href={placeDetails.googleMapsUri}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white text-[11px] sm:text-xs font-bold hover:bg-black/40 transition-colors p-2 text-center"
                  >
                    <span>📸 View Photos in Maps ↗</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. TWO-COLUMN EDITORIAL CONTENT GRID */}
        <section className="w-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* LEFT: WHAT THIS PLACE IS FOR / ABOUT & REVIEWS */}
          <div className="space-y-6">
            {/* OVERVIEW & PURPOSE CARD */}
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

              {/* Quick Facts Grid */}
              <div className="mt-6 sm:mt-8 rounded-2xl bg-gray-50/80 border border-gray-200/80 p-4 sm:p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Overview & Key Facts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                  {aboutData.keyFacts.map((fact: { label: string; value: string }, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100">
                      <span className="text-gray-500">{fact.label}:</span>
                      <span className="font-semibold text-gray-900">{fact.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights & Features */}
              <div className="mt-6 sm:mt-8 border-t border-gray-100 pt-5 sm:pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Key Amenities & Highlights
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs">
                  {aboutData.highlights.map((highlight: string, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-xl bg-gray-50 border border-gray-200/80 px-3 py-1.5 font-medium text-gray-700 shadow-2xs"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* REAL COMMUNITY & GOOGLE REVIEWS CARD */}
            <PlaceGoogleReviews
              reviews={placeDetails.reviews}
              rating={placeDetails.rating}
              userRatingCount={placeDetails.userRatingCount}
              placeTitle={listing.title}
              categoryName={categoryName}
              locality={listing.locality}
            />

            {/* DETAILED CATEGORY SECTIONS (Schools, Hospitals, Tech Parks) */}
            {categoryName.toLowerCase().includes("school") && (
              <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-gray-950 mb-2 flex items-center gap-2">
                  <span>🎓</span>
                  <span>Curriculum & Academic Environment</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Equipped with modern laboratories, expansive sporting grounds, smart classrooms, and dedicated extracurricular clubs designed to support holistic student development in Bangalore.
                </p>
              </div>
            )}

            {categoryName.toLowerCase().includes("hospital") && (
              <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-gray-950 mb-2 flex items-center gap-2">
                  <span>➕</span>
                  <span>Medical Specialties & Emergency Care</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Features 24x7 emergency response units, advanced diagnostic imaging, specialized intensive care, and a team of multi-disciplinary physicians providing quality healthcare services.
                </p>
              </div>
            )}

            {categoryName.toLowerCase().includes("tech") && (
              <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-gray-950 mb-2 flex items-center gap-2">
                  <span>💻</span>
                  <span>Campus Infrastructure & Amenities</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  World-class technology campus offering redundant power grids, high-speed fiber connectivity, multi-cuisine food courts, EV charging stations, and dedicated multi-level parking.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: MAP, LIVE WEATHER & TRANSIT SIDEBAR */}
          <div className="space-y-6">
            {/* Live Weather & AQI Card */}
            {weather && (
              <PlaceWeatherBadge weather={weather} locality={listing.locality} />
            )}

            {/* Live Interactive Map Widget Card */}
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
                    weatherType={weather?.weatherType}
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

            {/* Operating Hours Card */}
            <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-gray-950 flex items-center gap-1.5">
                  <span>⏰</span>
                  <span>Operating Schedule</span>
                </h3>
                {placeDetails.isOpenNow !== undefined && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    placeDetails.isOpenNow ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {placeDetails.isOpenNow ? "Open" : "Closed"}
                  </span>
                )}
              </div>

              {/* Show Google Verified Opening Hours if present */}
              {placeDetails.openingHoursText && placeDetails.openingHoursText.length > 0 ? (
                <div className="mt-4 divide-y divide-gray-100 text-xs">
                  {placeDetails.openingHoursText.map((dayLine: string, idx: number) => {
                    const [dayName, ...timeRest] = dayLine.split(":");
                    const timeStr = timeRest.join(":").trim();
                    return (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <span className="font-medium text-gray-700">{dayName}</span>
                        <span className="text-gray-600 font-semibold">{timeStr}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 divide-y divide-gray-100 text-xs">
                  {daysOfWeek.map((day, idx) => {
                    const schedule = hours?.find((h: any) => h.day_of_week === idx);
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
              )}
            </div>

            {/* Claim Card */}
            <div className="rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 bg-white p-5 sm:p-6 text-center shadow-xs">
              <span className="text-2xl">🤝</span>
              <h4 className="font-serif text-sm font-bold text-gray-900 mt-2">
                Own or Manage this Place?
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Claim this official listing to manage profile details, upload more photos, and update contact hours.
              </p>
              <Link
                href={`/listing/${listing.slug}/claim`}
                className="mt-4 inline-block w-full rounded-xl bg-gray-900 py-2.5 text-xs font-bold text-white hover:bg-black transition-colors"
              >
                Claim Listing Profile →
              </Link>
            </div>
          </div>
        </section>

        {/* 6. COMMUNITY REVIEWS & RATINGS */}
        <PlaceReviews listingId={listing.id} initialReviews={reviews} />

        {/* 7. NEARBY PLACES WIDGET */}
        {listing.latitude && listing.longitude && (
          <NearbyPlaces
            listingId={listing.id}
            categoryId={listing.category_id}
            latitude={listing.latitude}
            longitude={listing.longitude}
          />
        )}
      </main>

      {/* Floating Bottom Quick-Action Bar for Mobile Devices */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md p-3 sm:hidden flex items-center justify-between gap-2 shadow-lg">
        {listing.phone && (
          <a
            href={`tel:${listing.phone}`}
            className="flex-1 rounded-xl bg-gray-900 py-2.5 text-center text-xs font-bold text-white shadow-xs"
          >
            Call 📞
          </a>
        )}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-bold text-white shadow-xs"
          >
            WhatsApp 💬
          </a>
        )}
        {listing.latitude && listing.longitude && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl bg-[#e26a4f] py-2.5 text-center text-xs font-bold text-white shadow-xs"
          >
            Navigate 🧭
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
            <Link href="/about" className="hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">
              Contact Support
            </Link>
          </div>

          <p className="text-gray-400">
            © 2026 locatogo. All rights reserved.
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
