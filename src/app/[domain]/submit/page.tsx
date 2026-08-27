import Link from "next/link";
import { submitListing } from "@/app/public-actions";

export default async function SubmitPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/${domain}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to directory
        </Link>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Community Contribution</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">
            Suggest a place
          </h1>
          <p className="mt-3 text-base text-[var(--ink-muted)]">
            Know a great spot that belongs in this directory? Submit its details below. All submissions are reviewed by the curation team before publication.
          </p>
        </div>

        <form action={submitListing} className="mt-8 space-y-5 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-sm">
          <input type="hidden" name="domainSlug" value={domain} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Place Name <span className="text-[var(--coral)]">*</span>
            </label>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">The name of the business, project, or landmark.</p>
            <input
              name="name"
              required
              placeholder="e.g. Kinfolk Gallery"
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Your Email <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">For notification when the place is approved.</p>
              <input
                name="email"
                required
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                City / Locality
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">City or neighborhood.</p>
              <input
                name="city"
                placeholder="e.g. Copenhagen"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Why should this place be added? <span className="text-[var(--coral)]">*</span>
            </label>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Include address, website, opening hours, or what makes it special (min. 10 characters).</p>
            <textarea
              name="description"
              required
              minLength={10}
              rows={4}
              placeholder="A vibrant design shop with locally sourced ceramic wares and specialty tea..."
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
            <p className="text-xs text-[var(--ink-muted)]">🔒 Submissions are moderated prior to listing.</p>
            <button className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] shadow transition-all hover:bg-[var(--foreground)]/85 hover:shadow-md">
              Send suggestion →
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
