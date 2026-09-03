import type { Metadata } from "next";
import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";
import { GoogleSignInButton } from "@/app/auth/google-sign-in-button";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  title: "Create Free Account | Locatogo",
  description: "Join Locatogo for free. Explore verified places, save favorites, write reviews, add businesses, and discover your city.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Left Column: Brand Showcase & Value Proposition (Desktop) */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] bg-[#070b13] border-r border-slate-800/80 relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white select-none">
        {/* Ambient Aurora Glow Background Effects */}
        <div
          className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-40 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <BrandLogo size={36} className="group-hover:scale-105 transition-transform" />
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              locatogo<span className="text-indigo-400">.</span>
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-md"
          >
            <span>← Live Map Atlas</span>
          </Link>
        </div>

        {/* Centerpiece Value Highlights */}
        <div className="relative z-10 my-auto py-12 max-w-lg space-y-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-wider shadow-xs">
              <span>🚀</span>
              <span>100% Free · No Credit Card</span>
            </span>
            <h1 className="mt-4 font-serif text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Your city, mapped with places that matter.
            </h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Join residents, business owners, and explorers who save, review, and discover real places in their community.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm shadow-2xs">
              <p className="text-2xl font-extrabold font-serif text-indigo-400">67,000+</p>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">Verified Places</p>
              <p className="text-[11px] text-slate-400 mt-1">Schools, hospitals, cafes, tech companies & more.</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm shadow-2xs">
              <p className="text-2xl font-extrabold font-serif text-emerald-400">Free</p>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">Forever</p>
              <p className="text-[11px] text-slate-400 mt-1">Save, review, and explore at no cost.</p>
            </div>
          </div>

          {/* Core Feature Checklist */}
          <div className="space-y-2.5 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Explore an interactive GPS-verified map with real places</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Save favorites, write reviews & claim your business</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Add places the community needs but can&apos;t find</span>
            </div>
          </div>
        </div>

        {/* Bottom Brand Footer */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Locatogo. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
        {/* Mobile Header (Hidden on lg+) */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo size={32} />
            <span className="font-serif text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
              locatogo<span className="text-indigo-600 dark:text-indigo-400">.</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            ← Live Map
          </Link>
        </div>

        {/* Main Card */}
        <div className="my-auto mx-auto w-full max-w-md">
          {/* Top Badge & Header */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Get Started Free</span>
            </span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">
              Create your account
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Join the community. Explore places, save favorites, and add businesses.
            </p>
          </div>

          {/* Google SSO Sign Up */}
          <GoogleSignInButton text="Sign up with Google" next="/admin" />

          {/* OR Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              or register with email
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Signup Form */}
          <AuthForm action={signup} signup />

          {/* Switch to Login */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors"
              >
                Sign in to your account →
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Compliance Disclaimer */}
        <div className="mt-8 text-center text-[11px] text-slate-400 dark:text-slate-500">
          <span>By registering, you agree to our </span>
          <Link href="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</Link>
          <span> and </span>
          <Link href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</Link>
          <span>.</span>
        </div>
      </div>
    </div>
  );
}
