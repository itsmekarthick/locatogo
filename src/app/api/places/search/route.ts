import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  // Enforce minimum 3 characters for autocomplete
  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const supabase = await createSupabaseServerClient();
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
        categories:categories!listings_category_id_domain_id_fkey(name, icon)
      `)
      .eq("status", "published")
      .or(`title.ilike.%${cleanQ}%,locality.ilike.%${cleanQ}%,slug.ilike.%${cleanQ}%`)
      .limit(8);

    if (error) {
      console.error("[Search API] Error searching listings:", error);
      return NextResponse.json({ results: [] });
    }

    const results = (listings || []).map((item) => {
      const cat = Array.isArray(item.categories)
        ? item.categories[0]
        : (item.categories as { name?: string; icon?: string } | null);

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
