import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ domain: string; slug: string }> };

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function getListing(params: Props["params"]) {
  const { domain, slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: directory } = await supabase
    .from("domains")
    .select("id, name, slug")
    .eq("slug", domain)
    .eq("status", "published")
    .single();
  if (!directory) return null;

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, slug, short_description, description, address_line_1, address_line_2, city, administrative_area, country_code, postal_code, website, phone, email, whatsapp, latitude, longitude, verification_status, is_featured, categories:categories!listings_category_id_domain_id_fkey(name)")
    .eq("domain_id", directory.id)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!listing) return null;

  const [{ data: hours }, { data: links }, { data: media }] = await Promise.all([
    supabase.from("listing_hours").select("day_of_week, is_closed, is_24_hours, open_time, close_time").eq("listing_id", listing.id).order("day_of_week"),
    supabase.from("listing_social_links").select("platform, url").eq("listing_id", listing.id),
    supabase.from("listing_media").select("id, media_type, public_url, alt_text").eq("listing_id", listing.id).order("sort_order"),
  ]);

  return { directory, listing, hours, links, media };
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
      <main className="flex min-h-screen flex-col items-center justify-center p-10 text-center bg-[var(--background)]">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Place Not Found</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">This listing is unavailable or has been archived.</p>
        <Link href="/" className="mt-6 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-semibold text-[var(--paper)]">
          Back to Home
        </Link>
      </main>
    );
  }

  const { directory, listing, hours, links, media } = result;
  const categoryName = Array.isArray(listing.categories)
    ? listing.categories[0]?.name
    : (listing.categories as { name?: string } | null)?.name || "General";

  const address = [
    listing.address_line_1,
    listing.address_line_2,
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
      addressLocality: listing.city,
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
            <Link href={`/${directory.slug}`} className="hover:text-[var(--foreground)] transition-colors">
              {directory.name}
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)] truncate max-w-[180px]">{listing.title}</span>
          </div>

          <Link
            href={`/${directory.slug}`}
            className="rounded-full border border-[var(--line)] bg-[var(--background)] px-3.5 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)] transition-colors"
          >
            ← Back to directory
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <article className="mx-auto max-w-[1200px] w-full px-5 py-10 sm:px-10 flex-1">
        {/* Title Header Card */}
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--leaf)] px-3 py-1 text-xs font-bold text-[var(--leaf-dark)]">
              {categoryName}
            </span>
            {listing.is_featured && (
              <span className="rounded-full bg-[var(--coral-soft)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--coral)]">
                ★ Featured Place
              </span>
            )}
            {listing.verification_status === "verified" && (
              <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs font-bold">
                ✓ Verified Business
              </span>
            )}
          </div>

          <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-6xl">
            {listing.title}
          </h1>

          {listing.short_description && (
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--ink-muted)]">
              {listing.short_description}
            </p>
          )}

          {/* Action Button Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-6">
            {listing.website && (
              <a
                href={listing.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-bold text-[var(--paper)] shadow transition-all hover:bg-[var(--foreground)]/80"
              >
                🌐 Visit Website
              </a>
            )}
            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--background)] px-5 py-2.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)] transition-colors"
              >
                📞 Call {listing.phone}
              </a>
            )}
            {listing.email && (
              <a
                href={`mailto:${listing.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--background)] px-5 py-2.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)] transition-colors"
              >
                ✉️ Email Place
              </a>
            )}
            <Link
              href={`/${directory.slug}/listing/${listing.slug}/claim`}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-[var(--coral)] hover:underline"
            >
              🏷️ Claim this listing
            </Link>
          </div>
        </div>

        {/* Two-Column Details Layout */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          {/* Left Column: About, Photos, Social */}
          <div className="space-y-8">
            <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-8 shadow-xs">
              <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">About this place</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-[var(--ink-muted)]">
                {listing.description || "No extended overview provided yet. Visit this place or contact them directly for full details."}
              </p>
            </section>

            {/* Media Gallery if available */}
            {media && media.length > 0 && (
              <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-8 shadow-xs">
                <h2 className="font-display text-2xl font-bold text-[var(--foreground)]">Photos & Media</h2>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {media.map((item) => (
                    <div key={item.id} className="relative aspect-video overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--background)]">
                      {item.public_url ? (
                        <img
                          src={item.public_url}
                          alt={item.alt_text || listing.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-[var(--ink-muted)] font-mono">
                          {item.media_type}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Social Links */}
            {links && links.length > 0 && (
              <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 shadow-xs">
                <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Online Presence</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {links.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--line)] bg-[var(--background)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors"
                    >
                      {link.platform} ↗
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Address, Hours & Claim Widget */}
          <div className="space-y-6">
            {/* Address & Location Card */}
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--coral)]">Location</p>
              <h3 className="mt-2 font-display text-xl font-bold text-[var(--foreground)]">Address</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{address}</p>

              {listing.latitude && listing.longitude && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--background)] p-4 text-center">
                  <p className="text-xs font-mono text-[var(--ink-muted)]">
                    {listing.latitude.toFixed(5)}, {listing.longitude.toFixed(5)}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block rounded-full bg-[var(--foreground)] px-4 py-1.5 text-xs font-semibold text-[var(--paper)]"
                  >
                    Open in Maps ↗
                  </a>
                </div>
              )}
            </div>

            {/* Operating Hours Card */}
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--coral)]">Schedule</p>
              <h3 className="mt-2 font-display text-xl font-bold text-[var(--foreground)]">Opening Hours</h3>

              {hours && hours.length > 0 ? (
                <div className="mt-4 space-y-2 text-sm divide-y divide-[var(--line)]">
                  {hours.map((hour) => (
                    <div key={hour.day_of_week} className="flex justify-between pt-2 first:pt-0">
                      <span className="font-medium text-[var(--foreground)]">
                        {daysOfWeek[hour.day_of_week] || `Day ${hour.day_of_week}`}
                      </span>
                      <span className="text-[var(--ink-muted)]">
                        {hour.is_closed ? "Closed" : hour.is_24_hours ? "Open 24 hours" : `${hour.open_time} – ${hour.close_time}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--ink-muted)]">Opening hours not yet published for this listing.</p>
              )}
            </div>

            {/* Claim Listing Promo Card */}
            <div className="rounded-3xl bg-[var(--leaf)] p-7 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--leaf-dark)]">Business Owner?</p>
              <h3 className="mt-2 font-display text-xl font-bold text-[var(--foreground)]">Claim this business</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--ink-muted)]">
                Verify your ownership to edit operating hours, upload photos, and manage direct inquiries from visitors.
              </p>
              <Link
                href={`/${directory.slug}/listing/${listing.slug}/claim`}
                className="mt-5 inline-block rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-semibold text-[var(--paper)] hover:bg-[var(--foreground)]/80 transition-colors"
              >
                Verify & Claim Listing
              </Link>
            </div>
          </div>
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
