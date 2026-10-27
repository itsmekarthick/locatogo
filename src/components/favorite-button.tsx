"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import "@/components/explorer/explorer.css";

interface FavoriteButtonProps {
  listingId: string;
  initialFavorited?: boolean;
  className?: string;
  showCount?: boolean;
}

export function FavoriteButton({
  listingId,
  initialFavorited = false,
  className = "",
  showCount = false,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      if (data.user) {
        // Check current state from DB
        supabase
          .from("user_favorites")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("listing_id", listingId)
          .maybeSingle()
          .then(({ data: fav }) => setFavorited(!!fav));
      }
    });
  }, [listingId]);

  const toggle = useCallback(async () => {
    if (!userId) {
      // Redirect to login
      window.location.href = "/auth/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (favorited) {
      await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId);
      setFavorited(false);
    } else {
      await supabase
        .from("user_favorites")
        .insert({ user_id: userId, listing_id: listingId });
      setFavorited(true);
    }
    setLoading(false);
  }, [userId, favorited, listingId]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-pressed={favorited}
      title={favorited ? "Remove from favorites" : "Save to favorites"}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm transition-ui active:scale-95 disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-11",
        favorited
          ? "border-danger/30 bg-danger-soft text-danger"
          : "border-line-strong bg-surface-1 text-fg-subtle hover:border-danger/30 hover:bg-danger-soft hover:text-danger",
        className,
      )}
    >
      {/* Re-keying on `favorited` restarts the pop animation each time it is turned on. */}
      <HeartIcon key={String(favorited)} className={cn("size-4", favorited && "ex-pop fill-current")} />
      {showCount && <span className="text-xs font-semibold">{favorited ? "Saved" : "Save"}</span>}
    </button>
  );
}
