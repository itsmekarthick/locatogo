"use client";

import { useRef, useState, useEffect } from "react";
import type { Category } from "@/components/modern-directory-explorer";

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("school") || lower.includes("education") || lower.includes("college")) return "🎓";
  if (lower.includes("restaurant") || lower.includes("cafe") || lower.includes("food") || lower.includes("dine")) return "☕";
  if (lower.includes("hospital") || lower.includes("clinic") || lower.includes("health") || lower.includes("medical")) return "🏥";
  if (lower.includes("hotel") || lower.includes("accommodation") || lower.includes("stay") || lower.includes("resort")) return "🏨";
  if (lower.includes("shopping") || lower.includes("mall")) return "🛍️";
  if (lower.includes("bank") || lower.includes("finance") || lower.includes("atm")) return "💳";
  if (lower.includes("tech") || lower.includes("cowork") || lower.includes("sez") || lower.includes("business park")) return "💻";
  if (lower.includes("temple") || lower.includes("religious") || lower.includes("church") || lower.includes("mosque")) return "🛕";
  if (lower.includes("government") || lower.includes("public")) return "🏛️";
  if (lower.includes("petrol") || lower.includes("automotive") || lower.includes("fuel") || lower.includes("bunk")) return "⛽";
  if (lower.includes("gym") || lower.includes("sport") || lower.includes("fitness")) return "🏋️";
  if (lower.includes("beauty") || lower.includes("spa") || lower.includes("salon")) return "💇";
  if (lower.includes("entertainment") || lower.includes("nightlife") || lower.includes("cinema")) return "🍿";
  if (lower.includes("park") || lower.includes("recreation") || lower.includes("garden")) return "🌳";
  if (lower.includes("transport") || lower.includes("metro") || lower.includes("transit")) return "🚇";
  if (lower.includes("grocer") || lower.includes("daily needs")) return "🛒";
  if (lower.includes("professional") || lower.includes("service")) return "💼";
  if (lower.includes("independent retail") || lower.includes("retail") || lower.includes("store")) return "🏪";
  if (lower.includes("community") || lower.includes("non-profit")) return "🤝";
  return "📍";
}

type Props = {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
};

export function AirbnbCategoryCarousel({
  categories,
  selectedCategory,
  onSelectCategory,
  activeFilterCount,
  onOpenFilters,
}: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollArrows = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollArrows();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollArrows);
      window.addEventListener("resize", checkScrollArrows);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScrollArrows);
      window.removeEventListener("resize", checkScrollArrows);
    };
  }, [categories]);

  const scrollBy = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative border-b border-slate-200/70 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 py-2 z-20">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2.5 sm:gap-4">
        {/* Carousel Container with Scroll Arrows */}
        <div className="relative flex-1 min-w-0 flex items-center">
          {/* Left Chevron Button */}
          {showLeftArrow && (
            <button
              onClick={() => scrollBy(-260)}
              className="absolute left-0 z-10 hidden sm:flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 shadow-md text-xs hover:scale-110 transition-all cursor-pointer backdrop-blur-xs text-slate-700 dark:text-slate-200"
              aria-label="Scroll left"
            >
              ❮
            </button>
          )}

          {/* Horizontal Scrollable Categories */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth px-0.5 py-0.5"
          >
            {/* All Places Item */}
            <button
              onClick={() => onSelectCategory("")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 select-none ${
                !selectedCategory
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs"
                  : "bg-slate-100/90 text-slate-700 hover:bg-slate-200 hover:text-slate-950 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white border border-slate-200/60 dark:border-slate-700/60 font-medium"
              }`}
            >
              <span className="text-sm leading-none">🌐</span>
              <span className="whitespace-nowrap">All Places</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;
              const icon = getCategoryIcon(cat.name);

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 select-none ${
                    isSelected
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs"
                      : "bg-slate-100/90 text-slate-700 hover:bg-slate-200 hover:text-slate-950 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white border border-slate-200/60 dark:border-slate-700/60 font-medium"
                  }`}
                >
                  <span className="text-sm leading-none">{icon}</span>
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Chevron Button */}
          {showRightArrow && (
            <button
              onClick={() => scrollBy(260)}
              className="absolute right-0 z-10 hidden sm:flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 shadow-md text-xs hover:scale-110 transition-all cursor-pointer backdrop-blur-xs text-slate-700 dark:text-slate-200"
              aria-label="Scroll right"
            >
              ❯
            </button>
          )}
        </div>

        {/* Right Side: Filters Modal Trigger Button */}
        <div className="shrink-0 flex items-center pl-1 sm:pl-2 border-l border-slate-200/60 dark:border-slate-800">
          <button
            onClick={onOpenFilters}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeFilterCount > 0
                ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950 shadow-xs"
                : "border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-2xs"
            }`}
          >
            <span className="text-xs">🎛️</span>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#06b6d4] text-[9px] text-white font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
