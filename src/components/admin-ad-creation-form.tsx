"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdSlotAction } from "@/app/admin/actions";

type DomainItem = {
  id: string;
  name: string;
};

type ListingOption = {
  id: string;
  title: string;
  locality?: string | null;
  city?: string | null;
};

const SAMPLE_PRESETS = [
  {
    label: "🏢 Coworking Space",
    sponsor_name: "WeWork Bengaluru",
    title: "Flexible Dedicated Desks & Private Offices in Bangalore",
    description: "Get 20% off modern tech workspaces across Indiranagar, Bellandur, and Koramangala.",
    banner_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    target_url: "https://wework.co.in",
    cta_text: "Claim 20% Off",
    badge_text: "Partner Spotlight",
  },
  {
    label: "⚡ Cloud & Tech",
    sponsor_name: "AWS for Startups",
    title: "Accelerate Your Scale with $100K in Cloud Infrastructure Credits",
    description: "Build, deploy, and scale with premier technical guidance and architecture support.",
    banner_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    target_url: "https://aws.amazon.com/startups",
    cta_text: "Apply for Credits",
    badge_text: "Tech Sponsor",
  },
  {
    label: "🏥 Health & Wellness",
    sponsor_name: "Manipal Preventive Health",
    title: "Comprehensive Annual Executive Health Checkups in Bangalore",
    description: "Advanced diagnostics, cardiac screening, and consultations with top specialists.",
    banner_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    target_url: "https://manipalhospitals.com",
    cta_text: "Book Checkup",
    badge_text: "Health Partner",
  },
];

export function AdminAdCreationForm({
  domains,
  listings,
}: {
  domains: DomainItem[];
  listings: ListingOption[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [sponsorName, setSponsorName] = useState("");
  const [slotType, setSlotType] = useState<"flash_banner" | "header_banner" | "featured_pin" | "featured_listing">("flash_banner");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [ctaText, setCtaText] = useState("Learn More");
  const [badgeText, setBadgeText] = useState("Sponsored");
  const [pricePaid, setPricePaid] = useState("299");
  const [selectedListingId, setSelectedListingId] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState(domains[0]?.id || "");

  // Today & 30-days-from-today defaults
  const todayStr = new Date().toISOString().split("T")[0];
  const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextMonthStr);
  const [status, setStatus] = useState<"active" | "draft">("active");

  const applyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setSponsorName(preset.sponsor_name);
    setTitle(preset.title);
    setDescription(preset.description);
    setBannerUrl(preset.banner_url);
    setTargetUrl(preset.target_url);
    setCtaText(preset.cta_text);
    setBadgeText(preset.badge_text);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      await createAdSlotAction(formData);
      router.push("/admin/advertising");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create ad campaign");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Configuration Form */}
      <div className="lg:col-span-7 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
        {/* Quick Presets */}
        <div className="mb-6 pb-5 border-b border-[var(--line)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-2.5">
            ⚡ Quick-Fill Inspiration Presets:
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="domain_id" value={selectedDomainId} />

          {/* Sponsor Name & Placement Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Sponsor / Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="sponsor_name"
                required
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                placeholder="e.g. WeWork India, AWS"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Placement Slot Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="slot_type"
                value={slotType}
                onChange={(e) => setSlotType(e.target.value as any)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="flash_banner">⚡ Top Flash Banner (Pill Announcement)</option>
                <option value="header_banner">🌟 Header / Sidebar Spotlight Card</option>
                <option value="featured_listing">📍 In-Feed Promoted Directory Card</option>
                <option value="featured_pin">🗺️ Featured Map Pin Placement</option>
              </select>
            </div>
          </div>

          {/* Campaign Headline */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
              Campaign Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Looking for premium workspace? Get 25% off private suites"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Campaign Description */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
              Short Ad Description / Tagline
            </label>
            <textarea
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief value proposition (1-2 sentences) to entice clicks..."
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Target Destination & Banner Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Target URL (Click Destination)
              </label>
              <input
                type="url"
                name="target_url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://sponsor.com/landing"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Banner Image URL (Unsplash or CDN)
              </label>
              <input
                type="url"
                name="banner_url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* CTA Button Text & Badge Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Call-to-Action Button Text
              </label>
              <input
                type="text"
                name="cta_text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Claim Offer, Apply Now, Learn More"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Badge Tag Text
              </label>
              <input
                type="text"
                name="badge_text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. Sponsored, Partner Spotlight"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Schedule: Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Campaign Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Campaign End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Price Paid & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Price Paid / Campaign Value ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-xs text-[var(--ink-muted)] font-bold">$</span>
                <input
                  type="number"
                  name="price_paid"
                  step="0.01"
                  min="0"
                  value={pricePaid}
                  onChange={(e) => setPricePaid(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] pl-7 pr-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Initial Status
              </label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="active">🟢 Active (Immediately Live)</option>
                <option value="draft">📝 Draft (Not Visible)</option>
              </select>
            </div>
          </div>

          {/* Optional: Associate with existing Directory Place */}
          {listings.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Link to Verified Directory Listing (Optional)
              </label>
              <select
                name="listing_id"
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="">-- None (External Ad Campaign) --</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({[l.locality, l.city].filter(Boolean).join(", ")})
                  </option>
                ))}
              </select>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-bold">
              ✕ {errorMessage}
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-slate-900 dark:bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Creating Advertisement..." : "Publish Advertisement Campaign 🚀"}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live Interactive Preview */}
      <div className="lg:col-span-5 space-y-4 sticky top-6">
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              Live Preview
            </h3>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5">
              {slotType.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          {/* Flash Announcement Banner Preview */}
          {slotType === "flash_banner" && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-3.5 shadow-xs text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  {badgeText || "Partner Spotlight"}
                </span>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400">
                  {sponsorName || "Sponsor Name"}
                </span>
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                {title || "Campaign Headline will appear here..."}
              </p>
              {description && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] text-amber-800/80 dark:text-amber-400/80 font-mono">
                  Ends {endDate}
                </span>
                <span className="rounded-full bg-amber-500 text-white font-bold px-3 py-1 text-[10px] shadow-2xs">
                  {ctaText || "Claim Offer"} ↗
                </span>
              </div>
            </div>
          )}

          {/* Spotlight Card Preview */}
          {(slotType === "header_banner" || slotType === "featured_listing" || slotType === "featured_pin") && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--background)] overflow-hidden shadow-xs">
              {bannerUrl ? (
                <div className="h-32 w-full overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerUrl}
                    alt={title || "Ad banner"}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      {badgeText || "Sponsored"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold p-4 text-center">
                  <span>{sponsorName || "Sponsor Spotlight"}</span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {sponsorName || "Sponsor Name"}
                  </span>
                  <span className="text-[10px] text-[var(--ink-muted)] font-mono">
                    ${pricePaid}
                  </span>
                </div>

                <h4 className="mt-1 font-bold text-sm text-[var(--foreground)] leading-snug">
                  {title || "Campaign Headline will appear here..."}
                </h4>

                {description && (
                  <p className="mt-1.5 text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between">
                  <span className="text-[10px] text-[var(--ink-muted)]">
                    Direct Link ↗
                  </span>
                  <span className="rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 shadow-2xs">
                    {ctaText || "Learn More"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-[11px] text-[var(--ink-muted)] space-y-1">
            <p>✓ Auto-records impressions and click analytics.</p>
            <p>✓ Real-time RLS date verification.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
