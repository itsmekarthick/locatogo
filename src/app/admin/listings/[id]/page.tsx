import Link from "next/link";
import {
  findDuplicateListings,
  saveHours,
  saveSocialLink,
  updateListing,
  uploadListingMedia,
} from "@/app/admin/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { ListingEditForm } from "@/components/listing-edit-form";
import { AdminCareerSyncCard } from "@/components/admin-career-sync-card";

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
        "id, domain_id, category_id, title, slug, short_description, description, address_line_1, address_line_2, locality, city, administrative_area, country_code, postal_code, latitude, longitude, website, email, phone, status, verification_status, is_featured, careers_url, ats_provider, active_jobs_count, company_type, funding_stage"
      )
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    supabase.from("domains").select("id, name, slug").eq("tenant_id", tenant.id).order("name"),
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
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-8 text-center">
        <p className="text-3xl">📍</p>
        <h2 className="mt-3 font-display text-xl font-bold text-[var(--foreground)]">Listing Not Found</h2>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          This listing could not be found or does not belong to your active workspace.
        </p>
        <Link
          href="/admin/listings"
          className="mt-5 inline-block rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-semibold text-[var(--paper)]"
        >
          ← Back to all listings
        </Link>
      </div>
    );
  }

  const duplicates = await findDuplicateListings(listing.title, listing.phone ?? undefined);
  const domain = domains?.find((d) => d.id === listing.domain_id);

  return (
    <div className="space-y-8">
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
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                {domain?.name || "Atlas"}
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 capitalize">
                {listing.status.replace("_", " ")}
              </span>
              {listing.is_featured && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                  ★ Featured
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.05em] text-slate-900 dark:text-slate-100 sm:text-4xl">
              {listing.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {[listing.locality, listing.city, listing.administrative_area].filter(Boolean).join(", ")} · slug: /{listing.slug}
            </p>
          </div>

          {listing.slug && (
            <Link
              href={`/listing/${listing.slug}`}
              target="_blank"
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              Preview Public Place ↗
            </Link>
          )}
        </div>
      </div>

      {/* Live Careers & ATS Synchronization Card */}
      <AdminCareerSyncCard
        listingId={listing.id}
        initialProvider={listing.ats_provider}
        initialCareersUrl={listing.careers_url}
        activeJobsCount={listing.active_jobs_count || 0}
      />

      {/* Tabbed Interactive Listing Editor Form with Live Preview */}
      <ListingEditForm
        listing={listing}
        domains={domains ?? []}
        categories={categories ?? []}
        hours={hours ?? []}
        links={links ?? []}
        media={media ?? []}
        audit={audit ?? []}
        duplicateCount={duplicates.length}
        updateAction={updateListing}
        saveHoursAction={saveHours}
        saveSocialLinkAction={saveSocialLink}
        uploadMediaAction={uploadListingMedia}
      />
    </div>
  );
}
