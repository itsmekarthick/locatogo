import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({ q: z.string().trim().min(2).max(80) });

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

type RoleRow = {
  id: string;
  title: string;
  location_name: string | null;
  workplace_type: string | null;
  listing: { title: string; slug: string } | { title: string; slug: string }[] | null;
};

/** Companies and roles for the landing search; hubs are matched on the client. */
export async function GET(request: Request) {
  const parsed = querySchema.safeParse({ q: new URL(request.url).searchParams.get("q") ?? "" });
  if (!parsed.success) return NextResponse.json({ companies: [], roles: [] });

  const pattern = `%${escapeLike(parsed.data.q)}%`;
  let supabase: SupabaseClient;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  const [companies, roles] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, slug, city, locality, company_type, active_jobs_count")
      .eq("status", "published")
      .not("company_type", "is", null)
      .ilike("title", pattern)
      .order("is_featured", { ascending: false })
      .order("active_jobs_count", { ascending: false })
      .limit(25),
    supabase
      .from("company_jobs")
      .select("id, title, location_name, workplace_type, listing:listings(title, slug)")
      .eq("is_active", true)
      .ilike("title", pattern)
      .limit(15),
  ]);

  const needle = parsed.data.q.toLowerCase();
  const rank = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.startsWith(needle)) return 0;
    return lower.includes(` ${needle}`) ? 1 : 2;
  };
  const companyItems = [...(companies.data ?? [])]
    .sort((a, b) => rank(a.title) - rank(b.title))
    .slice(0, 5);

  const seen = new Set<string>();
  const roleItems = ((roles.data ?? []) as RoleRow[])
    .flatMap((role) => {
      const listing = Array.isArray(role.listing) ? role.listing[0] : role.listing;
      if (!listing) return [];
      const key = `${listing.slug}|${role.title}`.toLowerCase();
      if (seen.has(key)) return [];
      seen.add(key);
      return [
        {
          id: role.id,
          title: role.title,
          location: role.location_name,
          workplace: role.workplace_type,
          company: listing.title,
          slug: listing.slug,
        },
      ];
    })
    .slice(0, 5);

  return NextResponse.json(
    { companies: companyItems, roles: roleItems },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
