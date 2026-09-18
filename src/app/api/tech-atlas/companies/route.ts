import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "5000", 10);
    const search = searchParams.get("q") || "";
    const stage = searchParams.get("stage") || "";
    const hub = searchParams.get("hub") || "";
    const type = searchParams.get("type") || "";

    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from("listings")
      .select(`
        id,
        title,
        slug,
        short_description,
        address_line_1,
        locality,
        city,
        latitude,
        longitude,
        website,
        careers_url,
        company_type,
        funding_stage,
        employee_range,
        tech_stack,
        founded_year,
        active_jobs_count
      `)
      .eq("status", "published")
      .not("company_type", "is", null)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (hub) {
      const h = hub.toLowerCase();
      if (h === "bengaluru" || h === "bangalore") {
        query = query.or("city.ilike.%bangalore%,city.ilike.%bengaluru%");
      } else if (h === "delhi-ncr" || h === "delhi") {
        query = query.or("city.ilike.%delhi%,city.ilike.%gurugram%,city.ilike.%noida%");
      } else if (h === "mumbai") {
        query = query.ilike("city", "%mumbai%");
      } else if (h === "chennai") {
        query = query.ilike("city", "%chennai%");
      } else if (h === "pune") {
        query = query.ilike("city", "%pune%");
      } else if (h === "hyderabad") {
        query = query.ilike("city", "%hyderabad%");
      } else if (h === "kolkata") {
        query = query.ilike("city", "%kolkata%");
      } else if (h === "kochi") {
        query = query.ilike("city", "%kochi%");
      }
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

    return NextResponse.json({
      companies: companies || [],
      page,
      limit,
      total: count,
    });
  } catch (err) {
    console.error("[Tech Atlas Companies API Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch tech companies" },
      { status: 500 }
    );
  }
}
