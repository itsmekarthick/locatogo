import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { SponsorInquiryForm } from "@/components/sponsor-inquiry-form";

export const metadata: Metadata = {
  title: "Advertise & Partner with Mapora / LocaToGo | Targeted Local & Tech Discovery",
  description: "Promote your business, coworking space, healthcare center, or tech startup to hundreds of thousands of active local explorers and tech professionals.",
};

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#070b13] text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col">
      {/* Unified Public Navigation Header */}
      <PublicHeader />

      {/* Hero Showcase */}
      <main className="flex-1 mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 px-4 py-1 text-xs font-bold text-[#06b6d4] uppercase tracking-wider">
            📢 High-Intent Sponsored Placements
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
            Reach 250,000+ Local Explorers & Tech Decision Makers
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Position your brand directly in front of high-intent searchers exploring Bangalore and global tech hubs — from founders seeking coworking spaces to residents discovering healthcare, schools, and dining.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <a
              href="#inquire-form"
              className="rounded-full bg-[#06b6d4] hover:bg-[#0891b2] text-white font-bold px-6 py-3 text-xs shadow-md transition-all"
            >
              Book an Advertising Slot →
            </a>
            <Link
              href="/admin/advertising"
              className="rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold px-5 py-3 text-xs hover:bg-slate-50 transition-all shadow-2xs"
            >
              Manage Active Ads (Admin)
            </Link>
          </div>
        </div>

        {/* Audience & Reach Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-6 text-center">
            <p className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">67,000+</p>
            <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-400">Indexed Tech Companies & Places</p>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-6 text-center">
            <p className="font-display text-3xl sm:text-4xl font-bold text-cyan-600 dark:text-cyan-400">8.4%</p>
            <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-400">Average Click-Through Rate</p>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-6 text-center">
            <p className="font-display text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
            <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-400">Verified Direct GPS & Contact Data</p>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-6 text-center">
            <p className="font-display text-3xl sm:text-4xl font-bold text-[#06b6d4]">2.8x</p>
            <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-400">Higher Engagement vs Social Ads</p>
          </div>
        </div>

        {/* Strategic Placement Tiers */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              High-Impact Advertising Formats
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select the optimal placement slot for your brand goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between hover:border-[#06b6d4] transition-all">
              <div>
                <span className="rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Maximum Visibility
                </span>
                <h3 className="mt-3 font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Top Flash Announcement
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pinned at the very top of all directory and atlas views. Ideal for limited-time promotions, event announcements, and major product launches.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li>✓ 100% Page Impression Share</li>
                  <li>✓ Custom Call-to-Action Link</li>
                  <li>✓ Dismissible with session persistence</li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  $299 <span className="text-xs font-normal text-slate-500">/ 24h Flash</span>
                </p>
                <a
                  href="#inquire-form"
                  className="mt-3 block w-full text-center rounded-xl bg-slate-900 dark:bg-cyan-600 text-white font-bold py-2 text-xs hover:bg-slate-800"
                >
                  Select Flash Banner
                </a>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="rounded-3xl border-2 border-cyan-500 bg-white dark:bg-slate-900 p-6 shadow-lg flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                Most Popular
              </div>
              <div>
                <span className="rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Native Discovery
                </span>
                <h3 className="mt-3 font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  In-Feed Promoted Card
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Blends seamlessly into search results and map views with an elegant &quot;Promoted&quot; badge, high-res cover banner, and direct visit link.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li>✓ Featured map pin badge</li>
                  <li>✓ Guaranteed top 3 category ranking</li>
                  <li>✓ Direct telephone & website actions</li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  $499 <span className="text-xs font-normal text-slate-500">/ 7 Days</span>
                </p>
                <a
                  href="#inquire-form"
                  className="mt-3 block w-full text-center rounded-xl bg-cyan-600 text-white font-bold py-2 text-xs hover:bg-cyan-700 shadow-xs"
                >
                  Select In-Feed Promo
                </a>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between hover:border-[#06b6d4] transition-all">
              <div>
                <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Partner Spotlight
                </span>
                <h3 className="mt-3 font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                  Profile Sidebar Spotlight
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Exclusive placement alongside verified place profiles and live tech job boards. Reaches qualified visitors actively reviewing places.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li>✓ Placement across 1,000+ verified listings</li>
                  <li>✓ Live impression & click telemetry</li>
                  <li>✓ 30-day extended exposure</li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  $999 <span className="text-xs font-normal text-slate-500">/ 30 Days</span>
                </p>
                <a
                  href="#inquire-form"
                  className="mt-3 block w-full text-center rounded-xl bg-slate-900 dark:bg-cyan-600 text-white font-bold py-2 text-xs hover:bg-slate-800"
                >
                  Select Sidebar Spotlight
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsor Inquiry Form */}
        <div id="inquire-form" className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 p-6 sm:p-10 shadow-xs max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              Request Ad Placement or Custom Sponsorship
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Submit your details and our team will activate your campaign within 2 hours.
            </p>
          </div>

          <SponsorInquiryForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© 2026 LocaToGo. Strict multi-tenant directory network. All rights reserved.</p>
      </footer>
    </div>
  );
}
