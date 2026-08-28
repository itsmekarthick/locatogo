import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function getListing(params: Props["params"]) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("id, domain_id, title, slug, short_description, description, address_line_1, address_line_2, locality, city, administrative_area, country_code, postal_code, website, phone, email, whatsapp, latitude, longitude, verification_status, is_featured, categories:categories!listings_category_id_domain_id_fkey(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  if (!listing) return null;

  const [{ data: hours }, { data: links }, { data: media }] = await Promise.all([
    supabase.from("listing_hours").select("day_of_week, is_closed, is_24_hours, open_time, close_time").eq("listing_id", listing.id).order("day_of_week"),
    supabase.from("listing_social_links").select("platform, url").eq("listing_id", listing.id),
    supabase.from("listing_media").select("id, media_type, public_url, alt_text").eq("listing_id", listing.id).order("sort_order"),
  ]);

  return { listing, hours, links, media };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getListing(params);
  if (!result) return { title: "Listing not found" };
  return {
    title: `${result.listing.title} | Mapora Atlas`,
    description: result.listing.short_description ?? result.listing.description ?? `Explore ${result.listing.title}.`,
  };
}

export default async function DirectListingPage({ params }: Props) {
  const result = await getListing(params);
  if (!result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-10 text-center bg-[var(--background)]">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Place Not Found</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">This listing is unavailable or has been archived.</p>
        <Link href="/" className="mt-6 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-semibold text-[var(--paper)]">
          Back to Live Atlas
        </Link>
      </main>
    );
  }

  const { listing, hours, links, media } = result;
  const categoryName = Array.isArray(listing.categories)
    ? listing.categories[0]?.name
    : (listing.categories as { name?: string } | null)?.name || "General";

  const address = [
    listing.address_line_1,
    listing.address_line_2,
    listing.locality,
    listing.city,
    listing.administrative_area,
    listing.country_code,
    listing.postal_code,
  ].filter(Boolean).join(", ");

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
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Top Breadcrumb Navigation */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)]">
            <Link href="/" className="font-display text-base font-bold text-[var(--foreground)] mr-2">
              mapora<span className="text-[var(--coral)]">.</span>
            </Link>
            <span>/</span>
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
              Atlas
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)] font-bold truncate max-w-[200px]">{listing.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)]/40 transition-colors"
            >
              🗺️ Open Map
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-8 sm:px-10 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left Column: Place Details & Description */}
          <div className="space-y-8">
            {/* Header Hero Card */}
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--leaf)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--leaf-dark)]">
                  {categoryName}
                </span>
                {listing.verification_status === "verified" && (
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    ✓ Verified Place
                  </span>
                )}
                {listing.is_featured && (
                  <span className="rounded-full bg-[var(--coral-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--coral)]">
                    ★ Featured
                  </span>
                )}
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
                {listing.title}
              </h1>

              <p className="mt-2 text-xs text-[var(--ink-muted)] flex items-center gap-1.5 font-medium">
                <span>📍 {address}</span>
              </p>

              {listing.short_description && (
                <p className="mt-4 text-base font-medium text-[var(--foreground)]/90 leading-relaxed">
                  {listing.short_description}
                </p>
              )}

              {/* Action Buttons Row */}
              <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--line)] pt-6">
                {listing.website && (
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-bold text-[var(--paper)] shadow-xs hover:bg-[var(--foreground)]/85 transition-all"
                  >
                    Visit Website ↗
                  </a>
                )}
                {listing.phone && (
                  <a
                    href={`tel:${listing.phone}`}
                    className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                  >
                    📞 Call {listing.phone}
                  </a>
                )}
                {listing.email && (
                  <a
                    href={`mailto:${listing.email}`}
                    className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                  >
                    ✉️ Send Email
                  </a>
                )}
                {listing.latitude && listing.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
                  >
                    🧭 Get Directions
                  </a>
                )}
              </div>
            </div>

            {/* About / Long Description */}
            {listing.description && (
              <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
                <h2 className="font-display text-xl font-bold text-[var(--foreground)]">About this place</h2>
                <div className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--foreground)]/80">
                  {listing.description}
                </div>
              </div>
            )}

            {/* Photos & Media Gallery */}
            {media && media.length > 0 && (
              <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
                <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Photos & Gallery</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {media.map((item) => (
                    <div key={item.id} className="group relative aspect-4/3 overflow-hidden rounded-2xl bg-[var(--background)]">
                      <img
                        src={item.public_url}
                        alt={item.alt_text || listing.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Key Details & Operating Hours */}
          <div className="space-y-6">
            {/* Hours Card */}
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
              <h3 className="font-display text-base font-bold text-[var(--foreground)]">Operating Hours</h3>
              <div className="mt-4 divide-y divide-[var(--line)]">
                {daysOfWeek.map((day, idx) => {
                  const schedule = hours?.find((h) => h.day_of_week === idx);
                  return (
                    <div key={day} className="flex items-center justify-between py-2 text-xs">
                      <span className="font-medium text-[var(--foreground)]">{day}</span>
                      <span className="text-[var(--ink-muted)]">
                        {!schedule || schedule.is_closed ? (
                          <span className="text-red-600 font-semibold">Closed</span>
                        ) : schedule.is_24_hours ? (
                          <span className="text-emerald-600 font-semibold">Open 24 Hours</span>
                        ) : (
                          `${schedule.open_time || "09:00"} - ${schedule.close_time || "18:00"}`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location & GPS Info Card */}
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
              <h3 className="font-display text-base font-bold text-[var(--foreground)]">Location Coordinates</h3>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">{address}</p>

              {listing.latitude && listing.longitude ? (
                <div className="mt-4 rounded-2xl bg-[var(--background)] p-3 font-mono text-xs text-[var(--foreground)] flex justify-between">
                  <span>GPS:</span>
                  <span className="font-bold text-emerald-700">
                    {listing.latitude.toFixed(5)}, {listing.longitude.toFixed(5)}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Claim / Manage Listing Card */}
            <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-6 text-center shadow-xs">
              <span className="text-2xl">🤝</span>
              <h4 className="mt-2 font-display text-sm font-bold text-[var(--foreground)]">Own or manage this place?</h4>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                Claim this official listing to manage profile details, update photos, and add contact hours.
              </p>
              <Link
                href={`/${listing.slug}/claim`}
                className="mt-4 inline-block rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--paper)] shadow-xs"
              >
                Claim This Listing
              </Link>
            </div>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}

