"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** One favorites query for the whole list, instead of one per card. */
export function useFavorites() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return;
      setUserId(data.user.id);
      const { data: rows } = await supabase.from("user_favorites").select("listing_id").eq("user_id", data.user.id);
      if (!cancelled && rows) setSaved(new Set(rows.map((row: { listing_id: string }) => row.listing_id)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(
    async (listingId: string) => {
      if (!userId) {
        router.push("/auth/login?next=" + encodeURIComponent(window.location.pathname));
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const wasSaved = saved.has(listingId);
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      const query = wasSaved
        ? supabase.from("user_favorites").delete().eq("user_id", userId).eq("listing_id", listingId)
        : supabase.from("user_favorites").insert({ user_id: userId, listing_id: listingId });
      const { error } = await query;
      if (error) {
        setSaved((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      }
    },
    [userId, saved, router],
  );

  return { saved, toggle };
}
