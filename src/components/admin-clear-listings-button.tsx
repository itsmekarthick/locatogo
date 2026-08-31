"use client";

import { useTransition } from "react";
import { clearAllListings } from "@/app/admin/actions";

export function AdminClearListingsButton({ listingsCount }: { listingsCount: number }) {
  const [isPending, startTransition] = useTransition();

  if (listingsCount === 0) return null;

  function handleClear() {
    const confirmed = window.confirm(
      `⚠️ WARNING: Are you sure you want to delete all ${listingsCount} existing listings?\n\nThis will remove all listings and their coordinates from your atlas so you can import fresh data.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await clearAllListings();
        alert("All listings have been successfully deleted. You can now import fresh places!");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to clear listings");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={isPending}
      className="rounded-full border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-4 py-2 text-xs font-bold text-red-700 dark:text-red-300 shadow-2xs hover:bg-red-100 dark:hover:bg-red-900/60 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
      title="Delete all current listings"
    >
      <span>🗑️</span>
      <span>{isPending ? "Clearing..." : `Delete All Listings (${listingsCount})`}</span>
    </button>
  );
}
