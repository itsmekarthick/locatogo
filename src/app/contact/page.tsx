"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    category: "general",
    placeName: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate reliable submission confirmation
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

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
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Contact Support</span>
        </div>

        {/* Top Hero Card */}
        <div className="border-b border-gray-200 pb-8 mb-10">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
            Helpdesk & Support
          </span>
          <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-bold text-gray-950">
            How can we assist you today?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl">
            Have questions about a listing, claiming your business profile, or reporting updated operating hours in Bangalore? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* LEFT: CONTACT FORM */}
          <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
                  ✓
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-950">
                  Message Received!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out, <strong>{formData.fullName}</strong>. Our local directory operations team in Bangalore will review your inquiry and get back to you at <strong>{formData.email}</strong> within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      fullName: "",
                      email: "",
                      category: "general",
                      placeName: "",
                      subject: "",
                      message: "",
                    });
                  }}
                  className="mt-6 rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-black transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Karthik Sundaram"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="general">General Question</option>
                      <option value="claim">Claiming an Existing Place</option>
                      <option value="update">Update Place Coordinates/Hours</option>
                      <option value="verification">Official Verification Request</option>
                      <option value="bug">Report a Technical Bug</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Place / Business Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.placeName}
                      onChange={(e) => setFormData({ ...formData, placeName: e.target.value })}
                      placeholder="e.g. Edify School / Narayana Hospital"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief summary of your request"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Message Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe how we can help you with this place or inquiry..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gray-950 py-3 text-xs font-bold text-white hover:bg-black transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? "Sending..." : "Submit Support Message →"}</span>
                </button>
              </form>
            )}
          </div>

          {/* RIGHT: QUICK CONTACT CHANNELS & FAQ */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-base font-bold text-gray-950">
                Direct Channels
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-lg">📧</span>
                  <div>
                    <span className="font-bold text-gray-900 block">Support Email</span>
                    <a href="mailto:support@locatogo.in" className="text-gray-600 hover:text-[#e26a4f] transition-colors">
                      support@locatogo.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-lg">📍</span>
                  <div>
                    <span className="font-bold text-gray-900 block">Headquarters</span>
                    <p className="text-gray-500">Bangalore, Karnataka, India</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-lg">⏱️</span>
                  <div>
                    <span className="font-bold text-gray-900 block">Response Time</span>
                    <p className="text-gray-500">Under 24 hours on business days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs Quick Card */}
            <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-base font-bold text-gray-950">
                Frequently Asked
              </h3>

              <div className="space-y-3 text-xs text-gray-600 divide-y divide-gray-100">
                <div className="pt-2">
                  <h4 className="font-bold text-gray-900">How do I add my school or clinic?</h4>
                  <p className="mt-1 text-gray-500">Click &ldquo;+ Add Place&rdquo; in the top bar to submit coordinates and timings.</p>
                </div>

                <div className="pt-3">
                  <h4 className="font-bold text-gray-900">Is listing on Locatogo free?</h4>
                  <p className="mt-1 text-gray-500">Yes, standard directory listings and verified coordinates are 100% free.</p>
                </div>

                <div className="pt-3">
                  <h4 className="font-bold text-gray-900">How do I claim an existing place?</h4>
                  <p className="mt-1 text-gray-500">Open any place page and click &ldquo;Claim&rdquo; next to the title.</p>
                </div>
              </div>
            </div>
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
            <Link href="/about" className="hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-gray-950 font-bold">
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

