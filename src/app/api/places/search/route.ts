import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SearchListingRow = {
  id: string;
  title: string;
  slug: string;
  locality: string | null;
  city: string | null;
  short_description: string | null;
  is_featured: boolean | null;
  categories: { name?: string; icon?: string } | { name?: string; icon?: string }[] | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  // Enforce minimum 3 characters for autocomplete
  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    let supabase: SupabaseClient;
    try {
      supabase = createSupabaseAdminClient();
    } catch {
      supabase = await createSupabaseServerClient();
    }
    const cleanQ = q.replace(/[%_]/g, "\\$&"); // Escape wildcards

    const { data: listings, error } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        slug,
        locality,
        city,
        short_description,
        is_featured,
        categories:categories!listings_category_id_fkey(name, icon)
      `)
      .eq("status", "published")
      .or(`title.ilike.%${cleanQ}%,locality.ilike.%${cleanQ}%,slug.ilike.%${cleanQ}%`)
      .limit(8);

    if (error) {
      console.error("[Search API] Error searching listings:", error);
      return NextResponse.json({ results: [] });
    }

    const results = ((listings || []) as unknown as SearchListingRow[]).map((item) => {
      const cat = Array.isArray(item.categories)
        ? item.categories[0]
        : item.categories;

      return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        locality: item.locality || item.city || "Bangalore",
        short_description: item.short_description,
        is_featured: item.is_featured,
        category_name: cat?.name || "Place",
        category_icon: cat?.icon || "📍",
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[Search API] Unexpected error:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

