import Link from "next/link";
import { submitListing } from "@/app/public-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LocationPinPicker } from "@/components/location-pin-picker";

export const metadata = {
  title: "Suggest a Place | Locatogo",
  description: "Contribute verified places, schools, hospitals, cafes, and landmarks to the community directory atlas.",
};

export default async function DirectSubmitPage() {
  const supabase = await createSupabaseServerClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to Live Atlas
        </Link>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Community Contribution</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">
            Suggest a place
          </h1>
          <p className="mt-3 text-base text-[var(--ink-muted)]">
            Know a great spot (school, hospital, clinic, landmark) that belongs in this directory? Submit its details below. All submissions are reviewed by the curation team before publication.
          </p>
        </div>

        <form action={submitListing} className="mt-8 space-y-6 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-sm">
          <input type="hidden" name="domainSlug" value="" />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Place Name <span className="text-[var(--coral)]">*</span>
            </label>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">The official name of the business, school, hospital, or landmark.</p>
            <input
              name="name"
              required
              placeholder="e.g. Athreya Hospital Chandapura"
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Category
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Primary classification.</p>
              <select
                name="categoryId"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="">Select Category (Optional)</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Your Email <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">For notification when approved.</p>
              <input
                name="email"
                required
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Neighborhood / Locality
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">e.g. Indiranagar, Chandapura</p>
              <input
                name="locality"
                placeholder="e.g. Indiranagar"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                City
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">City name.</p>
              <input
                name="city"
                placeholder="e.g. Bangalore"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive Map Pin Picker */}
          <div className="pt-2">
            <LocationPinPicker />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Why should this place be added? <span className="text-[var(--coral)]">*</span>
            </label>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Include address, website, opening hours, or special services (min. 10 characters).</p>
            <textarea
              name="description"
              required
              minLength={10}
              rows={4}
              placeholder="Located on Chandapura-Anekal Main Road. Top multispecialty medical center..."
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
            <p className="text-xs text-[var(--ink-muted)]">🔒 Submissions are moderated prior to listing.</p>
            <button className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] shadow transition-all hover:bg-[var(--foreground)]/85 hover:shadow-md cursor-pointer">
              Send suggestion →
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
