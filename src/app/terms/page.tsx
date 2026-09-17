import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";

export const metadata: Metadata = {
  title: "Terms & Conditions | LocaToGo",
  description: "Read the Terms and Conditions for using the LocaToGo directory atlas platform and place discovery services.",
};

export default function TermsPage() {
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
          <span className="text-gray-900 font-semibold">Terms & Conditions</span>
        </div>

        {/* Title Card */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
            Legal Agreement
          </span>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-gray-950">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-xs text-gray-500">
            Last Updated: August 30, 2026 · Effective Immediately
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or using the LocaToGo website, web applications, APIs, or directory services (collectively, &ldquo;LocaToGo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please discontinue use of the platform.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              2. Platform Services & Directory Information
            </h2>
            <p>
              LocaToGo serves as an interactive local directory platform mapping places, businesses, schools, medical centers, tech campuses, and points of interest. While we strive to verify coordinates, operational hours, contact numbers, and amenities, directory information is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind.
            </p>
            <p>
              We recommend contacting venues directly or confirming operational status for critical emergencies or strict schedule requirements.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              3. User Submissions & Place Claiming
            </h2>
            <p>
              Users and business owners may submit new places, edit details, or initiate claim requests for existing listings:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>You represent that all submitted information (business title, phone number, address, opening schedule) is accurate and truthful.</li>
              <li>You agree not to submit fraudulent, deceptive, defamatory, or copyright-infringing content or imagery.</li>
              <li>LocaToGo reserves the right to review, edit, reject, or remove any listing at our sole discretion without prior notice.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              4. Third-Party Links & Transit Integrations
            </h2>
            <p>
              LocaToGo offers 1-click deep links to third-party services including Uber, Ola Cabs, WhatsApp, and Google Maps:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>Ride bookings, pricing, driver availability, and communication on external apps are governed entirely by the terms and policies of those third-party providers.</li>
              <li>LocaToGo is not liable for transactions, rides, communication outcomes, or services rendered by third-party platforms.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              5. Intellectual Property
            </h2>
            <p>
              The LocaToGo branding, design layout, map markers, database schema, and custom software code are the intellectual property of LocaToGo. Map tiles and geographic data are provided under respective licenses from OpenStreetMap contributors and Esri/Maxar.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, LocaToGo, its founders, and contributors shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the platform, including inaccuracies in directions, travel times, or business hours.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              7. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-3">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              8. Contacting Us
            </h2>
            <p>
              If you have any questions regarding these Terms & Conditions, please contact us at:
            </p>
            <p className="font-semibold text-gray-900">
              Email: <a href="mailto:support@locatogo.in" className="text-[#e26a4f] hover:underline">support@locatogo.in</a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 sm:flex-row text-xs text-gray-500">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-gray-900">
            LocaToGo<span className="text-[#e26a4f]">.</span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-gray-600">
            <Link href="/about" className="hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="/terms" className="text-gray-950 font-bold">
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

