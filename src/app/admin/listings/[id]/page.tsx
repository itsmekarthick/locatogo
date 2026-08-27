import Link from "next/link";
import {
  findDuplicateListings,
  saveHours,
  saveSocialLink,
  updateListing,
  uploadListingMedia,
} from "@/app/admin/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, tenant } = await requireTenantContext();

  const [
    { data: listing },
    { data: domains },
    { data: categories },
    { data: hours },
    { data: links },
    { data: media },
    { data: audit },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, domain_id, category_id, title, slug, short_description, description, address_line_1, address_line_2, locality, city, administrative_area, country_code, postal_code, latitude, longitude, website, email, phone, status, verification_status, is_featured, domains(name, slug)"
      )
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .single(),
    supabase.from("domains").select("id, name").eq("tenant_id", tenant.id).order("name"),
    supabase.from("categories").select("id, name").eq("tenant_id", tenant.id).order("name"),
    supabase
      .from("listing_hours")
      .select("day_of_week, is_closed, is_24_hours, open_time, close_time")
      .eq("listing_id", id)
      .eq("tenant_id", tenant.id)
      .order("day_of_week"),
    supabase
      .from("listing_social_links")
      .select("platform, url")
      .eq("listing_id", id)
      .eq("tenant_id", tenant.id),
    supabase
      .from("listing_media")
      .select("id, media_type, mime_type, file_size, alt_text, public_url")
      .eq("listing_id", id)
      .eq("tenant_id", tenant.id)
      .order("sort_order"),
    supabase
      .from("listing_audit_logs")
      .select("action, created_at")
      .eq("entity_id", id)
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!listing) {
    return (
      <div>
        <p className="text-[var(--coral)] font-semibold">Listing not found or you do not have permission to view it.</p>
        <Link href="/admin/listings" className="mt-4 inline-block text-xs font-bold text-[var(--foreground)] hover:underline">
          ← Back to listings
        </Link>
      </div>
    );
  }

  const duplicates = await findDuplicateListings(listing.title, listing.phone ?? undefined);
  const domain = Array.isArray(listing.domains) ? listing.domains[0] : (listing.domains as { name?: string; slug?: string } | null);

  return (
    <div className="space-y-10">
      {/* Top Header & Breadcrumb */}
      <div>
        <Link
          href="/admin/listings"
          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to all listings
        </Link>
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--leaf-dark)]">
                {domain?.name || "Atlas"}
              </span>
              <span className="rounded-full bg-[var(--coral-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--coral)] capitalize">
                {listing.status.replace("_", " ")}
              </span>
              {listing.is_featured && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                  ★ Featured
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl">
              {listing.title}
            </h1>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              {[listing.locality, listing.city, listing.administrative_area].filter(Boolean).join(", ")} · slug: /{listing.slug}
            </p>
          </div>

          {domain?.slug && listing.slug && (
            <Link
              href={`/${domain.slug}/listing/${listing.slug}`}
              target="_blank"
              className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-semibold text-[var(--coral)] hover:bg-[var(--line)]/50 transition-colors shadow-xs"
            >
              Preview Public Place ↗
            </Link>
          )}
        </div>
      </div>

      {/* FULL EDIT LISTING & MAP COORDINATES FORM */}
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Edit Listing & Coordinates</h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Update title, taxonomy, address, and pinpoint GPS coordinates.</p>
          </div>
          <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-mono text-[var(--ink-muted)]">
            id: {listing.id.slice(0, 8)}...
          </span>
        </div>

        <form action={updateListing} className="mt-6 space-y-6">
          <input type="hidden" name="listingId" value={listing.id} />

          {/* Identification */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Place Title <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                name="title"
                required
                defaultValue={listing.title}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                URL Slug <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                name="slug"
                required
                defaultValue={listing.slug}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          {/* Directory, Category & Status */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Directory (Domain) <span className="text-[var(--coral)]">*</span>
              </label>
              <select
                name="domainId"
                required
                defaultValue={listing.domain_id}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm focus:outline-none"
              >
                {domains?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Category <span className="text-[var(--coral)]">*</span>
              </label>
              <select
                name="categoryId"
                required
                defaultValue={listing.category_id}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm focus:outline-none"
              >
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Publication Status
              </label>
              <select
                name="status"
                defaultValue={listing.status}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm focus:outline-none capitalize"
              >
                <option value="published">Published (Live)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="pending_review">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Location & GPS Coordinates */}
          <div className="border-t border-[var(--line)] pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--coral)]">
              Location & Map Coordinates
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Street Address <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  name="addressLine1"
                  required
                  defaultValue={listing.address_line_1}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">Locality / Area</label>
                <input
                  name="locality"
                  defaultValue={listing.locality ?? ""}
                  placeholder="e.g. Chandapura"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">City</label>
                <input
                  name="city"
                  defaultValue={listing.city ?? ""}
                  placeholder="e.g. Bangalore"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">State / Province</label>
                <input
                  name="administrativeArea"
                  defaultValue={listing.administrative_area ?? ""}
                  placeholder="e.g. Karnataka"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">Postal Code</label>
                <input
                  name="postalCode"
                  defaultValue={listing.postal_code ?? ""}
                  placeholder="e.g. 560099"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--foreground)]">
                  Latitude (GPS Coordinates)
                </label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={listing.latitude ?? ""}
                  placeholder="e.g. 12.7938"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm font-mono focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--foreground)]">
                  Longitude (GPS Coordinates)
                </label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={listing.longitude ?? ""}
                  placeholder="e.g. 77.7018"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm font-mono focus:outline-none font-bold"
                />
              </div>
            </div>
          </div>

          {/* Contact & Descriptions */}
          <div className="border-t border-[var(--line)] pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--coral)]">Contact & Overview</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">Phone</label>
                <input
                  name="phone"
                  defaultValue={listing.phone ?? ""}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">Website</label>
                <input
                  name="website"
                  type="url"
                  defaultValue={listing.website ?? ""}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--foreground)]">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={listing.email ?? ""}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-[var(--foreground)]">Short Description</label>
                <textarea
                  name="shortDescription"
                  rows={2}
                  defaultValue={listing.short_description ?? ""}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-[var(--foreground)]">Full Overview Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={listing.description ?? ""}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  name="isFeatured"
                  type="checkbox"
                  defaultChecked={listing.is_featured}
                  className="rounded"
                />
                ★ Featured Place
              </label>

              <select
                name="verificationStatus"
                defaultValue={listing.verification_status}
                className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold"
              >
                <option value="verified">✓ Verified Place</option>
                <option value="unverified">Unverified</option>
                <option value="pending">Pending Verification</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button className="rounded-full bg-[var(--foreground)] px-8 py-3 text-xs font-bold uppercase tracking-wider text-[var(--paper)] shadow-md hover:bg-[var(--foreground)]/90 transition-all">
              Save Listing Changes
            </button>
          </div>
        </form>
      </section>

      {/* Grid of Ancillary Control Panels (Hours, Links, Media, Duplicates) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Operating Hours Panel */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Operating Hours</h2>
            <span className="text-xs text-[var(--ink-muted)]">{hours?.length ?? 0} days set</span>
          </div>

          <form action={saveHours} className="mt-4 space-y-3">
            <input type="hidden" name="listingId" value={id} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <select
                name="dayOfWeek"
                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-xs font-semibold focus:outline-none"
              >
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="0">Sunday</option>
              </select>
              <input
                name="openTime"
                type="time"
                defaultValue="09:00"
                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-xs font-mono focus:outline-none"
              />
              <input
                name="closeTime"
                type="time"
                defaultValue="18:00"
                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input name="isClosed" type="checkbox" className="rounded" /> Closed on this day
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input name="is24Hours" type="checkbox" className="rounded" /> Open 24h
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--paper)]">
                Save Day Schedule
              </button>
            </div>
          </form>

          <div className="mt-5 space-y-1.5 border-t border-[var(--line)] pt-3 text-xs">
            {hours?.map((hour) => (
              <div key={hour.day_of_week} className="flex justify-between py-1 border-b border-[var(--line)] last:border-b-0">
                <span className="font-semibold">{daysOfWeek[hour.day_of_week]}</span>
                <span className="text-[var(--ink-muted)]">
                  {hour.is_closed ? "Closed" : hour.is_24_hours ? "24 hours" : `${hour.open_time} – ${hour.close_time}`}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Social Links Panel */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Social & Web Links</h2>
            <span className="text-xs text-[var(--ink-muted)]">{links?.length ?? 0} links</span>
          </div>

          <form action={saveSocialLink} className="mt-4 space-y-3">
            <input type="hidden" name="listingId" value={id} />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="platform"
                required
                placeholder="Platform (e.g. instagram, twitter, menu)"
                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-xs focus:outline-none"
              />
              <input
                name="url"
                required
                type="url"
                placeholder="https://instagram.com/..."
                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--paper)]">
                Attach Link
              </button>
            </div>
          </form>

          <div className="mt-5 space-y-2 border-t border-[var(--line)] pt-3 text-xs">
            {links?.map((link) => (
              <div key={link.platform} className="flex items-center justify-between rounded-xl bg-[var(--background)] px-3 py-2">
                <span className="font-bold capitalize">{link.platform}</span>
                <span className="truncate max-w-[200px] text-[var(--ink-muted)] font-mono">{link.url}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Media Attachments Panel */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Photo Gallery & Media</h2>
            <span className="text-xs text-[var(--ink-muted)]">{media?.length ?? 0} files</span>
          </div>

          <form action={uploadListingMedia} className="mt-4 space-y-3">
            <input type="hidden" name="listingId" value={id} />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                name="mediaType"
                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-xs focus:outline-none"
              >
                <option value="gallery">Gallery Photo</option>
                <option value="cover">Hero Cover</option>
                <option value="logo">Brand Logo</option>
                <option value="document">PDF / Menu</option>
              </select>
              <input
                name="altText"
                placeholder="Image description (alt text)"
                className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <input
              name="file"
              required
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4"
              className="w-full text-xs text-[var(--ink-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--foreground)] file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--paper)]"
            />

            <div className="flex justify-end pt-1">
              <button className="rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--paper)]">
                Upload Attachment
              </button>
            </div>
          </form>
        </section>

        {/* Curation & Audit Trail */}
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Curation & Audit Trail</h2>
            <span className="text-xs text-[var(--ink-muted)]">Signals</span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-[var(--foreground)]">Duplicate Detection:</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              {duplicates.length > 1
                ? `⚠️ ${duplicates.length - 1} possible duplicate(s) detected with matching title/phone.`
                : "✓ No conflicting duplicates found across workspace."}
            </p>
          </div>

          <div className="mt-5 space-y-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-muted)]">
            <p className="font-bold text-[var(--foreground)]">Recent Events:</p>
            {audit?.map((event) => (
              <div key={`${event.action}-${event.created_at}`} className="flex justify-between py-1">
                <span className="capitalize">{event.action.replace("_", " ")}</span>
                <span className="font-mono text-[10px]">{new Date(event.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
