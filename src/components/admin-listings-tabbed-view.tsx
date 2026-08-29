"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { archiveListing } from "@/app/admin/actions";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 8;

type ListingItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  locality?: string | null;
  city?: string | null;
  latitude: number | null;
  longitude: number | null;
  is_featured?: boolean;
  category_id?: string | null;
  updated_at: string;
  categories?: { name?: string } | { name?: string }[] | null;
};

type CategoryItem = {
  id: string;
  name: string;
  domain_id: string;
  sort_order: number;
};

export function AdminListingsTabbedView({
  listings,
  categories,
}: {
  listings: ListingItem[];
  categories: CategoryItem[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (selectedCategory && item.category_id !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesLoc = (item.locality ?? "").toLowerCase().includes(q) || (item.city ?? "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesLoc) return false;
      }
      return true;
    });
  }, [listings, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE) || 1;
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredListings.slice(start, start + PAGE_SIZE);
  }, [filteredListings, currentPage]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    listings.forEach((item) => {
      if (item.category_id) {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [listings]);

  return (
    <div className="space-y-6">
      {/* Category Tabs & Quick Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-4">
        {/* Horizontal Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              !selectedCategory
                ? "bg-[var(--foreground)] text-[var(--paper)] shadow-xs"
                : "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            🌐 All Places
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const icon =
              cat.name.includes("School") || cat.name.includes("Education")
                ? "🏫"
                : cat.name.includes("Hospital") || cat.name.includes("Health")
                ? "🏥"
                : "📍";

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? "" : cat.id)}
                className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[var(--foreground)] text-[var(--paper)] shadow-xs"
                    : "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {icon} {cat.name}
              </button>
            );
          })}
        </div>

        {/* Search filter within tab */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter in tab..."
            className="w-full rounded-full border border-[var(--line)] bg-[var(--paper)] pl-8 pr-4 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--ink-muted)] focus:outline-none"
          />
          <span className="absolute left-2.5 top-2 text-xs text-[var(--ink-muted)]">🔍</span>
        </div>
      </div>

      {/* Tab Content: Places Table / Cards */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-3.5 bg-[var(--background)]/50 text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          <span>Place & GPS Coordinates</span>
          <span>Status & Actions</span>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {paginatedListings.length > 0 ? (
            paginatedListings.map((listing) => (
              <div
                key={listing.id}
                className="flex flex-col justify-between gap-3 px-6 py-4 transition-colors hover:bg-[var(--background)]/30 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/listings/${listing.id}`}
                      className="font-bold text-sm text-[var(--foreground)] hover:text-[var(--coral)] transition-colors"
                    >
                      {listing.title}
                    </Link>
                    {listing.is_featured && (
                      <span className="rounded bg-[var(--coral-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--coral)] uppercase">
                        ★ Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-muted)] flex items-center gap-2">
                    <span>📍 {[listing.locality, listing.city].filter(Boolean).join(", ") || "Locality pending"}</span>
                    <span>·</span>
                    <span>
                      GPS:{" "}
                      {listing.latitude && listing.longitude ? (
                        <span className="font-mono text-[11px] font-semibold text-emerald-700">
                          {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-amber-700">None</span>
                      )}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--leaf-dark)] uppercase">
                    {listing.status}
                  </span>
                  <Link
                    href={`/admin/listings/${listing.id}`}
                    className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3.5 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors"
                  >
                    Edit ✏️
                  </Link>
                  <form action={archiveListing}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <button className="text-xs font-semibold text-red-600 hover:underline">
                      Archive
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-xs text-[var(--ink-muted)]">
              No places found in this tab. Try selecting another category tab or clearing search.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredListings.length > PAGE_SIZE && (
          <div className="px-6 pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredListings.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

