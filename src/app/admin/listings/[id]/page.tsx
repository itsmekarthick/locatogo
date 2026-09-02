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

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // 1. Resolve listing by UUID or Slug with fallback
  let listingQuery = supabase.from("listings").select("*");

  if (isUuid) {
    listingQuery = listingQuery.eq("id", id);
  } else {
    listingQuery = listingQuery.eq("slug", id);
  }

  let { data: listing } = await listingQuery.eq("tenant_id", tenant.id).maybeSingle();

  if (!listing) {
    // Cross-tenant / Platform Seed Fallback
    const fallbackRes = isUuid
      ? await supabase.from("listings").select("*").eq("id", id).maybeSingle()
      : await supabase.from("listings").select("*").eq("slug", id).maybeSingle();
    listing = fallbackRes.data;
  }

  const resolvedListingId = listing?.id || (isUuid ? id : "");

  const [
    { data: domains },
    { data: categories },
    { data: hours },
    { data: links },
    { data: media },
    { data: audit },
  ] = await Promise.all([
    supabase.from("domains").select("id, name, slug").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    resolvedListingId
      ? supabase
          .from("listing_hours")
          .select("day_of_week, is_closed, is_24_hours, open_time, close_time")
          .eq("listing_id", resolvedListingId)
          .order("day_of_week")
      : Promise.resolve({ data: [] }),
    resolvedListingId
      ? supabase
          .from("listing_social_links")
          .select("platform, url")
          .eq("listing_id", resolvedListingId)
      : Promise.resolve({ data: [] }),
    resolvedListingId
      ? supabase
          .from("listing_media")
          .select("id, media_type, mime_type, file_size, alt_text, public_url")
          .eq("listing_id", resolvedListingId)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
    resolvedListingId
      ? supabase
          .from("listing_audit_logs")
          .select("action, created_at")
          .eq("entity_id", resolvedListingId)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  if (!listing) {
    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-3xl">📍</p>
        <h2 className="mt-3 font-display text-xl font-bold text-slate-900 dark:text-slate-100">Listing Not Found</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          This listing could not be found or does not exist in the database.
        </p>
        <Link
          href="/admin/listings"
          className="mt-6 inline-flex rounded-full bg-slate-900 dark:bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          ← Back to Directory Listings
        </Link>
      </div>
    );
  }

  // Fetch real duplicates in this workspace
  const duplicates = await findDuplicateListings(listing.title, listing.phone, listing.id).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Listing Manager
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Edit: {listing.title}
          </h1>
          <p className="text-xs text-slate-500">
            Slug: <span className="font-mono text-indigo-600 dark:text-indigo-400">/{listing.slug}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/listing/${listing.slug}`}
            target="_blank"
            className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
          >
            Preview Live ↗
          </Link>
          <Link
            href="/admin/listings"
            className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      <ListingEditForm
        listing={listing}
        domains={domains ?? []}
        categories={categories ?? []}
        hours={hours ?? []}
        links={links ?? []}
        media={media ?? []}
        audit={audit ?? []}
        duplicateCount={duplicates.length}
        duplicates={duplicates as any}
        updateAction={updateListing}
        saveHoursAction={saveHours}
        saveSocialLinkAction={saveSocialLink}
        uploadMediaAction={uploadListingMedia}
      />

      {/* Live ATS Career Sync Integration Card */}
      <AdminCareerSyncCard
        listingId={listing.id}
        initialCareersUrl={listing.careers_url}
        initialProvider={listing.ats_provider}
        activeJobsCount={listing.active_jobs_count || 0}
      />

      {audit && audit.length > 0 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Audit History</h2>
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {audit.map((entry, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-mono">{entry.action}</span>
                <span>{new Date(entry.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
