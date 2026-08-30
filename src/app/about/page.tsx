import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Locatogo - Global Place & Directory Atlas",
  description: "Learn more about Locatogo, the real-time global directory atlas for verified schools, hospitals, tech hubs, dining destinations, and civic infrastructure.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fdfdfd] font-sans antialiased text-[#111827]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-2xs">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              locatogo<span className="text-[#e26a4f]">.</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-50/60 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              <span className="text-sm">📍</span>
              <span>Global Atlas</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Explore Map
            </Link>
            <Link
              href="/submit"
              className="rounded-xl bg-[#111827] px-4 py-1.5 text-xs font-bold text-white hover:bg-black transition-colors shadow-xs"
            >
              + Add Place
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">About Locatogo</span>
        </div>

        {/* Hero Banner */}
        <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-white via-gray-50 to-orange-50/30 p-6 sm:p-12 shadow-xs mb-10">
          <span className="rounded-full bg-orange-100 border border-orange-200 px-3 py-1 text-[11px] font-bold text-orange-900 uppercase tracking-wider">
            Our Mission & Platform
          </span>
          <h1 className="mt-4 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-gray-950 leading-tight">
            Mapping the world with precision, community intelligence, and speed.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
            Locatogo is a next-generation local directory and infrastructure atlas. We help residents, newcomers, and travelers discover verified healthcare centers, schools, tech hubs, dining spots, and public amenities worldwide with real-time accuracy.
          </p>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs">
            <span className="text-2xl">🎯</span>
            <h3 className="font-serif text-lg font-bold text-gray-900 mt-3">
              Exact GPS Precision
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
              Every listing on Locatogo is anchored to verified latitude and longitude coordinates. No approximate pins or guessing where the main gate or emergency casualty entrance is located.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs">
            <span className="text-2xl">⏰</span>
            <h3 className="font-serif text-lg font-bold text-gray-900 mt-3">
              Live Operating Intelligence
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
              Real-time &ldquo;Open Now&rdquo; and &ldquo;Closed&rdquo; status indicators alongside verified weekly schedules ensure you never drive to a closed clinic, bank, or school counter.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs">
            <span className="text-2xl">🚕</span>
            <h3 className="font-serif text-lg font-bold text-gray-900 mt-3">
              1-Click Transit Integrations
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
              Instantly book Uber or Ola rides with pre-filled destination coordinates, initiate direct WhatsApp inquiries with verified business owners, or start Google Navigation in one tap.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs">
            <span className="text-2xl">👁️</span>
            <h3 className="font-serif text-lg font-bold text-gray-900 mt-3">
              360° Street View & Photos
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
              Look around any venue before visiting with high-definition Google Street View 360° embeds and authentic photo mosaics of facades, interiors, and campus grounds.
            </p>
          </div>
        </div>

        {/* Directory Categories Section */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs mb-12">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-950">
            What We Map Across Bangalore
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            From central business districts to rapidly developing corridors across East, South, and North Bangalore:
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-gray-800">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span>➕</span>
              <span>Hospitals & Clinics</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span>🎓</span>
              <span>Schools & Colleges</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span>🍽️</span>
              <span>Cafes & Restaurants</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span>💻</span>
              <span>Tech Parks & Coworking</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span>🏬</span>
              <span>Retail & Supermarkets</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span>⛽</span>
              <span>Fuel & EV Stations</span>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="rounded-3xl bg-gray-950 p-8 sm:p-10 text-white text-center shadow-lg">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold">
            Own a business or manage a venue?
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            Get your place verified, add opening schedules, photos, contact numbers, and help thousands of visitors discover you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/submit"
              className="rounded-xl bg-[#e26a4f] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#d8583c] transition-colors shadow-xs"
            >
              + Submit Listing
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-gray-700 bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-colors"
            >
              Explore Map →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 sm:flex-row text-xs text-gray-500">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-gray-900">
            locatogo<span className="text-[#e26a4f]">.</span>
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
            © 2026 locatogo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

