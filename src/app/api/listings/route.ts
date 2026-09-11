import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domain_id");
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "1000", 10);
    const search = searchParams.get("q") || "";
    const categoryId = searchParams.get("category_id") || "";

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("listings")
      .select(`
        id,
        title,
        slug,
        short_description,
        address_line_1,
        address_line_2,
        locality,
        city,
        postal_code,
        phone,
        website,
        latitude,
        longitude,
        is_featured,
        verification_status,
        category_id,
        categories:categories!listings_category_id_fkey(name, icon)
      `)
      .eq("status", "published")
      .is("company_type", null)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    let rawListings: any[] = [];

    if (domainId) {
      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const from = page * limit;
      const to = from + limit - 1;

      const { data, error } = await query
        .eq("domain_id", domainId)
        .order("is_featured", { ascending: false })
        .range(from, to);

      if (error) throw error;
      rawListings = data ?? [];
    } else {
      // Balanced pan-metro streaming across all published domains
      const { data: domains } = await supabase
        .from("domains")
        .select("id")
        .eq("status", "published")
        .order("name");

      const domainList = domains ?? [];
      const perDomainLimit = Math.max(25, Math.ceil(limit / (domainList.length || 1)));
      const from = page * perDomainLimit;
      const to = from + perDomainLimit - 1;

      const domainQueries = domainList.map((d) => {
        let q = supabase
          .from("listings")
          .select(`
            id,
            title,
            slug,
            short_description,
            address_line_1,
            address_line_2,
            locality,
            city,
            postal_code,
            phone,
            website,
            latitude,
            longitude,
            is_featured,
            verification_status,
            category_id,
            categories:categories!listings_category_id_fkey(name, icon)
          `)
          .eq("domain_id", d.id)
          .eq("status", "published")
          .is("company_type", null)
          .not("latitude", "is", null)
          .not("longitude", "is", null);

        if (categoryId && categoryId !== "all") {
          q = q.eq("category_id", categoryId);
        }

        if (search.trim()) {
          q = q.ilike("title", `%${search.trim()}%`);
        }

        return q
          .order("is_featured", { ascending: false })
          .range(from, to);
      });

      const results = await Promise.all(domainQueries);
      rawListings = results.flatMap((r) => r.data ?? []);
    }

    const listings = (rawListings || []).map((l: any) => {
      const cat = Array.isArray(l.categories)
        ? l.categories[0]
        : (l.categories as { name?: string; icon?: string } | null);

      return {
        id: l.id,
        title: l.title,
        slug: l.slug,
        short_description: l.short_description,
        address_line_1: l.address_line_1,
        address_line_2: l.address_line_2,
        locality: l.locality,
        city: l.city,
        postal_code: l.postal_code,
        phone: l.phone,
        website: l.website,
        latitude: l.latitude,
        longitude: l.longitude,
        is_featured: l.is_featured,
        verification_status: l.verification_status,
        category_id: l.category_id,
        category_name: cat?.name,
        category_icon: cat?.icon,
      };
    });

    return NextResponse.json(
      { listings },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
