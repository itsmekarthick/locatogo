import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { hubCityTerms } from "@/lib/constants/tech-hubs";
import { LEVEL_IDS, parseIdList, ROLE_CATEGORY_IDS, WORK_MODE_IDS, type JobFacets } from "@/lib/jobs/taxonomy";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  hub: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{0,40}$/).optional(),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).optional(),
  level: z.string().max(200).optional(),
  workplace: z.string().max(100).optional(),
  category: z.string().max(400).optional(),
  freshers: z.enum(["0", "1"]).optional(),
});

/** Counts of roles per filter option for a hub, plus the companies that match every active filter. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = paramsSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid filters." }, { status: 400 });
  const { hub, country, level, workplace, category, freshers } = parsed.data;

  let supabase: SupabaseClient;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  const { data, error } = await supabase.rpc("tech_atlas_job_facets", {
    p_city_terms: hub && hub !== "all" ? hubCityTerms(hub) : null,
    p_country: country && country !== "ALL" ? country : null,
    p_levels: parseIdList(level, LEVEL_IDS),
    p_workplaces: parseIdList(workplace, WORK_MODE_IDS),
    p_categories: parseIdList(category, ROLE_CATEGORY_IDS),
    p_freshers: freshers === "1",
  });

  if (error) {
    console.error("Job facets error:", error);
    return NextResponse.json({ error: "Could not load filter counts." }, { status: 500 });
  }

  const facets = data as JobFacets;
  return NextResponse.json(
    { ...facets, freshers: Number(facets.freshers ?? 0) },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
