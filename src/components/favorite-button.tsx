"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
      onClick={toggle}
      disabled={loading}
      title={favorited ? "Remove from favorites" : "Save to favorites"}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      className={`inline-flex items-center gap-1 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
        favorited
          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "border-gray-200 bg-white text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50"
      } px-2.5 py-1.5 text-sm ${className}`}
    >
      <span>{favorited ? "❤️" : "🤍"}</span>
      {showCount && <span className="text-xs font-semibold">Save</span>}
    </button>
  );
}
