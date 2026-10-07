import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    const supabase = await createSupabaseServerClient();

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
      } else if (h === "silicon-valley" || h === "siliconvalley") {
        query = query.or("city.ilike.%san francisco%,city.ilike.%palo alto%,city.ilike.%mountain view%,city.ilike.%sunnyvale%,city.ilike.%san jose%,city.ilike.%menlo park%");
      } else if (h === "new-york") {
        query = query.or("city.ilike.%new york%,city.ilike.%brooklyn%,city.ilike.%manhattan%");
      } else if (h === "seattle") {
        query = query.or("city.ilike.%seattle%,city.ilike.%bellevue%,city.ilike.%redmond%");
      } else if (h === "austin") {
        query = query.ilike("city", "%austin%");
      } else if (h === "boston") {
        query = query.or("city.ilike.%boston%,city.ilike.%cambridge%,city.ilike.%somerville%");
      } else if (h === "los-angeles") {
        query = query.or("city.ilike.%los angeles%,city.ilike.%santa monica%,city.ilike.%culver city%,city.ilike.%glendale%");
      } else if (h === "chicago") {
        query = query.ilike("city", "%chicago%");
      } else if (h === "denver") {
        query = query.or("city.ilike.%denver%,city.ilike.%boulder%");
      } else if (h === "atlanta") {
        query = query.ilike("city", "%atlanta%");
      } else if (h === "san-diego") {
        query = query.or("city.ilike.%san diego%,city.ilike.%la jolla%,city.ilike.%san marcos%");
      } else if (h === "london") {
        query = query.ilike("city", "%london%");
      } else if (h === "toronto") {
        query = query.ilike("city", "%toronto%");
      } else if (h === "berlin") {
        query = query.ilike("city", "%berlin%");
      } else if (h === "singapore") {
        query = query.ilike("city", "%singapore%");
      } else if (h === "paris") {
        query = query.ilike("city", "%paris%");
      } else if (h === "amsterdam") {
        query = query.ilike("city", "%amsterdam%");
      } else if (h === "dublin") {
        query = query.ilike("city", "%dublin%");
      } else if (h === "tokyo") {
        query = query.ilike("city", "%tokyo%");
      } else if (h === "sydney") {
        query = query.ilike("city", "%sydney%");
      } else if (h === "dubai") {
        query = query.ilike("city", "%dubai%");
      } else if (h === "abu-dhabi" || h === "abudhabi") {
        query = query.or("city.ilike.%abu dhabi%,city.ilike.%abudhabi%");
      } else if (h === "sharjah") {
        query = query.ilike("city", "%sharjah%");
      } else if (h === "ras-al-khaimah") {
        query = query.or("city.ilike.%ras al khaimah%,city.ilike.%rak%");
      } else if (h === "melbourne") {
        query = query.ilike("city", "%melbourne%");
      } else if (h === "brisbane") {
        query = query.ilike("city", "%brisbane%");
      } else if (h === "vancouver") {
        query = query.or("city.ilike.%vancouver%,city.ilike.%burnaby%,city.ilike.%richmond%");
      } else if (h === "montreal") {
        query = query.ilike("city", "%montreal%");
      } else if (h === "waterloo") {
        query = query.or("city.ilike.%waterloo%,city.ilike.%kitchener%");
      } else if (h === "ottawa") {
        query = query.ilike("city", "%ottawa%");
      } else if (h === "calgary") {
        query = query.ilike("city", "%calgary%");
      } else if (h === "munich") {
        query = query.ilike("city", "%munich%");
      } else if (h === "frankfurt") {
        query = query.ilike("city", "%frankfurt%");
      } else if (h === "hamburg") {
        query = query.ilike("city", "%hamburg%");
      } else if (h === "rotterdam") {
        query = query.ilike("city", "%rotterdam%");
      } else if (h === "eindhoven") {
        query = query.ilike("city", "%eindhoven%");
      } else if (h === "cork") {
        query = query.ilike("city", "%cork%");
      } else if (h === "osaka") {
        query = query.ilike("city", "%osaka%");
      } else if (h === "lyon") {
        query = query.ilike("city", "%lyon%");
      } else if (h === "toulouse") {
        query = query.ilike("city", "%toulouse%");
      } else if (h === "bordeaux") {
        query = query.ilike("city", "%bordeaux%");
      } else if (h === "marseille") {
        query = query.ilike("city", "%marseille%");
      } else if (h === "nantes") {
        query = query.ilike("city", "%nantes%");
      } else {
        const cleanHub = h.replace(/-/g, " ");
        query = query.ilike("city", `%${cleanHub}%`);
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
