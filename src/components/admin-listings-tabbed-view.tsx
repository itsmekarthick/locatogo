"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { archiveListing, bulkUpdateListingStatus, bulkToggleFeatured } from "@/app/admin/actions";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Reset to page 1 when category, search, or status filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [selectedCategory, searchQuery, statusFilter]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (selectedCategory && item.category_id !== selectedCategory) {
        return false;
      }
      if (statusFilter !== "all" && item.status !== statusFilter) {
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
  }, [listings, selectedCategory, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE) || 1;
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredListings.slice(start, start + PAGE_SIZE);
  }, [filteredListings, currentPage]);

  const isAllSelected = useMemo(() => {
    if (paginatedListings.length === 0) return false;
    return paginatedListings.every((item) => selectedIds.has(item.id));
  }, [paginatedListings, selectedIds]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllSelected) {
        paginatedListings.forEach((item) => next.delete(item.id));
      } else {
        paginatedListings.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkStatus = async (status: "published" | "draft" | "archived") => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await bulkUpdateListingStatus(ids, status);
      setNotification(`Updated ${res.count} listings to "${status}".`);
      setSelectedIds(new Set());
      setTimeout(() => setNotification(null), 4000);
    } catch (e: any) {
      alert(e.message || "Failed to update listings");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkFeature = async (isFeatured: boolean) => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await bulkToggleFeatured(ids, isFeatured);
      setNotification(`${isFeatured ? "Featured" : "Unfeatured"} ${res.count} listings.`);
      setSelectedIds(new Set());
      setTimeout(() => setNotification(null), 4000);
    } catch (e: any) {
      alert(e.message || "Failed to update listings");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCsv = (itemsToExport: ListingItem[]) => {
    const headers = [
      "ID",
      "Title",
      "Slug",
      "Status",
      "Locality",
      "City",
      "Category",
      "Featured",
      "Latitude",
      "Longitude",
      "Updated At",
    ];
    const rows = itemsToExport.map((item) => {
      const catName =
        typeof item.categories === "object" && item.categories !== null
          ? Array.isArray(item.categories)
            ? item.categories[0]?.name || ""
            : item.categories.name || ""
          : "";
      return [
        item.id,
        `"${(item.title || "").replace(/"/g, '""')}"`,
        item.slug,
        item.status,
        `"${(item.locality || "").replace(/"/g, '""')}"`,
        `"${(item.city || "").replace(/"/g, '""')}"`,
        `"${catName.replace(/"/g, '""')}"`,
        item.is_featured ? "Yes" : "No",
        item.latitude ?? "",
        item.longitude ?? "",
        item.updated_at,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `listings_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-bold flex items-center justify-between shadow-xs">
          <span>✓ {notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-950">
            ✕
          </button>
        </div>
      )}

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

        {/* Search, Status & Export CSV Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="archived">Archived</option>
          </select>

          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, area..."
              className="w-full rounded-full border border-[var(--line)] bg-[var(--paper)] pl-8 pr-4 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--ink-muted)] focus:outline-none"
            />
            <span className="absolute left-2.5 top-2 text-xs text-[var(--ink-muted)]">🔍</span>
          </div>

          <button
            onClick={() => handleExportCsv(filteredListings)}
            title="Export filtered listings to CSV"
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tab Content: Places Table / Cards */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-3.5 bg-[var(--background)]/50 text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              title="Select all on this page"
            />
            <span>Place & GPS Coordinates</span>
          </div>
          <span>Status & Actions</span>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {paginatedListings.length > 0 ? (
            paginatedListings.map((listing) => {
              const isSelected = selectedIds.has(listing.id);
              return (
                <div
                  key={listing.id}
                  className={`flex flex-col justify-between gap-3 px-6 py-4 transition-colors hover:bg-[var(--background)]/40 sm:flex-row sm:items-center ${
                    isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(listing.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
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
                  </div>

                  <div className="flex items-center gap-3 pl-7 sm:pl-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        listing.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : listing.status === "pending_review"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
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
                      <button className="text-xs font-semibold text-red-600 hover:underline cursor-pointer">
                        Archive
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
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

      {/* Floating Sticky Batch Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="text-xs font-bold text-[var(--foreground)] pr-2 border-r border-[var(--line)] whitespace-nowrap">
            ✓ {selectedIds.size} Selected
          </span>
          <button
            onClick={() => handleBulkStatus("published")}
            disabled={isProcessing}
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            🟢 Publish
          </button>
          <button
            onClick={() => handleBulkStatus("draft")}
            disabled={isProcessing}
            className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--line)]/60 cursor-pointer transition-colors disabled:opacity-50"
          >
            📝 Draft
          </button>
          <button
            onClick={() => handleBulkFeature(true)}
            disabled={isProcessing}
            className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            ★ Feature
          </button>
          <button
            onClick={() => handleBulkStatus("archived")}
            disabled={isProcessing}
            className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            🗑️ Archive
          </button>
          <button
            onClick={() => {
              const selectedListings = listings.filter((l) => selectedIds.has(l.id));
              handleExportCsv(selectedListings);
            }}
            className="hidden sm:inline-flex rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            title="Deselect all"
            className="text-xs text-[var(--ink-muted)] hover:text-[var(--foreground)] pl-2 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
