import type { SupabaseClient } from "@supabase/supabase-js";
import { GLOBAL_TECH_HUBS, hubCityTerms } from "@/lib/constants/tech-hubs";
import { EMPTY_FACETS, type JobFacets } from "@/lib/jobs/taxonomy";
import { buildScoringContext, rankJobs } from "@/lib/matching/score";
import { EXPERIENCE_LEVELS, type ExperienceLevel, type MatchJob, type MatchProfile, type WorkplaceType } from "@/lib/matching/types";

/** Hubs shown on the hero map, in tour order. */
export const TOUR_HUBS = ["bengaluru", "silicon-valley", "london", "singapore", "new-york", "berlin"] as const;

const PAGE_SIZE = 1000;
const MATCH_READ_CAP = 5000;
// Roles the sample is picked from, so the preview shows the kind of work a tech atlas is for.
const TECH_CATEGORIES = ["engineering", "backend", "frontend", "fullstack", "mobile", "devops", "data", "ml_ai"];

/** Some company names carry decorative emoji from their source; the interface shows plain names. */
const plainName = (name: string) => name.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/\s+/g, " ").trim();

export type TourCompany = { id: string; title: string; website: string | null; jobs: number };
export type HubTour = { id: string; name: string; lat: number; lng: number; roles: number; companies: number; top: TourCompany[] };
export type FresherRole = { id: string; title: string; company: string; website: string | null; location: string };
export type DemoMatch = { id: string; title: string; company: string; website: string | null; location: string; score: number; skills: string[]; note: string | null };
export type DemoProfile = { headline: string; location: string; years: number; skills: string[] };

export type LandingLive = {
  roles: number;
  companies: number;
  weekRoles: number;
  dayRoles: number;
  facets: JobFacets;
  tours: HubTour[];
  fresherRoles: FresherRole[];
  demoProfile: DemoProfile;
  demoMatches: DemoMatch[];
  demoRead: number;
};

/** A sample person, scored by the same engine that scores a real resume, against roles that are open today. */
const DEMO_PROFILE: MatchProfile = {
  headline: "Machine learning engineer",
  location: "Bengaluru",
  level: "mid",
  yearsExperience: 4,
  skills: ["Python", "Machine Learning", "AWS", "SQL"],
  roleTitles: ["Machine Learning Engineer", "Data Scientist"],
};

const asLevel = (value: string | null): ExperienceLevel | null => EXPERIENCE_LEVELS.find((level) => level === value) ?? null;
const asWorkplace = (value: string | null): WorkplaceType | null => (value === "on_site" || value === "hybrid" || value === "remote" ? value : null);

type JobRow = { id: string; title: string; department: string | null; location_name: string | null; workplace_type: string | null; experience_level: string | null; listing_id: string | null };

async function loadTours(supabase: SupabaseClient): Promise<HubTour[]> {
  const hubs = TOUR_HUBS.flatMap((id) => {
    const hub = GLOBAL_TECH_HUBS.find((candidate) => candidate.id === id);
    return hub ? [hub] : [];
  });
  return Promise.all(
    hubs.map(async (hub) => {
      const terms = hubCityTerms(hub.id);
      const [{ data: facets }, { data: top }] = await Promise.all([
        supabase.rpc("tech_atlas_job_facets", { p_city_terms: terms, p_country: null, p_levels: [], p_workplaces: [], p_categories: [], p_freshers: false }),
        supabase
          .from("listings")
          .select("id, title, website, active_jobs_count")
          .eq("status", "published")
          .not("company_type", "is", null)
          .or(terms.map((term) => `city.ilike.%${term.replace(/[,()%*\\"':;]/g, " ").trim()}%`).join(","))
          .order("active_jobs_count", { ascending: false })
          .limit(3),
      ]);
      const counts = (facets ?? EMPTY_FACETS) as JobFacets;
      return {
        id: hub.id,
        name: hub.id === "silicon-valley" ? "Silicon Valley" : hub.id === "new-york" ? "New York" : hub.name,
        lat: hub.lat,
        lng: hub.lng,
        roles: Number(counts.roles ?? 0),
        companies: counts.companies?.length ?? 0,
        top: ((top ?? []) as { id: string; title: string; website: string | null; active_jobs_count: number | null }[]).map((row) => ({ id: row.id, title: plainName(row.title), website: row.website, jobs: row.active_jobs_count ?? 0 })),
      };
    }),
  );
}

async function loadFresherRoles(supabase: SupabaseClient): Promise<FresherRole[]> {
  const { data } = await supabase
    .from("company_jobs")
    .select("id, title, location_name, listings(title, website)")
    .eq("is_active", true)
    .eq("is_fresher", true)
    .in("role_category", TECH_CATEGORIES)
    .order("posted_at", { ascending: false })
    .limit(24);
  const seen = new Set<string>();
  return ((data ?? []) as unknown as { id: string; title: string; location_name: string | null; listings: { title: string; website: string | null } | { title: string; website: string | null }[] | null }[])
    .flatMap((row) => {
      const listing = Array.isArray(row.listings) ? row.listings[0] : row.listings;
      // One role per company, and only titles that start with a letter, so the sample reads cleanly.
      if (!listing || seen.has(listing.title) || !/^[A-Za-z]/.test(row.title)) return [];
      seen.add(listing.title);
      return [{ id: row.id, title: row.title, company: plainName(listing.title), website: listing.website, location: row.location_name ?? "" }];
    })
    .slice(0, 3);
}

async function loadDemoMatches(supabase: SupabaseClient): Promise<{ matches: DemoMatch[]; read: number }> {
  const scope = "location_name.ilike.%bengaluru%,location_name.ilike.%bangalore%,workplace_type.eq.remote";
  const { count } = await supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("is_active", true).or(scope);
  const pages = Math.ceil(Math.min(count ?? 0, MATCH_READ_CAP) / PAGE_SIZE);
  const chunks = await Promise.all(
    Array.from({ length: pages }, async (_, page) => {
      const { data } = await supabase
        .from("company_jobs")
        .select("id, title, department, location_name, workplace_type, experience_level, listing_id")
        .eq("is_active", true)
        .or(scope)
        .order("posted_at", { ascending: false })
        .order("id")
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      return (data ?? []) as JobRow[];
    }),
  );
  const rows = chunks.flat();
  if (rows.length === 0) return { matches: [], read: 0 };

  const jobs: MatchJob[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    department: row.department,
    locationName: row.location_name ?? "",
    workplaceType: asWorkplace(row.workplace_type),
    level: asLevel(row.experience_level),
  }));
  const { ranked } = rankJobs(buildScoringContext(DEMO_PROFILE), jobs, 3);
  const byId = new Map(rows.map((row) => [row.id, row] as const));
  const listingIds = Array.from(new Set(ranked.flatMap((scored) => byId.get(scored.jobId)?.listing_id ?? [])));
  const { data: listings } = listingIds.length > 0 ? await supabase.from("listings").select("id, title, website").in("id", listingIds) : { data: [] };
  const names = new Map(((listings ?? []) as { id: string; title: string; website: string | null }[]).map((listing) => [listing.id, listing] as const));

  const matches = ranked.flatMap((scored) => {
    const row = byId.get(scored.jobId);
    const listing = row?.listing_id ? names.get(row.listing_id) : null;
    if (!row || !listing) return [];
    return [
      {
        id: row.id,
        title: row.title,
        company: plainName(listing.title),
        website: listing.website,
        location: row.location_name ?? "",
        score: scored.score,
        skills: scored.matchedSkills,
        note: scored.fitNotes[0] ?? null,
      },
    ];
  });
  return { matches, read: rows.length };
}

export const DEMO_PROFILE_LABEL: DemoProfile = {
  headline: DEMO_PROFILE.headline ?? "",
  location: DEMO_PROFILE.location ?? "",
  years: DEMO_PROFILE.yearsExperience ?? 0,
  skills: DEMO_PROFILE.skills,
};

/** Every number on the landing hero comes from here; nothing is typed in by hand. */
export async function loadLandingLive(supabase: SupabaseClient, totals: { companies: number }): Promise<LandingLive> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ data: facets }, { count: weekRoles }, { count: dayRoles }, tours, fresherRoles, demo] = await Promise.all([
    supabase.rpc("tech_atlas_job_facets", { p_city_terms: null, p_country: null, p_levels: [], p_workplaces: [], p_categories: [], p_freshers: false }),
    supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("is_active", true).gte("posted_at", weekAgo),
    supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("is_active", true).gte("posted_at", dayAgo),
    loadTours(supabase),
    loadFresherRoles(supabase),
    loadDemoMatches(supabase),
  ]);

  const facetCounts = (facets ?? EMPTY_FACETS) as JobFacets;
  return {
    roles: Number(facetCounts.roles ?? 0),
    companies: facetCounts.companies?.length ?? totals.companies,
    weekRoles: weekRoles ?? 0,
    dayRoles: dayRoles ?? 0,
    facets: { ...facetCounts, freshers: Number(facetCounts.freshers ?? 0), companies: [] },
    tours,
    fresherRoles,
    demoProfile: DEMO_PROFILE_LABEL,
    demoMatches: demo.matches,
    demoRead: demo.read,
  };
}
