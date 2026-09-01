import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "5000", 10);
    const search = searchParams.get("q") || "";
    const stage = searchParams.get("stage") || "";
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

    if (search.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    if (stage && stage !== "all") {
      query = query.eq("funding_stage", stage);
    }

    if (type && type !== "all") {
      query = query.eq("company_type", type);
    }

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
