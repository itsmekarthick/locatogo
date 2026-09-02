"use client";

import { useState } from "react";
import { mergeListings } from "@/app/admin/actions";

export type DuplicateListingItem = {
  id: string;
  title: string;
  phone?: string | null;
  city?: string | null;
  locality?: string | null;
  address_line_1?: string | null;
  status: string;
  slug: string;
  short_description?: string | null;
  website?: string | null;
};

type Props = {
  primaryListing: {
    id: string;
    title: string;
    phone?: string | null;
    city?: string | null;
    locality?: string | null;
    address_line_1?: string | null;
    short_description?: string | null;
    website?: string | null;
  };
  duplicates: DuplicateListingItem[];
  isOpen: boolean;
  onClose: () => void;
};

export function AdminDuplicateMergeModal({
  primaryListing,
  duplicates,
  isOpen,
  onClose,
}: Props) {
  const [selectedDuplicateIndex, setSelectedDuplicateIndex] = useState(0);
  const [isMerging, setIsMerging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const duplicate = duplicates[selectedDuplicateIndex];

  // Fields selection: "primary" or "duplicate"
  const [chosenFields, setChosenFields] = useState<{
    title: "primary" | "duplicate";
    phone: "primary" | "duplicate";
    locality: "primary" | "duplicate";
    address_line_1: "primary" | "duplicate";
    short_description: "primary" | "duplicate";
    website: "primary" | "duplicate";
  }>({
    title: "primary",
    phone: "primary",
    locality: "primary",
    address_line_1: "primary",
    short_description: "primary",
    website: "primary",
  });

  if (!isOpen || !duplicate) return null;

  const handleMerge = async () => {
    setIsMerging(true);
    setErrorMessage(null);
    try {
      const resolvedFields = {
        title: chosenFields.title === "primary" ? primaryListing.title : duplicate.title,
        phone: chosenFields.phone === "primary" ? primaryListing.phone || undefined : duplicate.phone || undefined,
        locality: chosenFields.locality === "primary" ? primaryListing.locality || undefined : duplicate.locality || undefined,
        address_line_1:
          chosenFields.address_line_1 === "primary"
            ? primaryListing.address_line_1 || undefined
            : duplicate.address_line_1 || undefined,
        short_description:
          chosenFields.short_description === "primary"
            ? primaryListing.short_description || undefined
            : duplicate.short_description || undefined,
        website:
          chosenFields.website === "primary"
            ? primaryListing.website || undefined
            : duplicate.website || undefined,
      };

      await mergeListings({
        primaryId: primaryListing.id,
        duplicateId: duplicate.id,
        resolvedFields,
      });

      onClose();
      window.location.reload();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to merge listings");
    } finally {
      setIsMerging(false);
    }
  };

  const fieldsList = [
    { key: "title" as const, label: "Title" },
    { key: "phone" as const, label: "Phone Number" },
    { key: "locality" as const, label: "Locality / Neighborhood" },
    { key: "address_line_1" as const, label: "Street Address" },
    { key: "short_description" as const, label: "Short Description" },
    { key: "website" as const, label: "Website URL" },
  ];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div>
            <span className="rounded-md bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              ⚠️ Merge & Consolidate
            </span>
            <h3 className="mt-1 font-display text-xl font-bold text-[var(--foreground)]">
              Resolve Duplicate Place
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Pick the most accurate fields to keep. Reviews, photos, and favorites will be preserved on the primary listing, and the duplicate will be safely archived.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Duplicate Selector if more than 1 duplicate exists */}
        {duplicates.length > 1 && (
          <div className="flex items-center gap-2 pt-3">
            <span className="text-xs font-bold text-[var(--ink-muted)]">Select duplicate:</span>
            {duplicates.map((dup, i) => (
              <button
                key={dup.id}
                onClick={() => setSelectedDuplicateIndex(i)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  selectedDuplicateIndex === i
                    ? "bg-[var(--foreground)] text-[var(--paper)]"
                    : "border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Duplicate #{i + 1}: {dup.title}
              </button>
            ))}
          </div>
        )}

        {/* Side-by-side Field Comparison Table */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs font-bold text-[var(--ink-muted)] pb-1 border-b border-[var(--line)]">
            <span>Primary Listing (Current)</span>
            <span>Detected Duplicate ({duplicate.status})</span>
          </div>

          {fieldsList.map(({ key, label }) => {
            const primaryVal = (primaryListing as any)[key] || "—";
            const duplicateVal = (duplicate as any)[key] || "—";
            const isChosenPrimary = chosenFields[key] === "primary";

            return (
              <div key={key} className="rounded-2xl border border-[var(--line)] bg-[var(--background)] p-3">
                <p className="text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-2">
                  {label}
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Primary Option */}
                  <label
                    onClick={() => setChosenFields((prev) => ({ ...prev, [key]: "primary" }))}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all ${
                      isChosenPrimary
                        ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500"
                        : "border-[var(--line)] bg-[var(--paper)] hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`field-${key}`}
                      checked={isChosenPrimary}
                      onChange={() => setChosenFields((prev) => ({ ...prev, [key]: "primary" }))}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-[var(--foreground)] break-words leading-relaxed">
                      {primaryVal}
                    </span>
                  </label>

                  {/* Duplicate Option */}
                  <label
                    onClick={() => setChosenFields((prev) => ({ ...prev, [key]: "duplicate" }))}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all ${
                      !isChosenPrimary
                        ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500"
                        : "border-[var(--line)] bg-[var(--paper)] hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`field-${key}`}
                      checked={!isChosenPrimary}
                      onChange={() => setChosenFields((prev) => ({ ...prev, [key]: "duplicate" }))}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-[var(--foreground)] break-words leading-relaxed">
                      {duplicateVal}
                    </span>
                  </label>
                </div>
              </div>
            );
          })}

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-bold">
              ✕ {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4">
          <button
            onClick={onClose}
            disabled={isMerging}
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={isMerging}
            className="rounded-full bg-emerald-600 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isMerging ? (
              <span>Merging...</span>
            ) : (
              <>
                <span>Consolidate & Merge Duplicate →</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
