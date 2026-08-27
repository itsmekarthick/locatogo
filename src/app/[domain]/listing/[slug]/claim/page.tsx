import Link from "next/link";
import { submitClaim } from "@/app/public-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ClaimPage({ params }: { params: Promise<{ domain: string; slug: string }> }) {
  const { domain, slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: directory } = await supabase.from("domains").select("id, name").eq("slug", domain).eq("status", "published").single();
  const { data: listing } = directory
    ? await supabase.from("listings").select("id, title").eq("domain_id", directory.id).eq("slug", slug).eq("status", "published").single()
    : { data: null };

  if (!listing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-10 text-center bg-[var(--background)]">
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Listing Not Found</h1>
        <Link href={`/${domain}`} className="mt-4 rounded-full bg-[var(--foreground)] px-5 py-2.5 text-xs font-semibold text-[var(--paper)]">
          Back to directory
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/${domain}/listing/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to listing
        </Link>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Ownership Verification</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">
            Claim {listing.title}
          </h1>
          <p className="mt-3 text-base text-[var(--ink-muted)]">
            Are you the official owner, manager, or authorized representative of this place? Submit your verification details below to manage this listing.
          </p>
        </div>

        <form action={submitClaim} className="mt-8 space-y-5 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-sm">
          <input type="hidden" name="listingId" value={listing.id} />
          <input type="hidden" name="domainPath" value={domain} />
          <input type="hidden" name="listingSlug" value={slug} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Verification Proof & Contact Info <span className="text-[var(--coral)]">*</span>
            </label>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              Explain your affiliation (e.g. official business email, phone number, website domain ownership, or social handle) so our curators can verify you.
            </p>
            <textarea
              name="information"
              required
              minLength={10}
              rows={5}
              placeholder="I am the founder/manager of this venue. You can verify me at manager@officialwebsite.com or call our business number..."
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
            <p className="text-xs text-[var(--ink-muted)]">🔒 You must be signed in to submit claims.</p>
            <button className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] shadow transition-all hover:bg-[var(--foreground)]/85 hover:shadow-md">
              Submit verification claim →
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
