"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CompanySuggestion = {
  id: string;
  title: string;
  slug: string;
  city?: string | null;
  locality?: string | null;
  company_type?: string | null;
};

export function LandingHero({ totalListings = 50, totalCategories = 12 }: { totalListings?: number; totalCategories?: number }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/tech-atlas/companies?q=${encodeURIComponent(query)}&limit=20`, {
          signal: controller.signal,
        });
        const data = response.ok ? await response.json() : { companies: [] };
        setSuggestions(Array.isArray(data.companies) ? data.companies : []);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  }

  function handleSuggestionSelect(company: CompanySuggestion) {
    setSearchQuery(company.title);
    setSuggestions([]);
    router.push(`/?q=${encodeURIComponent(company.title)}`);
  }

  return (
    <section className="relative overflow-x-clip pt-16 pb-20 sm:pt-24 sm:pb-32">
      {/* Ambient background glows with Indigo & Cyan gradient (Zero orange) */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[650px] w-[950px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-400/15 to-violet-500/20 blur-3xl opacity-70 dark:opacity-35" />
      <div className="pointer-events-none absolute top-1/2 right-0 -z-10 h-[400px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl opacity-50" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-200/60 bg-cyan-50/70 dark:border-cyan-900/60 dark:bg-cyan-950/50 px-4 py-1.5 text-xs font-semibold text-cyan-900 dark:text-cyan-200 shadow-2xs backdrop-blur-md transition-all hover:scale-105">
          <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>Global Tech Atlas</span>
          <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            v4.0 Live
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="mt-8 font-serif text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl lg:text-7xl leading-[1.1]">
          Find the companies shaping{" "}
          <span className="bg-gradient-to-r from-cyan-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">
            the next tech economy
          </span>
          .
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          Explore technology companies, startups, AI labs, MNC GCCs, and active roles across the world&apos;s most important innovation hubs.
        </p>

        {/* Search Bar - Unified Pill Style */}
        <form onSubmit={handleSearch} className="relative z-50 mx-auto mt-10 max-w-2xl">
          <div className="group relative flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2 shadow-xl backdrop-blur-md transition-all focus-within:border-slate-400 dark:focus-within:border-slate-600 focus-within:ring-4 focus-within:ring-slate-100 dark:focus-within:ring-slate-800/60">
            {/* Segment 1: Where */}
            <Link
              href="/"
              className="hidden sm:flex flex-col px-4 py-1 text-left border-r border-slate-200 dark:border-slate-800 shrink-0 hover:opacity-80 transition-opacity"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Where
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Global hubs
              </span>
            </Link>

            {/* Segment 2: Keyword input */}
            <div className="relative flex flex-1 items-center px-4 gap-3 min-w-0">
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search companies, roles, sectors, or hubs..."
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {searchQuery.trim().length >= 3 && (suggestions.length > 0 || isSearching) && (
              <div className="absolute left-2 right-2 top-full z-[100] mt-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {isSearching && suggestions.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">Searching companies...</p>
                ) : (
                  suggestions.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => handleSuggestionSelect(company)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">{company.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                          {[company.locality, company.city].filter(Boolean).join(", ") || "Global tech company"}
                        </span>
                      </span>
                      <span className="ml-3 shrink-0 text-xs text-cyan-600 dark:text-cyan-400">Open Atlas →</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Round Coral Action Button */}
            <button
              type="submit"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white shadow-md hover:scale-105 transition-all shrink-0 cursor-pointer"
              title="Search Atlas"
            >
              <span className="text-sm">🔍</span>
            </button>
          </div>

          {/* Quick Popular Tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Trending:</span>
            {["AI startups", "SaaS companies", "GCCs", "Fintech", "Remote jobs", "Bengaluru"].map((tag) => (
              <Link
                key={tag}
                href={`/?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors shadow-2xs"
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
            className="rounded-full bg-slate-900 dark:bg-cyan-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-slate-800 dark:hover:bg-cyan-500 transition-all flex items-center gap-2"
          >
            <span>Explore Tech Atlas</span>
            <span>→</span>
          </Link>
          <Link
            href="/submit"
            className="rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            Add a Company
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/50 dark:bg-cyan-950/40 px-8 py-3.5 text-sm font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100/70 transition-all"
          >
            For Atlas Operators
          </Link>
        </div>

      </div>
    </section>
  );
}
