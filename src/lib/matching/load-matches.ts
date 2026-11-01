import type { SupabaseClient } from "@supabase/supabase-js";
import { loadMatchProfile, type LoadedMatchProfile } from "./profile";
import type { LastRun, MatchItem, NotesSource } from "./types";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

type Listing = { title?: string | null; slug?: string | null; city?: string | null; website?: string | null };
type JobEmbed = {
  title: string;
  location_name: string | null;
  workplace_type: string | null;
  apply_url: string | null;
  is_active: boolean;
  listings: Listing | Listing[] | null;
};

const one = <T,>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null));

function isStale(completedAt: string) {
  return Date.now() - new Date(completedAt).getTime() > STALE_AFTER_MS;
}

export type MatchesData =
  | { status: "error" }
  | { status: "empty"; profileKnown: boolean }
  | {
      status: "ok";
      loaded: LoadedMatchProfile;
      items: MatchItem[];
      lastRun: LastRun | null;
      needsRun: boolean;
      /** How many saved matches name each skill. */
      skillCounts: Record<string, number>;
    };

/** Everything the dashboard's Matches view needs, read with the signed-in client so row level security applies. */
export async function loadMatchesData(supabase: SupabaseClient, userId: string): Promise<MatchesData> {
  let loaded: LoadedMatchProfile | null;
  try {
    loaded = await loadMatchProfile(supabase, userId);
  } catch {
    return { status: "error" };
  }
  if (!loaded || loaded.profile.skills.length === 0) return { status: "empty", profileKnown: Boolean(loaded) };

  const [{ data: matches, error: matchError }, { data: run, error: runError }] = await Promise.all([
    supabase
      .from("job_matches")
      .select("job_id, score, skills_score, role_score, level_score, location_score, matched_skills, fit_notes, gap_notes, company_jobs(title, location_name, workplace_type, apply_url, is_active, listings(title, slug, city, website))")
      .eq("user_id", userId)
      .order("rank"),
    supabase.from("match_runs").select("profile_hash, scope, roles_in_scope, roles_read, shortlisted, notes_source, completed_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (matchError || runError) {
    console.error("Matches read error:", matchError ?? runError);
    return { status: "error" };
  }

  const items: MatchItem[] = [];
  const skillCounts: Record<string, number> = {};
  for (const row of matches ?? []) {
    const job = one(row.company_jobs as JobEmbed | JobEmbed[] | null);
    if (!job || !job.is_active) continue;
    const company = one(job.listings);
    for (const skill of row.matched_skills ?? []) skillCounts[skill] = (skillCounts[skill] ?? 0) + 1;
    items.push({
      id: String(row.job_id),
      title: job.title,
      company: company?.title || "Tech company",
      slug: company?.slug || null,
      website: company?.website || null,
      location: job.location_name || company?.city || "Location not listed",
      workplace: job.workplace_type,
      applyUrl: job.apply_url,
      score: row.score,
      breakdown: { skills: row.skills_score, role: row.role_score, level: row.level_score, location: row.location_score },
      matchedSkills: row.matched_skills ?? [],
      fitNotes: row.fit_notes ?? [],
      gapNotes: row.gap_notes ?? [],
    });
  }

  const lastRun: LastRun | null = run
    ? {
        completedAt: run.completed_at,
        scope: run.scope,
        rolesInScope: run.roles_in_scope,
        rolesRead: run.roles_read,
        shortlisted: run.shortlisted,
        notesSource: run.notes_source as NotesSource,
      }
    : null;

  const needsRun = !run || run.profile_hash !== loaded.hash || isStale(run.completed_at);
  return { status: "ok", loaded, items, lastRun, needsRun, skillCounts };
}
