"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Category, PlaceListing } from "@/components/modern-directory-explorer";
import { METRO_DOMAINS } from "@/components/modern-directory-explorer";

type Props = {
  activeMetroName: string;
  onSelectMetro: (metro: (typeof METRO_DOMAINS)[0]) => void;
  selectedCategory: string;
  categories: Category[];
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectPlace?: (placeId: string) => void;
  places: PlaceListing[];
  onLocateMe?: () => void;
  isLocating?: boolean;
};

export function AirbnbSearchBar({
  activeMetroName,
  onSelectMetro,
  selectedCategory,
  categories,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onSelectPlace,
  places,
  onLocateMe,
  isLocating = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"metro" | "category" | "search">("search");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Autocomplete suggestions based on search query
  const autocompleteSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return places
      .filter((p) => {
        return (
          p.title.toLowerCase().includes(q) ||
          p.locality?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [places, searchQuery]);

  const activeCategoryObj = categories.find(
    (c) => c.id === selectedCategory || c.slug === selectedCategory
  );

  return (
    <div ref={popoverRef} className="relative w-full max-w-2xl">
      {/* 1. AIRBNB SIGNATURE UNIFIED SEARCH PILL */}
      <div
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className={`flex items-center justify-between rounded-full border bg-white dark:bg-slate-900 px-2 py-1.5 shadow-sm transition-all duration-200 cursor-pointer ${
          isOpen
            ? "border-slate-400 dark:border-slate-600 shadow-md ring-2 ring-slate-100 dark:ring-slate-800"
            : "border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300"
        }`}
      >
        {/* Segment 1: Metro Destination */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab("metro");
            setIsOpen(true);
          }}
          className="flex-1 px-3 py-1 text-left min-w-0"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Where
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {activeMetroName || "All India"}
          </div>
        </button>

        <span className="h-5 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* Segment 2: Category */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab("category");
            setIsOpen(true);
          }}
          className="flex-1 px-3 py-1 text-left min-w-0 hidden sm:block"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Category
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {activeCategoryObj ? activeCategoryObj.name : "All Places"}
          </div>
        </button>

        <span className="h-5 w-px bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

        {/* Segment 3: Search Query / Keyword */}
        <div className="flex-[1.4] px-3 py-1 min-w-0 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Search
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {searchQuery ? searchQuery : "Places, tech parks..."}
            </div>
          </div>

          {/* Airbnb Coral Round Search Button */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSearchChange("");
                }}
                className="h-6 w-6 rounded-full flex items-center justify-center text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#e26a4f] to-[#d8583c] text-white shadow-xs hover:scale-105 transition-transform">
              <span className="text-xs">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. EXPANDABLE AIRBNB POPOVER PANEL */}
      {isOpen && (
        <div className="absolute top-14 left-0 right-0 z-50 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Top Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "search"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              🔍 Search Places
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("metro")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "metro"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              📍 Metros & Cities
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("category")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "category"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              🌐 Categories
            </button>
          </div>

          {/* TAB 1: SEARCH INPUT & AUTOCOMPLETE */}
          {activeTab === "search" && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Type name, company, hospital, cafe, locality..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#e26a4f] focus:ring-1 focus:ring-[#e26a4f]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Clear ✕
                  </button>
                )}
              </div>

              {/* Autocomplete List */}
              {autocompleteSuggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Matching Places
                  </div>
                  {autocompleteSuggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => {
                        if (onSelectPlace) onSelectPlace(place.id);
                        onSearchChange(place.title);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="text-base">📍</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {place.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {[place.locality, place.city].filter(Boolean).join(", ")}
                          </div>
                        </div>
                      </div>
                      {place.category_name && (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                          {place.category_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: METROS & DESTINATIONS */}
          {activeTab === "metro" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Metro City
                </span>
                {onLocateMe && (
                  <button
                    type="button"
                    onClick={() => {
                      onLocateMe();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#e26a4f] hover:underline cursor-pointer"
                  >
                    <span>{isLocating ? "⏳" : "🎯"}</span>
                    <span>{isLocating ? "Detecting GPS..." : "Near Me (GPS)"}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {METRO_DOMAINS.map((metro) => {
                  const isSelected = activeMetroName.toLowerCase() === metro.name.toLowerCase();
                  return (
                    <button
                      key={metro.name}
                      type="button"
                      onClick={() => {
                        onSelectMetro(metro);
                        setIsOpen(false);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#18181b] bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{metro.name}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? "text-slate-400 dark:text-slate-600" : "text-slate-500"}`}>
                        {metro.slug ? "Metro Region" : "Pan-India Atlas"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === "category" && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Browse by Place Category
              </div>
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory("");
                    setIsOpen(false);
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    !selectedCategory
                      ? "border-[#18181b] bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  🌐 All Places
                </button>
                {categories.map((cat) => {
                  const isSelected =
                    selectedCategory === cat.id || selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.id);
                        setIsOpen(false);
                      }}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#18181b] bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-bold shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {places.length} places loaded in active view
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-slate-900 dark:bg-white px-5 py-2 text-xs font-bold text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
