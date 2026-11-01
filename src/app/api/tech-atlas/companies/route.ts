import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hubCityTerms } from "@/lib/constants/tech-hubs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "500", 10);
    const limit = Math.min(rawLimit, 1000); // Protect against runaway payload queries
    const search = searchParams.get("q") || "";
    const stage = searchParams.get("stage") || "";
    const hub = searchParams.get("hub") || "";
    const type = searchParams.get("type") || "";

    let supabase: SupabaseClient;
    try {
      supabase = createSupabaseAdminClient();
    } catch {
      supabase = await createSupabaseServerClient();
    }

    let query = supabase
      .from("listings")
      .select(`
        id,
        title,
        slug,
        locality,
        city,
        latitude,
        longitude,
        website,
        careers_url,
        company_type,
        funding_stage,
        active_jobs_count,
        country_code
      `)
      .eq("status", "published")
      .not("company_type", "is", null)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    const country = searchParams.get("country") || "";
    if (country && country !== "all" && country !== "ALL") {
      query = query.eq("country_code", country.toUpperCase());
    }

    if (hub) {
      const terms = hubCityTerms(hub);
      if (terms.length === 1) query = query.ilike("city", `%${terms[0]}%`);
      else if (terms.length > 1) query = query.or(terms.map((term) => `city.ilike.%${term}%`).join(","));
    }

    if (search.trim()) {
      const q = search.trim();
      query = query.or(
        `title.ilike.%${q}%,locality.ilike.%${q}%,city.ilike.%${q}%,short_description.ilike.%${q}%`
      );
    }

    if (stage && stage !== "all") {
      query = query.eq("funding_stage", stage);
    }

    if (type && type !== "all") {
      query = query.eq("company_type", type);
    }

    query = query.order("active_jobs_count", { ascending: false }).order("id", { ascending: true });

    const from = page * limit;
    const to = from + limit - 1;

    const { data: companies, count, error } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json(
      {
        companies: companies || [],
        page,
        limit,
        total: count,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error("[Tech Atlas Companies API Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch tech companies" },
      { status: 500 }
    );
  }
}
