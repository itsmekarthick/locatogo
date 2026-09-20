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

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type PlacementOption = {
  id: "flash" | "in_feed" | "map_overlay" | "sidebar" | "detail_bottom" | "tech_spotlight";
  name: string;
  icon: string;
  description: string;
  slotType: "flash_banner" | "header_banner" | "featured_pin" | "featured_listing";
  defaultPrice: string;
};

export const PLACEMENT_OPTIONS: PlacementOption[] = [
  {
    id: "flash",
    name: "Top Flash Announcement",
    icon: "⚡",
    description: "High-visibility top banner across directory & tech atlas with auto-rotation carousel.",
    slotType: "flash_banner",
    defaultPrice: "299",
  },
  {
    id: "in_feed",
    name: "Directory In-Feed Stream",
    icon: "📰",
    description: "Injected every 4 places into directory & search results with gold 'Promoted' badge.",
    slotType: "featured_listing",
    defaultPrice: "499",
  },
  {
    id: "map_overlay",
    name: "Interactive Map Spotlight",
    icon: "🗺️",
    description: "Floating frosted-glass sponsor pill on the Leaflet map canvas with custom pin.",
    slotType: "featured_pin",
    defaultPrice: "599",
  },
  {
    id: "sidebar",
    name: "Place Profile Sidebar",
    icon: "📌",
    description: "Exclusive card in the right sidebar of verified place detail pages.",
    slotType: "header_banner",
    defaultPrice: "699",
  },
  {
    id: "detail_bottom",
    name: "Place Profile Bottom Showcase",
    icon: "🤝",
    description: "Multi-partner showcase strip positioned right under verified customer reviews.",
    slotType: "header_banner",
    defaultPrice: "799",
  },
  {
    id: "tech_spotlight",
    name: "Tech Atlas Hiring Spotlight",
    icon: "💼",
    description: "Promoted cloud, tools, or hiring spotlight card directly above live tech job openings.",
    slotType: "header_banner",
    defaultPrice: "999",
  },
];

const SAMPLE_PRESETS = [
  {
    label: "🏢 Coworking Space",
    sponsor_name: "WeWork Bengaluru",
    placement_location: "flash" as const,
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
    placement_location: "tech_spotlight" as const,
    title: "Accelerate Your Scale with $100K in Cloud Infrastructure Credits",
    description: "Build, deploy, and scale with premier technical guidance and architecture support.",
    banner_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    target_url: "https://aws.amazon.com/startups",
    cta_text: "Apply for Credits",
    badge_text: "Tech Sponsor",
  },
  {
    label: "☕ Work-Friendly Cafe",
    sponsor_name: "Third Wave Coffee",
    placement_location: "map_overlay" as const,
    title: "Artisanal Specialty Roasts & Quiet Work Corners in Bangalore",
    description: "Fast WiFi, single-origin pour-overs, and warm neighborhood atmosphere.",
    banner_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    target_url: "https://thirdwavecoffeeroasters.com",
    cta_text: "Find Nearest Cafe",
    badge_text: "Map Partner",
  },
  {
    label: "🏥 Health & Wellness",
    sponsor_name: "Manipal Preventive Health",
    placement_location: "sidebar" as const,
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
  listings = [],
  categories = [],
}: {
  domains: DomainItem[];
  listings?: ListingOption[];
  categories?: CategoryOption[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [sponsorName, setSponsorName] = useState("");
  const [placementLocation, setPlacementLocation] = useState<PlacementOption["id"]>("flash");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [targetCity, setTargetCity] = useState("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [ctaText, setCtaText] = useState("Learn More");
  const [badgeText, setBadgeText] = useState("Sponsored");
  const [pricePaid, setPricePaid] = useState("299");
  const [selectedDomainId, setSelectedDomainId] = useState(domains[0]?.id || "");

  // Today & 30-days-from-today defaults
  const todayStr = new Date().toISOString().split("T")[0];
  const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextMonthStr);
  const [status, setStatus] = useState<"active" | "draft">("active");

  const currentPlacement = PLACEMENT_OPTIONS.find((p) => p.id === placementLocation) || PLACEMENT_OPTIONS[0];

  const handleSelectPlacement = (opt: PlacementOption) => {
    setPlacementLocation(opt.id);
    setPricePaid(opt.defaultPrice);
  };

  const applyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setSponsorName(preset.sponsor_name);
    setPlacementLocation(preset.placement_location);
    const matchedOpt = PLACEMENT_OPTIONS.find((p) => p.id === preset.placement_location);
    if (matchedOpt) setPricePaid(matchedOpt.defaultPrice);
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
      formData.set("slot_type", currentPlacement.slotType);
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
      <div className="lg:col-span-7 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-7 shadow-xs">
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
                className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-cyan-400 hover:bg-cyan-50/30 transition-all cursor-pointer shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="domain_id" value={selectedDomainId} />
          <input type="hidden" name="placement_location" value={placementLocation} />

          {/* STEP 1: EXPLICIT PLACEMENT LOCATION SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-2">
              1. Choose Where This Ad Should Appear <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PLACEMENT_OPTIONS.map((opt) => {
                const isSelected = placementLocation === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectPlacement(opt)}
                    className={`text-left rounded-2xl border p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-cyan-600 bg-cyan-50/40 dark:bg-cyan-950/40 ring-1 ring-cyan-600 shadow-xs"
                        : "border-[var(--line)] bg-[var(--background)] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                        <span>{opt.icon}</span>
                        <span>{opt.name}</span>
                      </span>
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-cyan-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
                      {opt.description}
                    </p>
                    <p className="mt-2 text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-400">
                      Standard: ${opt.defaultPrice}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: CATEGORY & CITY TARGETING */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--line)]">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Contextual Category Targeting
              </label>
              <select
                name="target_category_id"
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="">🌐 Show Across All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    Target: {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Geographic City / Hub Target
              </label>
              <select
                name="target_city"
                value={targetCity}
                onChange={(e) => setTargetCity(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="all">🌐 All Locations & Global Tech Hubs</option>
                <option value="bengaluru">Bengaluru / Bangalore Only</option>
                <option value="silicon-valley">Silicon Valley & SF Only</option>
                <option value="london">London Only</option>
                <option value="singapore">Singapore Only</option>
              </select>
            </div>
          </div>

          {/* Sponsor Name & Headline */}
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
                placeholder="e.g. WeWork Bengaluru, AWS"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

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
                placeholder="e.g. Get 20% off dedicated coworking suites"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Campaign Description */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
              Short Ad Description / Value Proposition
            </label>
            <textarea
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief value proposition to entice clicks..."
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono text-[11px]"
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
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono text-[11px]"
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
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-cyan-500"
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



          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-bold">
              ✕ {errorMessage}
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-slate-900 dark:bg-cyan-600 px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-cyan-700 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Creating Advertisement..." : `Publish to ${currentPlacement.name} 🚀`}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live Interactive Placement Preview */}
      <div className="lg:col-span-5 space-y-4 sticky top-6">
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              Simulated Placement Preview
            </h3>
            <span className="rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold px-2.5 py-0.5">
              {currentPlacement.icon} {currentPlacement.name}
            </span>
          </div>

          {/* Flash Announcement Banner Preview */}
          {placementLocation === "flash" && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-3.5 shadow-md text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="rounded bg-white/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                  {badgeText || "Partner Spotlight"}
                </span>
                <span className="text-[10px] font-bold text-white/90">
                  {sponsorName || "Sponsor Name"}
                </span>
              </div>
              <p className="font-bold text-white text-xs leading-snug">
                {title || "Campaign Headline will appear here..."}
              </p>
              {description && (
                <p className="text-[11px] text-white/90 mt-1 leading-relaxed line-clamp-2">
                  {description}
                </p>
              )}
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/20">
                <span className="text-[10px] text-white/70 font-mono">
                  Auto-rotates with active sponsors
                </span>
                <span className="rounded-full bg-white text-slate-900 font-bold px-3 py-1 text-[10px] shadow-2xs">
                  {ctaText || "Claim Offer"} ↗
                </span>
              </div>
            </div>
          )}

          {/* Map Overlay Spotlight Preview */}
          {placementLocation === "map_overlay" && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900/90 backdrop-blur-md text-white p-3.5 shadow-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-amber-400 text-slate-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>📍</span>
                  <span>Map Sponsor</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Map Pin #1</span>
              </div>
              <p className="font-bold text-xs text-white">
                {title || "Specialty Roasts & Quiet Work Corners in Bangalore"}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-slate-300 font-medium">{sponsorName || "Third Wave Coffee"}</span>
                <span className="text-amber-400 font-bold">{ctaText || "View on Map"} →</span>
              </div>
            </div>
          )}

          {/* In-Feed & Sidebar & Tech Atlas Preview */}
          {(placementLocation === "in_feed" ||
            placementLocation === "sidebar" ||
            placementLocation === "detail_bottom" ||
            placementLocation === "tech_spotlight") && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--background)] overflow-hidden shadow-xs">
              {bannerUrl ? (
                <div className="h-32 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
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
                <div className="h-24 bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold p-4 text-center">
                  <span>{sponsorName || "Sponsor Spotlight"}</span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
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
                  <span className="rounded-xl bg-slate-900 dark:bg-cyan-600 text-white text-xs font-bold px-3 py-1.5 shadow-2xs">
                    {ctaText || "Learn More"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-[11px] text-[var(--ink-muted)] space-y-1.5 border-t border-[var(--line)] pt-3">
            <p className="flex items-center gap-1.5">
              <span>✓</span>
              <span>Only displays in <strong>{currentPlacement.name}</strong>.</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span>✓</span>
              <span>Contextual targeting: <strong>{targetCategoryId ? "Specific Category" : "All Categories"}</strong>.</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span>✓</span>
              <span>Auto-rotates fairly when multiple sponsors occupy the same slot.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
