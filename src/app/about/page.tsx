import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { TECH_SECTORS } from "@/lib/constants/tech-hubs";

export const metadata: Metadata = {
  title: "About LocaToGo | Global Tech Atlas",
  description: "Learn how LocaToGo maps technology companies, global tech hubs, and live job opportunities for the modern tech ecosystem.",
  keywords: ["about LocaToGo", "global tech atlas", "technology company map", "startup ecosystem directory"],
  authors: [{ name: "LocaToGo" }],
  creator: "LocaToGo",
  publisher: "LocaToGo",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About LocaToGo | Global Tech Atlas",
    description: "Learn how LocaToGo maps technology companies, global tech hubs, and live job opportunities.",
    url: "/about",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-[#070b13] font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* Unified Public Navigation Header */}
      <PublicHeader />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">About LocaToGo</span>
        </div>

        {/* Hero Banner */}
        <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-white via-gray-50 to-orange-50/30 p-6 sm:p-12 shadow-xs mb-10">
          <span className="rounded-full bg-orange-100 border border-orange-200 px-3 py-1 text-[11px] font-bold text-orange-900 uppercase tracking-wider">
            Our Mission & Platform
          </span>
          <h1 className="mt-4 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-gray-950 leading-tight">
            Mapping the companies shaping the next tech economy.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
            LocaToGo is a global Tech Atlas for discovering companies, startups, MNC GCCs, technology hubs, and live opportunities. We connect geographic context with company intelligence so people can understand where technology is being built and where teams are hiring.
          </p>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs">
            <span className="text-2xl">🎯</span>
            <h3 className="font-serif text-lg font-bold text-gray-900 mt-3">
              Explore Global Tech Hubs
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
              Browse technology ecosystems by country, city, and locality, from Bengaluru and New York to London, Singapore, and beyond. Every company is placed in geographic context.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs">
            <span className="text-2xl">⏰</span>
            <h3 className="font-serif text-lg font-bold text-gray-900 mt-3">
              Company Intelligence
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
              Compare company type, funding stage, team scale, technology stack, location, website, and careers information in one searchable profile.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs">
            <span className="text-2xl">🚕</span>
            <h3 className="font-serif text-lg font-bold text-gray-900 mt-3">
              Live Hiring Signals
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
              Find active roles by department, experience level, workplace model, and location, then follow the direct career link to the source company.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs">
            <span className="text-2xl">👁️</span>
            <h3 className="font-serif text-lg font-bold text-gray-900 mt-3">
              Curated and Community-Improved
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
              Company submissions are reviewed before publication, while operators and company teams can keep profiles structured, current, and useful to the ecosystem.
            </p>
          </div>
        </div>

        {/* Tech Atlas coverage */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs mb-12">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-950">
            What the Tech Atlas Covers
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            Explore the company types and technology ecosystems represented across our global hub directory:
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-gray-800">
            {TECH_SECTORS.filter((sector) => sector.id !== "all").map((sector) => (
              <div key={sector.id} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span>{sector.icon}</span>
                <span>{sector.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="rounded-3xl bg-gray-950 p-8 sm:p-10 text-white text-center shadow-lg">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold">
            Is your company part of the ecosystem?
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            Add your company to the Tech Atlas with its sector, location, website, careers page, and a clear description of what you build.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/submit"
              className="rounded-xl bg-[#0ea5e9] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0284c7] transition-colors shadow-xs"
            >
              + Add Your Company
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-colors"
            >
              Explore Tech Atlas →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 sm:flex-row text-xs text-gray-500">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-gray-900"><span className="animate-brand-reveal">LocaToGo<span className="text-[#0ea5e9]">.</span></span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-gray-600">
            <Link href="/about" className="text-gray-950 font-bold">
              About
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">
              Contact Support
            </Link>
          </div>

          <p className="text-gray-400">
            © 2026 LocaToGo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

