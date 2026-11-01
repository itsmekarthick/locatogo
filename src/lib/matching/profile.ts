import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXPERIENCE_LEVELS, type ExperienceLevel, type MatchProfile } from "./types";

/** Bump when scoring changes so saved matches are refreshed. */
export const SCORING_VERSION = 1;

export function profileHash(profile: MatchProfile): string {
  const payload = JSON.stringify({
    v: SCORING_VERSION,
    skills: profile.skills.map((skill) => skill.trim().toLowerCase()).sort(),
    level: profile.level,
    years: profile.yearsExperience,
    location: profile.location?.trim().toLowerCase() ?? null,
    headline: profile.headline?.trim().toLowerCase() ?? null,
    titles: profile.roleTitles.map((title) => title.trim().toLowerCase()).sort(),
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export type LoadedMatchProfile = {
  profile: MatchProfile;
  hash: string;
  hasResume: boolean;
};

function roleTitles(history: unknown): string[] {
  if (!Array.isArray(history)) return [];
  const titles: string[] = [];
  for (const item of history) {
    const title = item && typeof item === "object" ? (item as { title?: unknown }).title : null;
    if (typeof title === "string" && title.trim()) titles.push(title.trim());
  }
  return titles.slice(0, 6);
}

/** Reads the signed-in user's own profile; row level security limits this to their row. Returns null when there is no profile row. */
export async function loadMatchProfile(supabase: SupabaseClient, userId: string): Promise<LoadedMatchProfile | null> {
  const { data, error } = await supabase
    .from("tech_profiles")
    .select("skills, preferred_location, headline, experience_level, years_experience, work_history, resume_storage_path")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("Match profile read error:", error);
    throw new Error("Could not read the match profile.");
  }
  if (!data) return null;

  const skills = Array.isArray(data.skills) ? data.skills.filter((skill): skill is string => typeof skill === "string" && skill.trim().length > 0) : [];
  const level = EXPERIENCE_LEVELS.find((value): value is ExperienceLevel => value === data.experience_level) ?? null;
  const years = data.years_experience == null ? null : Number(data.years_experience);

  const profile: MatchProfile = {
    skills,
    level,
    yearsExperience: years != null && Number.isFinite(years) ? years : null,
    location: typeof data.preferred_location === "string" && data.preferred_location.trim() ? data.preferred_location.trim() : null,
    headline: typeof data.headline === "string" && data.headline.trim() ? data.headline.trim() : null,
    roleTitles: roleTitles(data.work_history),
  };

  return { profile, hash: profileHash(profile), hasResume: Boolean(data.resume_storage_path) };
}
