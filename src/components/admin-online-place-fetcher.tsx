"use client";

import { useState, useTransition } from "react";
import { bulkInsertOnlinePlaces, type OnlinePlaceToInsert } from "@/app/admin/actions";

type Domain = { id: string; name: string; slug: string };
type Category = { id: string; name: string };

type FetchedPlace = {
  title: string;
  slug: string;
  latitude: number;
  longitude: number;
  addressLine1: string;
  locality: string;
  city: string;
  administrativeArea: string;
  countryCode: string;
  postalCode: string;
  rawCategory: string;
  displayName: string;
  website?: string;
  companyType?: string;
  fundingStage?: string;
  techStack?: string[];
  jobs?: {
    title: string;
    dept?: string;
    type: "on_site" | "hybrid" | "remote";
    salary?: string;
    apply: string;
  }[];
};

export function AdminOnlinePlaceFetcher({
  domains,
  categories,
}: {
  domains: Domain[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("Hospitals in Bengaluru");
  const [fetchLimit, setFetchLimit] = useState<number>(50);
  const [selectedDomainId, setSelectedDomainId] = useState(domains[0]?.id || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FetchedPlace[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Dynamic Preset Categories (Works for any selected city domain)
  const presets = [
    { label: "🏢 IT Companies & GCCs", q: "IT Companies" },
    { label: "💻 Tech Parks & SEZ", q: "Tech Parks" },
    { label: "🚀 Startups & Co-Working", q: "Startups" },
    { label: "🏥 Hospitals & Clinics", q: "Hospitals" },
    { label: "☕ Cafes & Restaurants", q: "Cafes" },
    { label: "🛍️ Shopping Malls", q: "Shopping Malls" },
    { label: "🚇 Metro & Transit", q: "Metro Stations" },
    { label: "🌳 Gardens & Public Parks", q: "Gardens" },
  ];

  async function handleFetch(customQuery?: string) {
    const q = customQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/places/fetch-online?q=${encodeURIComponent(q.trim())}&limit=${fetchLimit}&domainId=${selectedDomainId}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch places");
      }
      setResults(data.places || []);
      // Select all by default
      setSelectedIndices(new Set((data.places || []).map((_: any, i: number) => i)));
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error fetching online data",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function toggleIndex(idx: number) {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  }

  function toggleAll() {
    if (selectedIndices.size === results.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(results.map((_, i) => i)));
    }
  }

  function handleImport() {
    if (!selectedDomainId || !selectedCategoryId) {
      setFeedback({ type: "error", message: "Please choose both a target domain and category." });
      return;
    }

    const placesToInsert: OnlinePlaceToInsert[] = results
      .filter((_, i) => selectedIndices.has(i))
      .map((p) => ({
        title: p.title,
        slug: p.slug,
        latitude: p.latitude,
        longitude: p.longitude,
        addressLine1: p.addressLine1,
        locality: p.locality,
        city: p.city,
        administrativeArea: p.administrativeArea,
        countryCode: p.countryCode,
        postalCode: p.postalCode,
        shortDescription: `Verified landmark in ${p.locality}, Bengaluru.`,
        website: p.website,
        companyType: p.companyType,
        fundingStage: p.fundingStage,
        techStack: p.techStack,
        jobs: p.jobs,
      }));

    if (!placesToInsert.length) {
      setFeedback({ type: "error", message: "Select at least 1 place to import." });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await bulkInsertOnlinePlaces(selectedDomainId, selectedCategoryId, placesToInsert);
        setFeedback({
          type: "success",
          message: `Successfully added ${result.success} new places! (${result.duplicates} existing places safely skipped, ${result.errors} errors)`,
        });
        // Clear results on successful import
        if (result.success > 0 || result.duplicates > 0) {
          setResults([]);
          setSelectedIndices(new Set());
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Import failed",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Query Search & Configuration Card */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
              🌐 Live Online Place Importer
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Search by broad category OR specific place names (e.g. "Toit Indiranagar", "Manipal Hospital HAL Road", "IIM Bangalore")
            </p>
          </div>

          <span className="rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 px-3 py-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
            Real GPS Coordinates
          </span>
        </div>

        {/* Preset Quick Chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setQuery(preset.q);
                handleFetch(preset.q);
              }}
              className="rounded-full border border-[var(--line)] bg-[var(--background)] px-3.5 py-1.5 text-xs font-medium text-[var(--foreground)] hover:border-cyan-400 hover:text-cyan-600 transition-colors cursor-pointer shadow-2xs"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Search & Configuration Controls */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Search Place Name or Category
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                placeholder="e.g. Apollo Hospital, Manyata Tech Park, Toit, Christ University, Truffles..."
                className="flex-1 rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleFetch()}
                disabled={isLoading}
                className="rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 transition-all disabled:opacity-50 cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Searching Online...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Fetch Online Places</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Fetch Limit Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Results Limit
            </label>
            <select
              value={fetchLimit}
              onChange={(e) => setFetchLimit(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2.5 text-xs font-semibold focus:outline-none"
            >
              <option value={20}>20 Places</option>
              <option value={50}>50 Places (Recommended)</option>
              <option value={100}>100 Places (City-wide)</option>
            </select>
          </div>

          {/* Domain Dropdown */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Target Atlas Domain <span className="text-[var(--coral)]">*</span>
            </label>
            <select
              value={selectedDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2.5 text-xs font-semibold focus:outline-none"
            >
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (/{d.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              Assign Category <span className="text-[var(--coral)]">*</span>
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2.5 text-xs font-semibold focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-[var(--line)] pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-[var(--foreground)]">
                Live Places Found ({results.length})
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                {selectedIndices.size} of {results.length} places selected for direct database insertion
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleAll}
                className="rounded-full border border-[var(--line)] bg-[var(--background)] px-3.5 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)] transition-colors cursor-pointer"
              >
                {selectedIndices.size === results.length ? "Deselect All" : "Select All"}
              </button>

              <button
                type="button"
                onClick={handleImport}
                disabled={isPending || selectedIndices.size === 0}
                className="rounded-full bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Inserting into DB...</span>
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    <span>Import {selectedIndices.size} Places into Atlas</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Place Cards Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto pr-1">
            {results.map((place, idx) => {
              const isSelected = selectedIndices.has(idx);
              return (
                <div
                  key={`${place.title}-${idx}`}
                  onClick={() => toggleIndex(idx)}
                  className={`rounded-2xl border p-4 transition-all cursor-pointer flex gap-3.5 ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-50/30 dark:bg-cyan-950/30 shadow-xs"
                      : "border-[var(--line)] bg-[var(--background)] opacity-70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleIndex(idx)}
                    className="mt-1 h-4 w-4 rounded accent-cyan-600 cursor-pointer shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-[var(--foreground)] truncate">
                      {place.title}
                    </h4>
                    <p className="mt-1 text-[11px] text-[var(--ink-muted)] line-clamp-1">
                      📍 {place.addressLine1}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                      <span>Lat: {place.latitude.toFixed(4)}</span>
                      <span>•</span>
                      <span>Lng: {place.longitude.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
