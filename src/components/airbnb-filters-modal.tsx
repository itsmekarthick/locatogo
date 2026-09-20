"use client";

import { useEffect, useState } from "react";
import { AMENITIES_LIST } from "@/components/modern-directory-explorer";

export type FilterState = {
  minRating: number | null;
  radiusKm: number | null;
  selectedAmenities: string[];
  featuredOnly: boolean;
  verifiedOnly: boolean;
  selectedArea: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (newFilters: FilterState) => void;
  onReset: () => void;
  totalMatchingPlaces: number;
  availableAreas: string[];
  hasUserLocation: boolean;
  onLocateMe?: () => void;
};

export function AirbnbFiltersModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  totalMatchingPlaces,
  availableAreas,
  hasUserLocation,
  onLocateMe,
}: Props) {
  const [draft, setDraft] = useState<FilterState>(filters);

  // Sync draft when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen, filters]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAmenity = (id: string) => {
    setDraft((prev) => {
      const exists = prev.selectedAmenities.includes(id);
      return {
        ...prev,
        selectedAmenities: exists
          ? prev.selectedAmenities.filter((a) => a !== id)
          : [...prev.selectedAmenities, id],
      };
    });
  };

  const handleClearAll = () => {
    const cleared: FilterState = {
      minRating: null,
      radiusKm: null,
      selectedAmenities: [],
      featuredOnly: false,
      verifiedOnly: false,
      selectedArea: "",
    };
    setDraft(cleared);
    onReset();
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const activeFilterCount =
    (draft.minRating ? 1 : 0) +
    (draft.radiusKm ? 1 : 0) +
    draft.selectedAmenities.length +
    (draft.featuredOnly ? 1 : 0) +
    (draft.verifiedOnly ? 1 : 0) +
    (draft.selectedArea ? 1 : 0);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Dark overlay backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close filters"
          >
            ✕
          </button>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </h2>
          <div className="w-8" /> {/* Balance header spacer */}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7">
          {/* Section 1: Place Type & Trust Toggles */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Verification & Trust
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDraft((p) => ({ ...p, verifiedOnly: !p.verifiedOnly }))}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  draft.verifiedOnly
                    ? "border-[#18181b] bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>✓</span>
                    <span>Verified Places Only</span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${draft.verifiedOnly ? "text-slate-300 dark:text-slate-600" : "text-slate-500"}`}>
                    Physically verified contact & address
                  </p>
                </div>
                <div className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs ${draft.verifiedOnly ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white border-transparent" : "border-slate-400"}`}>
                  {draft.verifiedOnly && "✓"}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDraft((p) => ({ ...p, featuredOnly: !p.featuredOnly }))}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  draft.featuredOnly
                    ? "border-[#0ea5e9] bg-[#0ea5e9] text-white shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>⭐</span>
                    <span>Featured Highlights</span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${draft.featuredOnly ? "text-orange-100" : "text-slate-500"}`}>
                    Top rated & curated landmarks
                  </p>
                </div>
                <div className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs ${draft.featuredOnly ? "bg-white text-[#0ea5e9] border-transparent" : "border-slate-400"}`}>
                  {draft.featuredOnly && "✓"}
                </div>
              </button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 2: Star Ratings */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Minimum Rating
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Any Rating", val: null },
                { label: "★ 4.0+", val: 4.0 },
                { label: "★ 4.5+", val: 4.5 },
              ].map((tier) => {
                const isSelected = draft.minRating === tier.val;
                return (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, minRating: tier.val }))}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer text-center ${
                      isSelected
                        ? "border-[#18181b] bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 3: Distance Radius */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Distance Radius
              </h3>
              {!hasUserLocation && (
                <button
                  type="button"
                  onClick={onLocateMe}
                  className="text-xs font-bold text-[#0ea5e9] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>📍</span> Enable GPS
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: "Any", val: null },
                { label: "1 km", val: 1 },
                { label: "3 km", val: 3 },
                { label: "5 km", val: 5 },
                { label: "10 km", val: 10 },
                { label: "25 km", val: 25 },
              ].map((item) => {
                const isSelected = draft.radiusKm === item.val;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, radiusKm: item.val }))}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                      isSelected
                        ? "border-[#18181b] bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 4: Amenities Multi-Select */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Amenities & Facilities
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Select key conveniences and workspace features
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AMENITIES_LIST.map((amenity) => {
                const isSelected = draft.selectedAmenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      isSelected
                        ? "border-[#18181b] bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-base">{amenity.icon}</span>
                    <span className="truncate">{amenity.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Micro-Markets / Neighborhoods */}
          {availableAreas.length > 0 && (
            <>
              <hr className="border-slate-100 dark:border-slate-800" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Neighborhood / Area
                </h3>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, selectedArea: "" }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      !draft.selectedArea
                        ? "border-[#18181b] bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                        : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    All Areas
                  </button>
                  {availableAreas.slice(0, 20).map((area) => {
                    const isSelected = draft.selectedArea.toLowerCase() === area.toLowerCase();
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            selectedArea: isSelected ? "" : area,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#18181b] bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 font-bold"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-900/90 backdrop-blur-md">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 underline hover:text-slate-950 dark:hover:text-white cursor-pointer"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] px-6 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
          >
            Show {totalMatchingPlaces} places
          </button>
        </div>
      </div>
    </div>
  );
}
