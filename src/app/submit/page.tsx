import Link from "next/link";
import { submitListing } from "@/app/public-actions";
import { LocationPinPicker } from "@/components/location-pin-picker";
import { PublicHeader } from "@/components/public-header";
import { GLOBAL_COUNTRIES, TECH_SECTORS } from "@/lib/constants/tech-hubs";

export const metadata = {
  title: "Add Your Company to the Tech Atlas | LocaToGo",
  description: "Submit your technology company, startup, or global team to the LocaToGo Tech Atlas.",
  keywords: ["add company to tech directory", "submit startup", "add technology company", "Tech Atlas submission"],
  authors: [{ name: "LocaToGo" }],
  creator: "LocaToGo",
  publisher: "LocaToGo",
  alternates: { canonical: "/submit" },
  openGraph: {
    title: "Add Your Company to the Tech Atlas | LocaToGo",
    description: "Submit your technology company, startup, or global team to the LocaToGo Tech Atlas.",
    url: "/submit",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function DirectSubmitPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <PublicHeader />

      <main className="flex-1 px-5 py-12 sm:px-10">
        <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to Live Atlas
        </Link>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Global Tech Atlas</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">
            Add your company
          </h1>
          <p className="mt-3 text-base text-[var(--ink-muted)]">
            Help people discover your company, technology, team, and open roles. Submit the details below and our curation team will review them before publication.
          </p>
        </div>

        <form action={submitListing} className="mt-8 space-y-6 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-sm">
          <input type="hidden" name="domainSlug" value="" />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Company Name <span className="text-[var(--coral)]">*</span>
            </label>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Use the company&apos;s official public name.</p>
            <input
              name="name"
              required
              placeholder="e.g. Acme AI Labs"
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Company Type
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">How this company fits into the tech ecosystem.</p>
              <select
                name="companyType"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="">Select Company Type (Optional)</option>
                {TECH_SECTORS.filter((sector) => sector.id !== "all").map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Your Email <span className="text-[var(--coral)]">*</span>
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">For review updates and approval notifications.</p>
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
                Tech Hub / Locality
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">e.g. Whitefield, Koramangala, or SoHo.</p>
              <input
                name="locality"
                placeholder="e.g. Whitefield"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                City / Tech Hub
              </label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">The city or metro where the company operates.</p>
              <input
                name="city"
                placeholder="e.g. Bengaluru"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Country</label>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Primary country for this company profile.</p>
              <select
                name="countryCode"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="">Select Country (Optional)</option>
                {GLOBAL_COUNTRIES.filter((country) => country.code !== "ALL").map((country) => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Company Website</label>
              <input name="website" type="url" placeholder="https://example.com" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Careers Page</label>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Help people find your current openings.</p>
            <input name="careersUrl" type="url" placeholder="https://example.com/careers" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none" />
          </div>

          {/* Interactive Map Pin Picker */}
          <div className="pt-2">
            <LocationPinPicker />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Tell us about the company <span className="text-[var(--coral)]">*</span>
            </label>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Include what you build, your products or services, and useful context (min. 10 characters).</p>
            <textarea
              name="description"
              required
              minLength={10}
              rows={4}
              placeholder="We build developer tools for teams working with real-time data..."
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
            <p className="text-xs text-[var(--ink-muted)]">🔒 Company submissions are moderated before appearing in the Tech Atlas.</p>
            <button className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--paper)] shadow transition-ui hover:bg-[var(--foreground)]/85 hover:shadow-md cursor-pointer">
              Submit Company →
            </button>
          </div>
        </form>
      </div>
    </main>
    </div>
  );
}
