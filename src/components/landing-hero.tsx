"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LandingHero({ totalListings = 50, totalCategories = 12 }: { totalListings?: number; totalCategories?: number }) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  }

  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
      {/* Ambient background glows with Indigo & Cyan gradient (Zero orange) */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[650px] w-[950px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/20 via-sky-400/15 to-violet-500/20 blur-3xl opacity-70 dark:opacity-35" />
      <div className="pointer-events-none absolute top-1/2 right-0 -z-10 h-[400px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl opacity-50" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-indigo-200/60 bg-indigo-50/70 dark:border-indigo-900/60 dark:bg-indigo-950/50 px-4 py-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200 shadow-2xs backdrop-blur-md transition-all hover:scale-105">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>Next-Gen Multi-Domain Atlas</span>
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            v4.0 Live
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="mt-8 font-serif text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl lg:text-7xl leading-[1.1]">
          Explore the world with an{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">
            intelligent interactive atlas
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          Search thousands of verified businesses, healthcare centers, tech parks, cafes, and community assets with live map clustering, real-time weather, and 1-click transit.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-2xl">
          <div className="group relative flex items-center rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2 shadow-xl backdrop-blur-md transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
            <div className="flex flex-1 items-center px-3 gap-3">
              <span className="text-xl text-slate-400 dark:text-slate-500">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by place name, specialty, or neighborhood..."
                className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore</span>
              <span>↗</span>
            </button>
          </div>

          {/* Quick Popular Tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Trending:</span>
            {["Hospitals", "Tech Hubs", "Cafes", "Colleges", "Metro Stations", "Hotels"].map((tag) => (
              <Link
                key={tag}
                href={`/?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
              >
                {tag}
              </Link>
            ))}
          </div>
        </form>

        {/* CTA Button Row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-slate-900 dark:bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all flex items-center gap-2"
          >
            <span>Launch Live Atlas</span>
            <span>🗺️</span>
          </Link>
          <Link
            href="/submit"
            className="rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            + Add Your Business
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 px-8 py-3.5 text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 transition-all"
          >
            Admin Workspace ⚙️
          </Link>
        </div>

        {/* Interactive Interactive Preview Card Mockup */}
        <div className="mt-16 sm:mt-20 relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
          {/* Mockup Browser Top Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </div>
              <span className="ml-2 rounded-md bg-white dark:bg-slate-900 px-3 py-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                https://locatogo.com/atlas/live
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Map Online
              </span>
            </div>
          </div>

          {/* Mockup Preview Visual Content */}
          <div className="relative h-[260px] sm:h-[340px] w-full bg-gradient-to-br from-slate-100 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/20 p-6 flex items-center justify-center overflow-hidden">
            {/* Grid Pattern overlay */}
            <div
              className="absolute inset-0 opacity-40 dark:opacity-20"
              style={{
                backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Floating Simulated Map Pins & Popups */}
            <div className="relative z-10 grid gap-4 sm:grid-cols-3 max-w-3xl w-full">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-lg backdrop-blur-md transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                    Healthcare
                  </span>
                  <span className="text-[11px] text-slate-400">★ 4.9</span>
                </div>
                <h4 className="mt-2 font-bold text-sm text-slate-900 dark:text-slate-100">Apollo Multi-Specialty</h4>
                <p className="mt-1 text-xs text-slate-500">📍 Bannerghatta Road</p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    Open 24/7
                  </span>
                  <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    🚕 Uber Ready
                  </span>
                </div>
              </div>

              <div className="hidden sm:block rounded-2xl border border-indigo-300 dark:border-indigo-700 bg-white/95 dark:bg-slate-900/95 p-4 shadow-xl backdrop-blur-md ring-2 ring-indigo-500/20 transform sm:-translate-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                    ⭐ Featured Tech
                  </span>
                  <span className="text-[11px] text-amber-500 font-bold">★ 5.0</span>
                </div>
                <h4 className="mt-2 font-bold text-sm text-slate-900 dark:text-slate-100">Infosys Global Campus</h4>
                <p className="mt-1 text-xs text-slate-500">📍 Electronics City Phase 1</p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Verified Hub
                  </span>
                </div>
              </div>

              <div className="hidden sm:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-lg backdrop-blur-md transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                    Education
                  </span>
                  <span className="text-[11px] text-slate-400">★ 4.8</span>
                </div>
                <h4 className="mt-2 font-bold text-sm text-slate-900 dark:text-slate-100">Alliance University</h4>
                <p className="mt-1 text-xs text-slate-500">📍 Anekal Main Road</p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    💬 WhatsApp Inquiry
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
