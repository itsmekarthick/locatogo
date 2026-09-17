"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { submitContactForm, type ContactFormState } from "./actions";
import { PublicHeader } from "@/components/public-header";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-gray-950 py-3 text-xs font-bold text-white hover:bg-black transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {pending ? "Sending..." : "Submit Support Message →"}
    </button>
  );
}

export default function ContactSupportPage() {
  const [state, formAction] = useActionState(submitContactForm, {} as ContactFormState);
  const supportHq = process.env.NEXT_PUBLIC_SUPPORT_HQ ?? "Bangalore, Karnataka, India";

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-[#070b13] font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* Unified Public Navigation Header */}
      <PublicHeader />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-10 sm:py-16">
        <nav className="mb-6 flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-700">Contact Support</span>
        </nav>

        <div className="mb-10 sm:mb-12">
          <span className="inline-block rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700 tracking-wide uppercase">
            Helpdesk & Support
          </span>
          <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-bold tracking-tight text-gray-950">
            How can we assist you today?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl">
            Have questions about a listing, claiming your business profile, or reporting updated operating hours? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* LEFT: CONTACT FORM */}
          <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs">
            {state.success ? (
              <div className="py-12 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
                  ✓
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-950">
                  Message Received!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  {state.success}
                </p>
                <Link
                  href="/"
                  className="inline-block mt-6 rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-black transition-colors"
                >
                  Return to Atlas
                </Link>
              </div>
            ) : (
              <form action={formAction} className="space-y-5 text-xs">
                {state.error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 font-medium">
                    {state.error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="fullName"
                      type="text"
                      required
                      placeholder="e.g. Karthik Sundaram"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
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
                      name="category"
                      defaultValue="general"
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
                      name="placeName"
                      type="text"
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
                    name="subject"
                    type="text"
                    required
                    placeholder="Brief summary of your request"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Message Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Describe how we can help you with this place or inquiry..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none transition-colors leading-relaxed"
                  />
                </div>

                <SubmitBtn />
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
                    <p className="text-gray-500">{supportHq}</p>
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
                  <h4 className="font-bold text-gray-900">Is listing on LocaToGo free?</h4>
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
            LocaToGo<span className="text-[#e26a4f]">.</span>
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
            © 2026 LocaToGo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
