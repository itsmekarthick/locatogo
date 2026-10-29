"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { archiveListing, bulkUpdateListingStatus, bulkToggleFeatured } from "@/app/admin/actions";
import { BulkBar } from "@/components/admin/bulk-bar";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge, Chip, type BadgeVariant } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArchiveIcon, CheckCircleIcon, DownloadIcon, FileTextIcon, MapPinIcon, SearchIcon, StarIcon, XIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

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

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  published: "success",
  pending_review: "warning",
  draft: "neutral",
  archived: "neutral",
  rejected: "danger",
  suspended: "danger",
};

// UTC keeps the server and browser renders identical.
const updatedFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function categoryName(item: ListingItem) {
  const cat = item.categories;
  if (!cat) return "";
  return (Array.isArray(cat) ? cat[0]?.name : cat.name) || "";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportCsv(items: ListingItem[]) {
  const headers = ["ID", "Title", "Slug", "Status", "Locality", "City", "Category", "Featured", "Latitude", "Longitude", "Updated At"];
  const rows = items.map((item) =>
    [
      item.id,
      csvCell(item.title || ""),
      item.slug,
      item.status,
      csvCell(item.locality || ""),
      csvCell(item.city || ""),
      csvCell(categoryName(item)),
      item.is_featured ? "Yes" : "No",
      item.latitude ?? "",
      item.longitude ?? "",
      item.updated_at,
    ].join(","),
  );

  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `listings_export_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type PendingArchive = { ids: string[]; label: string } | null;

export function AdminListingsTabbedView({ listings, categories }: { listings: ListingItem[]; categories: CategoryItem[] }) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingArchive, setPendingArchive] = useState<PendingArchive>(null);
  const [isProcessing, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return listings.filter((item) => {
      if (selectedCategory && item.category_id !== selectedCategory) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return item.title.toLowerCase().includes(q) || (item.locality ?? "").toLowerCase().includes(q) || (item.city ?? "").toLowerCase().includes(q);
    });
  }, [listings, selectedCategory, statusFilter, searchQuery]);

  // Changing a filter drops the selection so bulk actions never touch rows that are no longer shown.
  function changeFilter(apply: () => void) {
    apply();
    setSelectedIds(new Set());
  }

  function run(task: () => Promise<string>) {
    startTransition(async () => {
      try {
        const message = await task();
        toast({ title: message, variant: "success" });
        setSelectedIds(new Set());
      } catch (error) {
        toast({ title: "That didn't work", description: error instanceof Error ? error.message : "Please try again.", variant: "error" });
      }
    });
  }

  function bulkStatus(status: "published" | "draft") {
    const ids = Array.from(selectedIds);
    run(async () => {
      const res = await bulkUpdateListingStatus(ids, status);
      return `Updated ${res.count} ${res.count === 1 ? "listing" : "listings"} to ${status}.`;
    });
  }

  function bulkFeature(isFeatured: boolean) {
    const ids = Array.from(selectedIds);
    run(async () => {
      const res = await bulkToggleFeatured(ids, isFeatured);
      return `${isFeatured ? "Featured" : "Unfeatured"} ${res.count} ${res.count === 1 ? "listing" : "listings"}.`;
    });
  }

  function confirmArchive() {
    const target = pendingArchive;
    if (!target) return;
    setPendingArchive(null);
    run(async () => {
      if (target.ids.length === 1) {
        const formData = new FormData();
        formData.set("listingId", target.ids[0]);
        await archiveListing(formData);
        return `Archived ${target.label}.`;
      }
      const res = await bulkUpdateListingStatus(target.ids, "archived");
      return `Archived ${res.count} listings.`;
    });
  }

  const columns: Column<ListingItem>[] = [
    {
      id: "title",
      header: "Place",
      sortValue: (row) => row.title,
      cell: (row) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/admin/listings/${row.id}`} className="focus-ring truncate rounded font-medium text-fg hover:text-accent-text">
              {row.title}
            </Link>
            {row.is_featured && (
              <Badge variant="warning" size="sm" icon={<StarIcon className="size-3 fill-current" />}>
                Featured
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-fg-subtle">
            <MapPinIcon className="size-3 shrink-0" />
            {[row.locality, row.city].filter(Boolean).join(", ") || "Locality pending"}
          </p>
        </div>
      ),
    },
    {
      id: "gps",
      header: "GPS",
      hideBelow: "md",
      sortValue: (row) => (row.latitude && row.longitude ? 1 : 0),
      cell: (row) =>
        row.latitude && row.longitude ? (
          <span className="font-mono text-xs text-success">
            {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
          </span>
        ) : (
          <span className="text-xs text-warning">Missing</span>
        ),
    },
    {
      id: "category",
      header: "Category",
      hideBelow: "lg",
      sortValue: (row) => categoryName(row),
      cell: (row) => <span className="text-fg-muted">{categoryName(row) || "None"}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? "neutral"} dot className="capitalize">
          {row.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "updated",
      header: "Updated",
      hideBelow: "lg",
      sortValue: (row) => row.updated_at,
      cell: (row) => <span className="whitespace-nowrap text-fg-muted">{updatedFormat.format(new Date(row.updated_at))}</span>,
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/listings/${row.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Edit
          </Link>
          <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setPendingArchive({ ids: [row.id], label: row.title })}>
            Archive
          </Button>
        </div>
      ),
    },
  ];

  const selectedListings = listings.filter((item) => selectedIds.has(item.id));

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5" role="group" aria-label="Filter by category">
        <Chip selected={!selectedCategory} onClick={() => changeFilter(() => setSelectedCategory(""))}>
          All places
        </Chip>
        {categories.map((cat) => (
          <Chip key={cat.id} selected={selectedCategory === cat.id} onClick={() => changeFilter(() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id))}>
            {cat.name}
          </Chip>
        ))}
      </div>

      <DataTable
        caption="Listings"
        columns={columns}
        rows={filtered}
        getRowId={(row) => row.id}
        selectable
        selected={selectedIds}
        onSelectedChange={setSelectedIds}
        defaultSort={{ id: "updated", dir: "desc" }}
        pageSize={10}
        resetKey={`${selectedCategory}|${statusFilter}|${searchQuery}`}
        toolbar={
          <>
            <div className="w-full min-w-[12rem] sm:w-64">
              <Input
                type="search"
                aria-label="Filter by title or area"
                placeholder="Filter by title or area"
                value={searchQuery}
                onChange={(event) => changeFilter(() => setSearchQuery(event.target.value))}
                leading={<SearchIcon />}
                trailing={
                  searchQuery ? (
                    <button type="button" aria-label="Clear filter" onClick={() => changeFilter(() => setSearchQuery(""))} className="focus-ring grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-surface-3 hover:text-fg">
                      <XIcon className="size-4" />
                    </button>
                  ) : undefined
                }
              />
            </div>
            <div className="w-40">
              <Select aria-label="Filter by status" value={statusFilter} onChange={(event) => changeFilter(() => setStatusFilter(event.target.value))}>
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="pending_review">Pending review</option>
              </Select>
            </div>
            <Button variant="secondary" leadingIcon={<DownloadIcon className="size-4" />} onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}>
              Export CSV
            </Button>
          </>
        }
        empty={
          <EmptyState
            icon={<FileTextIcon />}
            title="No places match"
            description="Try another category or status, or clear the search."
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  changeFilter(() => {
                    setSelectedCategory("");
                    setStatusFilter("all");
                    setSearchQuery("");
                  })
                }
              >
                Clear filters
              </Button>
            }
          />
        }
      />

      <BulkBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
        <Button size="sm" loading={isProcessing} leadingIcon={<CheckCircleIcon className="size-4" />} onClick={() => bulkStatus("published")}>
          Publish
        </Button>
        <Button size="sm" variant="secondary" disabled={isProcessing} leadingIcon={<FileTextIcon className="size-4" />} onClick={() => bulkStatus("draft")}>
          Draft
        </Button>
        <Button size="sm" variant="secondary" disabled={isProcessing} leadingIcon={<StarIcon className="size-4" />} onClick={() => bulkFeature(true)}>
          Feature
        </Button>
        <span className="max-sm:hidden">
          <Button size="sm" variant="secondary" disabled={isProcessing} leadingIcon={<DownloadIcon className="size-4" />} onClick={() => exportCsv(selectedListings)}>
            Export
          </Button>
        </span>
        <Button size="sm" variant="danger" disabled={isProcessing} leadingIcon={<ArchiveIcon className="size-4" />} onClick={() => setPendingArchive({ ids: Array.from(selectedIds), label: `${selectedIds.size} listings` })}>
          Archive
        </Button>
      </BulkBar>

      <ConfirmDialog
        open={pendingArchive !== null}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title={pendingArchive && pendingArchive.ids.length > 1 ? `Archive ${pendingArchive.ids.length} listings?` : "Archive this listing?"}
        description={
          pendingArchive && pendingArchive.ids.length === 1
            ? `${pendingArchive.label} will be hidden from the public atlas.`
            : "These listings will be hidden from the public atlas."
        }
        confirmLabel="Archive"
        onConfirm={confirmArchive}
      />
    </div>
  );
}
