import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Locatogo",
  description: "Learn how Locatogo protects your privacy, handles location data, and manages user information.",
};

export default function PrivacyPolicyPage() {
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
              <span>Bangalore Atlas</span>
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
          <span className="text-gray-900 font-semibold">Privacy Policy</span>
        </div>

        {/* Title Card */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-900 uppercase tracking-wider">
            Your Data & Privacy
          </span>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-gray-950">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-gray-500">
            Last Updated: August 30, 2026 · Committed to user data protection
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              1. Overview & Commitment
            </h2>
            <p>
              At Locatogo (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), we respect your privacy and are committed to protecting any information collected while operating our local directory and mapping services. This policy outlines how we handle location data, listing submissions, and usage telemetry.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              2. Location Data & Geolocation
            </h2>
            <p>
              Locatogo offers a &ldquo;My Location&rdquo; feature to calculate driving distance, walking time, and nearby places in Bangalore:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>Client-Side Only:</strong> Your exact GPS coordinates are processed locally within your browser to center the map and calculate relative distances.</li>
              <li><strong>No Continuous Tracking:</strong> We do NOT track your background movement or store a log of your personal location history on our servers.</li>
              <li><strong>Permission Controlled:</strong> Location access is entirely voluntary and only activated when you explicitly grant browser permission or click &ldquo;My Location&rdquo;.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              3. Information You Provide
            </h2>
            <p>
              When you submit a new listing, claim a business, or contact our support team, we may collect:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>Business contact details (name, email address, phone/WhatsApp number, physical address).</li>
              <li>Listing metadata (place title, operational hours, category, description, and website URL).</li>
              <li>Messages or inquiries submitted through our support forms.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              4. How We Use Information
            </h2>
            <p>
              The information we collect is strictly used to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>Publish and verify accurate local business directory profiles.</li>
              <li>Provide route estimations and calculate driving distances in Bangalore.</li>
              <li>Respond to inquiries, support tickets, and business claim verifications.</li>
              <li>Prevent fraud, spam listings, and malicious activity on the platform.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              5. Third-Party Services
            </h2>
            <p>
              We integrate with trusted service providers to power map tiles, transit deep links, and database storage:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>Map Infrastructure:</strong> OpenStreetMap and Esri ArcGIS for base map tiles.</li>
              <li><strong>Google Places API:</strong> For verified ratings, operating schedules, and Street View 360° panoramas.</li>
              <li><strong>Database & Authentication:</strong> Supabase cloud infrastructure with encrypted data at rest and in transit.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              6. Data Retention & Deletion
            </h2>
            <p>
              Business owners and users have the right to request modification or complete deletion of their listing data or contact records at any time by contacting our support team at <a href="mailto:support@locatogo.in" className="text-[#e26a4f] hover:underline font-semibold">support@locatogo.in</a>.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              7. Updates to this Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated &ldquo;Last Updated&rdquo; date.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 sm:flex-row text-xs text-gray-500">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-gray-900">
            locatogo<span className="text-[#e26a4f]">.</span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-gray-600">
            <Link href="/about" className="hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-gray-950 font-bold">
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

