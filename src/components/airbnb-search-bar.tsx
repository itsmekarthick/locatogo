"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Category, PlaceListing } from "@/components/modern-directory-explorer";
import { METRO_DOMAINS } from "@/components/modern-directory-explorer";

export type SearchSuggestion = {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  icon?: string;
  url?: string;
};

export type WhereOption = {
  id: string;
  name: string;
  subtitle?: string;
  flag?: string;
  slug?: string;
  domain_id?: string;
  lat?: number;
  lng?: number;
  isSelected?: boolean;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  isSelected?: boolean;
};

type Props = {
  mode?: "directory" | "tech_atlas";

  // Where Segment
  activeWhereName?: string;
  whereOptions?: WhereOption[];
  onSelectWhere?: (option: WhereOption) => void;
  whereLabel?: string;
  whereTabTitle?: string;

  // Category / Sector Segment
  categoryLabel?: string;
  activeCategoryName?: string;
  categoryOptions?: CategoryOption[];
  onSelectCategory?: (catId: string) => void;
  categoryTabTitle?: string;

  // Funding Stage (for tech atlas)
  selectedStage?: string;
  onSelectStage?: (stage: string) => void;
  stageOptions?: string[];

  // Search Query & Autocomplete Segment
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  suggestions?: SearchSuggestion[];
  onSelectSuggestion?: (id: string) => void;

  // Footer / Status
  totalCount?: number;
  totalLabel?: string;

  // Backwards compatibility props for ModernDirectoryExplorer
  activeMetroName?: string;
  onSelectMetro?: (metro: (typeof METRO_DOMAINS)[0]) => void;
  selectedCategory?: string;
  categories?: Category[];
  places?: PlaceListing[];
  onSelectPlace?: (placeId: string) => void;
  onLocateMe?: () => void;
  isLocating?: boolean;
};

export function AirbnbSearchBar({
  mode = "directory",

  // Where props
  activeWhereName,
  whereOptions,
  onSelectWhere,
  whereLabel = "Where",
  whereTabTitle,

  // Category props
  categoryLabel,
  activeCategoryName,
  categoryOptions,
  onSelectCategory,
  categoryTabTitle,

  // Stage props
  selectedStage,
  onSelectStage,
  stageOptions,

  // Search props
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  suggestions,
  onSelectSuggestion,

  // Footer
  totalCount,
  totalLabel,

  // Legacy / Directory props
  activeMetroName,
  onSelectMetro,
  selectedCategory,
  categories = [],
  places = [],
  onSelectPlace,
  onLocateMe,
  isLocating = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "where" | "category">("search");
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

  // Derived active values
  const isTechAtlas = mode === "tech_atlas";

  const resolvedWhereName =
    activeWhereName ||
    activeMetroName ||
    (isTechAtlas ? "Bengaluru 🇮🇳" : "All India");

  const activeCategoryObj = useMemo(() => {
    if (!categories.length) return null;
    return categories.find(
      (c) => c.id === selectedCategory || c.slug === selectedCategory
    );
  }, [categories, selectedCategory]);

  const resolvedCategoryLabel = categoryLabel || (isTechAtlas ? "Sector" : "Category");
  const resolvedCategoryName =
    activeCategoryName ||
    (activeCategoryObj ? activeCategoryObj.name : isTechAtlas ? "All Sectors" : "All Places");

  const resolvedPlaceholder =
    searchPlaceholder ||
    (isTechAtlas
      ? "Search 67,000+ companies, tech stack, roles..."
      : "Places, tech parks, cafes...");

  // Autocomplete suggestions based on search query
  const autocompleteSuggestions: SearchSuggestion[] = useMemo(() => {
    if (suggestions && suggestions.length > 0) {
      return suggestions.slice(0, 8);
    }
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
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: [p.locality, p.city].filter(Boolean).join(", "),
        badge: p.category_name,
        icon: "📍",
      }));
  }, [suggestions, places, searchQuery]);

  // Resolved Where Options
  const resolvedWhereOptions: WhereOption[] = useMemo(() => {
    if (whereOptions && whereOptions.length > 0) {
      return whereOptions;
    }
    return METRO_DOMAINS.map((m) => ({
      id: m.slug || "all",
      name: m.name,
      subtitle: m.slug ? "Metro Region" : "Pan-India Atlas",
      slug: m.slug,
      domain_id: m.domain_id,
      lat: m.lat,
      lng: m.lng,
      isSelected: activeMetroName?.toLowerCase() === m.name.toLowerCase(),
    }));
  }, [whereOptions, activeMetroName]);

  // Resolved Category Options
  const resolvedCategoryOptions: CategoryOption[] = useMemo(() => {
    if (categoryOptions && categoryOptions.length > 0) {
      return categoryOptions;
    }
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      isSelected: selectedCategory === c.id || selectedCategory === c.slug,
    }));
  }, [categoryOptions, categories, selectedCategory]);

  const handleSelectWhereItem = (item: WhereOption) => {
    if (onSelectWhere) {
      onSelectWhere(item);
    } else if (onSelectMetro) {
      const match = METRO_DOMAINS.find((m) => m.name === item.name) || {
        name: item.name,
        slug: item.slug || "",
        domain_id: item.domain_id || "",
        lat: item.lat || 20.5937,
        lng: item.lng || 78.9629,
      };
      onSelectMetro(match);
    }
    setIsOpen(false);
  };

  const handleSelectCategoryItem = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
    setIsOpen(false);
  };

  const handleSelectSuggestionItem = (sugg: SearchSuggestion) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(sugg.id);
    } else if (onSelectPlace) {
      onSelectPlace(sugg.id);
    }
    onSearchChange(sugg.title);
    setIsOpen(false);
  };

  const currentCount = totalCount ?? places.length;
  const currentCountLabel =
    totalLabel ||
    (isTechAtlas ? "companies loaded in active view" : "places loaded in active view");

  return (
    <div ref={popoverRef} className="relative w-full max-w-2xl">
      {/* 1. AIRBNB SIGNATURE UNIFIED SEARCH PILL */}
      <div
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className={`flex items-center justify-between rounded-full border bg-white dark:bg-slate-900 px-2 py-1.5 shadow-xs transition-all duration-200 cursor-pointer ${
          isOpen
            ? "border-slate-400 dark:border-slate-600 shadow-md ring-2 ring-slate-100 dark:ring-slate-800"
            : "border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        {/* Segment 1: Where / Destination */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab("where");
            setIsOpen(true);
          }}
          className="flex-1 px-3 py-1 text-left min-w-0"
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {whereLabel}
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {resolvedWhereName}
          </div>
        </button>

        <span className="h-5 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* Segment 2: Category / Sector */}
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
            {resolvedCategoryLabel}
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {resolvedCategoryName}
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
              {searchQuery ? searchQuery : resolvedPlaceholder}
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
                title="Clear search"
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
              {isTechAtlas ? "🔍 Search Companies" : "🔍 Search Places"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("where")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "where"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {whereTabTitle || (isTechAtlas ? "📍 Global Tech Hubs" : "📍 Metros & Cities")}
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
              {categoryTabTitle || (isTechAtlas ? "💼 Tech Sectors" : "🌐 Categories")}
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
                  placeholder={
                    isTechAtlas
                      ? "Search companies, tech stacks (React, Python, Go), roles..."
                      : "Type name, company, hospital, cafe, locality..."
                  }
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
                <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    {isTechAtlas ? "Matching Tech Companies" : "Matching Places"}
                  </div>
                  {autocompleteSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestionItem(item)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="text-base">{item.icon || "📍"}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-500 truncate">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                      {item.badge && (
                        <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WHERE / DESTINATIONS */}
          {activeTab === "where" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isTechAtlas ? "Select Global Innovation Hub" : "Select Metro City"}
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-0.5">
                {resolvedWhereOptions.map((opt) => {
                  const isSelected =
                    opt.isSelected ??
                    resolvedWhereName.toLowerCase().includes(opt.name.toLowerCase());

                  return (
                    <button
                      key={opt.id || opt.name}
                      type="button"
                      onClick={() => handleSelectWhereItem(opt)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#18181b] bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {opt.flag && <span className="text-base">{opt.flag}</span>}
                        <div className="text-xs font-bold truncate">{opt.name}</div>
                      </div>
                      {opt.subtitle && (
                        <div
                          className={`text-[10px] mt-0.5 ${
                            isSelected
                              ? "text-slate-400 dark:text-slate-600"
                              : "text-slate-500"
                          }`}
                        >
                          {opt.subtitle}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES / SECTORS */}
          {activeTab === "category" && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isTechAtlas ? "Browse by Sector" : "Browse by Place Category"}
                </div>
                <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-1">
                  <button
                    type="button"
                    onClick={() => handleSelectCategoryItem(isTechAtlas ? "all" : "")}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      resolvedCategoryName === (isTechAtlas ? "All Sectors" : "All Places")
                        ? "border-[#18181b] bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    🌐 {isTechAtlas ? "All Sectors" : "All Places"}
                  </button>
                  {resolvedCategoryOptions.map((cat) => {
                    const isSelected =
                      cat.isSelected ??
                      (activeCategoryName === cat.name ||
                        selectedCategory === cat.id ||
                        selectedCategory === cat.slug);

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategoryItem(cat.id)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "border-[#18181b] bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-bold shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {cat.icon && <span>{cat.icon}</span>}
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Tech Funding Stage filter if in Tech Atlas mode */}
              {isTechAtlas && stageOptions && onSelectStage && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Filter by Funding Stage
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stageOptions.map((stg) => {
                      const isStgSelected = (selectedStage || "all") === stg;
                      return (
                        <button
                          key={stg}
                          type="button"
                          onClick={() => onSelectStage(stg)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                            isStgSelected
                              ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                              : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {stg === "all" ? "All Stages" : stg}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {currentCount.toLocaleString()} {currentCountLabel}
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
