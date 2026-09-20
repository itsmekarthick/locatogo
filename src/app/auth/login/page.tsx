import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";
import { GoogleSignInButton } from "@/app/auth/google-sign-in-button";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  title: "Sign In | LocaToGo",
  description: "Sign in to your LocaToGo account to explore places, save favorites, add listings, and manage your directory.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Left Column: Brand Showcase & Value Proposition (Desktop) */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] bg-[#070b13] border-r border-slate-800/80 relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white select-none">
        {/* Ambient Aurora Glow Background Effects */}
        <div
          className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/25 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-40 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <BrandLogo size={36} className="group-hover:scale-105 transition-transform" />
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              LocaToGo<span className="text-cyan-400">.</span>
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 px-3 py-1 text-[11px] font-bold text-cyan-300 uppercase tracking-wider shadow-xs">
              <span>✨</span>
              <span>Next-Gen Directory & Place Engine</span>
            </span>
            <h1 className="mt-4 font-serif text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Discover, save & share real places people love.
            </h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Explore verified local businesses, hospitals, schools, cafes, and tech companies. Save your favorites, write reviews, and contribute places to the community atlas.
            </p>
          </div>

          {/* Core Feature Pillars */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5 backdrop-blur-sm shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 text-lg shrink-0 border border-cyan-800/60">
                🎯
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Exact GPS Coordinates</p>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  Pinpoint hospital casualty gates, school entrances, and parking hubs with ground truth accuracy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5 backdrop-blur-sm shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950 text-purple-400 text-lg shrink-0 border border-purple-800/60">
                💼
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Global Tech Atlas</p>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  Over 67,000 verified technology campuses, startups, and active job listings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3.5 backdrop-blur-sm shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 text-lg shrink-0 border border-emerald-800/60">
                ⭐
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Save, Review & Claim</p>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  Bookmark your favorite spots, write verified reviews, and claim your business listing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof / Brand Footer */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LocaToGo. All rights reserved.</p>
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
            <span className="font-serif text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100"><span className="animate-brand-reveal">LocaToGo<span className="text-cyan-600 dark:text-cyan-400">.</span></span>
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
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/70 dark:border-cyan-800/60 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Secure Sign In</span>
            </span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">
              Welcome back
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Sign in to explore places, manage your listings, and connect with your community.
            </p>
          </div>

          {/* Google SSO Login */}
          <GoogleSignInButton text="Continue with Google" next="/admin" />

          {/* OR Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Email / Password Form */}
          <AuthForm action={login} />

          {/* Switch to Signup */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/auth/signup"
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 hover:underline transition-colors"
              >
                Create a free account →
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Compliance Disclaimer */}
        <div className="mt-8 text-center text-[11px] text-slate-400 dark:text-slate-500">
          <span>By signing in, you agree to our </span>
          <Link href="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</Link>
          <span> and </span>
          <Link href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</Link>
          <span>.</span>
        </div>
      </div>
    </div>
  );
}
