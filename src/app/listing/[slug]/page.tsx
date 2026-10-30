import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { notFound, redirect, RedirectType } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PlaceMiniMap } from "@/components/place-mini-map";
import { PlaceWeatherBadge } from "@/components/place-weather-badge";
import { PlaceStreetViewButton } from "@/components/place-street-view-modal";
import { PlaceDistanceBadge } from "@/components/place-distance-badge";
import { PlaceGoogleReviews } from "@/components/place-google-reviews";
import { DetailsAutocompleteSearch } from "@/components/details-autocomplete-search";
export const revalidate = 3600;
import { getComprehensiveAboutText } from "@/lib/media/place-overview";
import { fetchPlaceWeather } from "@/lib/services/weather";
import {
  generateUberRideLink,
  generateOlaRideLink,
  generateWhatsAppInquiryLink,
} from "@/lib/services/transit-links";
import { fetchLivePlaceDetails } from "@/lib/media/google-places";
import { WeatherAtmosphereOverlay } from "@/components/weather-atmosphere-overlay";
import { CompanyBrandAvatar } from "@/components/company-brand-avatar";
import { computeLiveOpeningStatus } from "@/lib/services/opening-hours";
import { PlaceReviews } from "@/components/place-reviews-section";
import { NearbyPlaces } from "@/components/nearby-places";
import { ListingViewTracker } from "@/components/listing-view-tracker";
import { AdBannerSlot } from "@/components/ad-banner-slot";
import { SiteFooter } from "@/components/site-footer";
import { DetailActions } from "@/components/detail/detail-actions";
import { DetailHeader } from "@/components/detail/detail-header";
import { BLUR_PLACEHOLDER, DetailHero } from "@/components/detail/detail-hero";
import { DetailStickyBar } from "@/components/detail/detail-sticky-bar";
import { ModuleBoundary } from "@/components/detail/module-boundary";
import { ModuleCard, ModuleSkeleton } from "@/components/detail/module-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowUpRightIcon,
  CarIcon,
  ClockIcon,
  EyeIcon,
  FileTextIcon,
  GlobeIcon,
  MapPinIcon,
  MessageIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
} from "@/components/ui/icons";

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
    .select("*, categories:categories!listings_category_id_fkey(name, slug)");

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

  const { listing } = result;
  if (listing.company_type) {
    redirect(`/company/${listing.slug}`, RedirectType.replace);
  }

  const categoryName = (listing.categories as any)?.name ?? "Place";
  const ogImageUrl = `/api/og?title=${encodeURIComponent(listing.title)}&category=${encodeURIComponent(categoryName)}&locality=${encodeURIComponent(listing.locality || listing.city || "Verified Place")}`;

  return {
    title: `${listing.title} | LocaToGo Atlas`,
    description: listing.short_description ?? listing.description ?? `Explore ${listing.title}.`,
    openGraph: {
      title: `${listing.title} | LocaToGo`,
      description: listing.short_description ?? `Explore ${listing.title}.`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description: listing.short_description ?? `Explore ${listing.title}.`,
      images: [ogImageUrl],
    },
  };
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ListingDetailPage({ params }: Props) {
  const result = await getListing(params);
  if (!result) notFound();

  const { listing, hours, media, reviews, placeDetails, weather } = result;

  // Seamlessly redirect tech companies to dedicated /company/[slug]
  if (listing.company_type) {
    redirect(`/company/${listing.slug}`, RedirectType.replace);
  }

  // Generate Authentic Editorial Overview and Highlights
  const categoryName = (listing.categories as any)?.name ?? "Place";
  const aboutData = getComprehensiveAboutText(
    listing.title,
    categoryName,
    listing.locality,
    listing.short_description,
    listing.description
  );

  // Live Real-Time Opening Status Calculation with Countdown
  const liveOpening = computeLiveOpeningStatus(hours, placeDetails.isOpenNow);

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

  const hasCoordinates = typeof listing.latitude === "number" && typeof listing.longitude === "number";
  const websiteUrl: string | null = placeDetails.websiteUri || listing.website || null;
  const phone: string | null = placeDetails.nationalPhoneNumber || listing.phone || null;
  const coverPhoto = displayPhotos[0] ?? null;
  const galleryPhotos = displayPhotos.slice(1, 6);
  const googleRating = placeDetails.rating && placeDetails.rating > 0 ? placeDetails.rating : null;

  const primaryAction = websiteUrl
    ? { href: websiteUrl, label: "Visit website", icon: <GlobeIcon className="size-4 shrink-0" /> }
    : phone
      ? { href: `tel:${phone}`, label: "Call", icon: <PhoneIcon className="size-4 shrink-0" />, external: false }
      : null;

  const sections = [
    { id: "overview", label: "Overview" },
    ...(galleryPhotos.length > 0 ? [{ id: "photos", label: "Photos" }] : []),
    { id: "contact", label: "Contact", aside: true },
    { id: "hours", label: "Hours", aside: true },
    { id: "reviews", label: "Reviews" },
    { id: "community-reviews", label: "Community" },
    ...(hasCoordinates ? [{ id: "nearby", label: "Nearby" }] : []),
  ];

  const statusVariant: BadgeVariant = liveOpening.dotColorClass.includes("emerald")
    ? "success"
    : liveOpening.dotColorClass.includes("amber")
      ? "warning"
      : liveOpening.dotColorClass.includes("rose")
        ? "danger"
        : "neutral";

  const hoursRows: { day: string; value: ReactNode }[] =
    placeDetails.openingHoursText && placeDetails.openingHoursText.length > 0
      ? placeDetails.openingHoursText.map((dayLine: string) => {
          const [dayName, ...timeRest] = dayLine.split(":");
          return { day: dayName, value: timeRest.join(":").trim() };
        })
      : daysOfWeek.map((day, idx) => {
          const schedule = hours?.find((h: any) => h.day_of_week === idx);
          return {
            day,
            value:
              !schedule || schedule.is_closed ? (
                <span className="text-danger">Closed</span>
              ) : schedule.is_24_hours ? (
                <span className="text-success">Open 24 hours</span>
              ) : (
                `${schedule.open_time || "09:00"} - ${schedule.close_time || "18:00"}`
              ),
          };
        });

  return (
    <div className="flex min-h-dvh flex-col bg-surface-0 text-fg antialiased">
      <DetailHeader
        crumbs={[{ label: "Tech Atlas", href: "/" }, { label: categoryName }, { label: listing.title }]}
        search={<DetailsAutocompleteSearch />}
        cta={{ href: "/", label: "Explore map" }}
      />

      <ListingViewTracker listingId={listing.id} />

      <DetailHero
        cover={coverPhoto ? { src: coverPhoto.url, alt: coverPhoto.alt || listing.title, caption: coverPhoto.caption } : null}
        coverOverlay={weather?.weatherType ? <WeatherAtmosphereOverlay weatherType={weather.weatherType} /> : null}
        coverAction={
          placeDetails.googleMapsUri ? (
            <a
              href={placeDetails.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm", className: "glass" })}
            >
              More photos
              <ArrowUpRightIcon className="size-4" />
            </a>
          ) : null
        }
        avatar={<CompanyBrandAvatar title={listing.title} website={listing.website} size={88} className="rounded-xl" />}
        title={listing.title}
        chips={
          <>
            <Badge variant="accent">{categoryName}</Badge>
            <Badge variant={statusVariant} dot>
              {liveOpening.statusText}
            </Badge>
            {listing.is_featured && (
              <Badge variant="warning" icon={<SparklesIcon className="size-3.5" />}>
                Featured
              </Badge>
            )}
            {listing.verification_status === "verified" && (
              <Badge variant="success" icon={<ShieldCheckIcon className="size-3.5" />}>
                Verified
              </Badge>
            )}
            {googleRating !== null && (
              <a href="#reviews" className="focus-ring rounded-full" title="Jump to reviews">
                <Badge variant="warning" icon={<StarIcon className="size-3.5 fill-current" />}>
                  {googleRating.toFixed(1)}
                  {placeDetails.userRatingCount ? (
                    <span className="opacity-70">({placeDetails.userRatingCount.toLocaleString("en-US")})</span>
                  ) : null}
                </Badge>
              </a>
            )}
          </>
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon className="size-4 shrink-0 text-fg-subtle" />
              {placeDetails.formattedAddress || address || [listing.locality, listing.city].filter(Boolean).join(", ") || "Address not listed"}
            </span>
            {hasCoordinates && <PlaceDistanceBadge latitude={listing.latitude} longitude={listing.longitude} />}
            {weather && <PlaceWeatherBadge weather={weather} locality={listing.locality} compact />}
          </>
        }
        summary={heroSummary}
      />

      <DetailStickyBar sections={sections} className="mt-6">
        <DetailActions
          primary={primaryAction}
          listingId={listing.id}
          shareTitle={`${listing.title} on LocaToGo`}
          latitude={listing.latitude}
          longitude={listing.longitude}
        />
      </DetailStickyBar>

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-[minmax(0,1fr)] items-start gap-8 px-4 pb-28 pt-8 sm:px-6 lg:pb-16 lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:px-8">
        <div className="min-w-0 space-y-6">
          <ModuleCard
            id="overview"
            icon={<FileTextIcon />}
            title="Overview"
            description={`What ${listing.title} is for and who it serves`}
          >
            <div className="max-w-[65ch] space-y-4 leading-relaxed text-fg-muted">
              <p className="text-pretty text-fg">{aboutData.overview}</p>
              {listing.description && listing.description !== aboutData.overview && (
                <p className="whitespace-pre-line text-pretty border-t border-line pt-4">{listing.description}</p>
              )}
            </div>

            {aboutData.keyFacts.length > 0 && (
              <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
                {aboutData.keyFacts.map((fact: { label: string; value: string }) => (
                  <div key={fact.label} className="flex items-center justify-between gap-3 bg-surface-1 px-4 py-3 text-sm">
                    <dt className="text-fg-muted">{fact.label}</dt>
                    <dd className="text-right font-medium text-fg">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {aboutData.highlights.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-fg">Amenities and highlights</h3>
                <ul role="list" className="mt-3 flex flex-wrap gap-2">
                  {aboutData.highlights.map((highlight: string) => (
                    <li key={highlight} className="rounded-lg border border-line bg-surface-3 px-2.5 py-1 text-sm text-fg-muted">
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ModuleCard>

          {galleryPhotos.length > 0 && (
            <ModuleCard id="photos" icon={<EyeIcon />} title="Photos" description={`${displayPhotos.length} from Google Maps and the community`}>
              <ul role="list" className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {galleryPhotos.map((photo, index) => (
                  <li
                    key={`${photo.url}-${index}`}
                    className={`relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface-3 ${index === 0 ? "col-span-2 md:row-span-2 md:aspect-auto" : ""}`}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.alt || listing.title}
                      fill
                      unoptimized
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                      sizes="(min-width: 1024px) 400px, 50vw"
                      className="object-cover transition-transform duration-500 ease-emphasized motion-safe:hover:scale-[1.03]"
                    />
                  </li>
                ))}
              </ul>
            </ModuleCard>
          )}

          <ModuleBoundary title="Visitor reviews">
            <PlaceGoogleReviews
              id="reviews"
              reviews={placeDetails.reviews}
              rating={placeDetails.rating}
              userRatingCount={placeDetails.userRatingCount}
              placeTitle={listing.title}
              categoryName={categoryName}
              locality={listing.locality}
            />
          </ModuleBoundary>

          <PlaceReviews id="community-reviews" listingId={listing.id} initialReviews={reviews} />

          {hasCoordinates && (
            <ModuleBoundary title="Nearby places">
              <Suspense fallback={<ModuleSkeleton lines={3} />}>
                <NearbyPlaces
                  listingId={listing.id}
                  categoryId={listing.category_id}
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                />
              </Suspense>
            </ModuleBoundary>
          )}

          <AdBannerSlot placementLocation="detail_bottom" variant="detail_bottom" categoryId={listing.category_id} />
        </div>

        <aside aria-label="Contact, hours and map" className="space-y-6 lg:sticky lg:top-36 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:[scrollbar-width:thin]">
          {weather && <PlaceWeatherBadge id="weather" weather={weather} locality={listing.locality} />}

          <ModuleCard id="contact" icon={<MapPinIcon />} title="Contact and travel" description={listing.locality || listing.city || undefined}>
            {hasCoordinates && (
              <PlaceMiniMap
                listing={{ ...listing, latitude: listing.latitude, longitude: listing.longitude }}
                weatherType={weather?.weatherType}
              />
            )}
            {hasCoordinates && (
              <p className="mt-3 font-mono text-xs text-fg-subtle">
                {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
              </p>
            )}

            <div className="mt-4 grid gap-2">
              {phone && (
                <a
                  data-analytics-event="phone_click"
                  href={`tel:${phone}`}
                  className={buttonVariants({ variant: "secondary", fullWidth: true })}
                >
                  <PhoneIcon className="size-4" />
                  Call {phone}
                </a>
              )}
              {whatsappUrl && (
                <a
                  data-analytics-event="whatsapp_click"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "secondary", fullWidth: true })}
                >
                  <MessageIcon className="size-4" />
                  WhatsApp
                </a>
              )}
              {hasCoordinates && (
                <div className="grid grid-cols-2 gap-2">
                  <a href={uberRideUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary" })}>
                    <CarIcon className="size-4" />
                    Uber
                  </a>
                  <a href={olaRideUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary" })}>
                    <CarIcon className="size-4" />
                    Ola
                  </a>
                </div>
              )}
              {hasCoordinates && (
                <PlaceStreetViewButton latitude={listing.latitude} longitude={listing.longitude} title={listing.title} />
              )}
            </div>
          </ModuleCard>

          <ModuleCard
            id="hours"
            icon={<ClockIcon />}
            title="Opening hours"
            action={<Badge variant={statusVariant}>{liveOpening.statusBadge}</Badge>}
          >
            <dl className="divide-y divide-line text-sm">
              {hoursRows.map((row) => (
                <div key={row.day} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-fg-muted">{row.day}</dt>
                  <dd className="font-medium text-fg">{row.value}</dd>
                </div>
              ))}
            </dl>
          </ModuleCard>

          <AdBannerSlot placementLocation="sidebar" variant="sidebar" categoryId={listing.category_id} />

          <div className="rounded-2xl border border-dashed border-line-strong bg-surface-1 p-5 text-center sm:p-6">
            <span className="mx-auto grid size-10 place-items-center rounded-xl bg-accent-soft text-xl text-accent-text">
              <ShieldCheckIcon />
            </span>
            <h2 className="mt-3 font-display text-base font-semibold tracking-tight text-fg">Own or manage this place?</h2>
            <p className="mt-1 text-sm text-fg-muted">Claim the listing to update details, add photos and keep hours accurate.</p>
            <Link href={`/listing/${listing.slug}/claim`} className={buttonVariants({ fullWidth: true, className: "mt-4" })}>
              Claim this listing
            </Link>
          </div>
        </aside>
      </div>

      <SiteFooter />
      <div aria-hidden="true" className="h-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
