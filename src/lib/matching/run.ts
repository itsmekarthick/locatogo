import type { SupabaseClient } from "@supabase/supabase-js";
import { generateAiNotes, type NotesInput } from "./notes";
import { loadMatchProfile } from "./profile";
import { buildScoringContext, levelFromTitle, locationTerms, rankJobs } from "./score";
import { EXPERIENCE_LEVELS, NOTES_FOR, type ExperienceLevel, type MatchJob, type MatchPin, type MatchRunEvent, type NotesSource, type ReadSample, type WorkplaceType } from "./types";

export const PAGE_SIZE = 1000;
export const READ_CAP = 5000;
export const KEEP = 50;
const MAX_PINS = 60;
// About 55 km either way; covers a metro area.
const HUB_RADIUS_DEGREES = 0.5;

type JobRow = {
  id: string;
  title: string;
  department: string | null;
  location_name: string | null;
  workplace_type: string | null;
  experience_level: string | null;
  listing_id: string | null;
};

type ListingRow = { id: string; title: string | null; city: string | null; website: string | null; latitude: number | null; longitude: number | null };

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const SAMPLE_PER_PAGE = 6;

/** Evenly spaced titles from a page of rows, so the scan can show roles that were really read. */
function sampleRows(rows: JobRow[]): ReadSample[] {
  if (rows.length === 0) return [];
  const step = Math.max(1, Math.floor(rows.length / SAMPLE_PER_PAGE));
  const sample: ReadSample[] = [];
  for (let index = 0; index < rows.length && sample.length < SAMPLE_PER_PAGE; index += step) {
    sample.push({ title: rows[index].title.slice(0, 90), location: (rows[index].location_name ?? "").slice(0, 60) });
  }
  return sample;
}

type Scope = { label: string; terms: string[]; includeRemote: boolean; remoteOnly: boolean };

/** Characters that would change the meaning of a PostgREST filter list. */
const cleanTerm = (term: string) => term.replace(/[,()%*\\"':;]/g, " ").replace(/\s+/g, " ").trim();

function resolveScope(location: string | null): Scope {
  const wantsRemote = location?.trim().toLowerCase() === "remote";
  if (wantsRemote) return { label: "Remote roles", terms: [], includeRemote: true, remoteOnly: true };
  const terms = locationTerms(location).map(cleanTerm).filter(Boolean);
  if (terms.length === 0) return { label: "All hubs", terms: [], includeRemote: true, remoteOnly: false };
  const shown = location?.trim() ?? terms[0];
  return { label: `${shown} and remote`, terms, includeRemote: true, remoteOnly: false };
}

function scopeFilter(scope: Scope): string | null {
  if (scope.remoteOnly) return "workplace_type.eq.remote";
  if (scope.terms.length === 0) return null;
  const parts = scope.terms.map((term) => `location_name.ilike.%${term}%`);
  if (scope.includeRemote) parts.push("workplace_type.eq.remote");
  return parts.join(",");
}

const asLevel = (value: string | null): ExperienceLevel | null => EXPERIENCE_LEVELS.find((level) => level === value) ?? null;
const asWorkplace = (value: string | null): WorkplaceType | null => (value === "on_site" || value === "hybrid" || value === "remote" ? value : null);

export type RunResult = { ok: true } | { ok: false; reason: "no_profile" | "no_skills" | "failed" };

/**
 * Reads open roles for the person's hub, scores them in memory, keeps the best ones and writes them
 * with the signed-in client, so row level security keeps every row under the user's own id.
 * Each emit reflects work that has really finished.
 */
export async function runMatching(supabase: SupabaseClient, userId: string, emit: (event: MatchRunEvent) => void): Promise<RunResult> {
  const loaded = await loadMatchProfile(supabase, userId);
  if (!loaded) {
    emit({ type: "error", message: "Upload your resume first so there is a profile to match." });
    return { ok: false, reason: "no_profile" };
  }
  const { profile, hash } = loaded;
  if (profile.skills.length === 0) {
    emit({ type: "error", message: "No skills were found on your profile. Upload a resume or add skills first." });
    return { ok: false, reason: "no_skills" };
  }

  const scope = resolveScope(profile.location);
  const filter = scopeFilter(scope);
  emit({ type: "start", scope: scope.label, skills: profile.skills, level: profile.level, yearsExperience: profile.yearsExperience });

  let countQuery = supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("is_active", true);
  if (filter) countQuery = countQuery.or(filter);
  const { count, error: countError } = await countQuery;
  if (countError) {
    console.error("Match scope count error:", countError);
    emit({ type: "error", message: "Could not read open roles. Try again in a moment." });
    return { ok: false, reason: "failed" };
  }
  const inScope = count ?? 0;
  const toRead = Math.min(inScope, READ_CAP);
  emit({ type: "read", inScope, read: 0, cap: READ_CAP, sample: [] });

  const rows: JobRow[] = [];
  const pageStarts = Array.from({ length: Math.ceil(toRead / PAGE_SIZE) }, (_, index) => index * PAGE_SIZE);
  const pages = new Map<number, JobRow[]>();
  let readSoFar = 0;
  await Promise.all(
    pageStarts.map(async (from) => {
      let query = supabase
        .from("company_jobs")
        .select("id, title, department, location_name, workplace_type, experience_level, listing_id")
        .eq("is_active", true)
        .order("posted_at", { ascending: false })
        .order("id")
        .range(from, from + PAGE_SIZE - 1);
      if (filter) query = query.or(filter);
      const { data, error } = await query;
      if (error) throw error;
      pages.set(from, (data ?? []) as JobRow[]);
      readSoFar += data?.length ?? 0;
      emit({ type: "read", inScope, read: readSoFar, cap: READ_CAP, sample: sampleRows((data ?? []) as JobRow[]) });
    }),
  ).catch((error) => {
    console.error("Match read error:", error);
    pages.clear();
  });
  if (pages.size !== pageStarts.length) {
    emit({ type: "error", message: "Could not read open roles. Try again in a moment." });
    return { ok: false, reason: "failed" };
  }
  for (const from of pageStarts) rows.push(...(pages.get(from) ?? []));

  const jobs: MatchJob[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    department: row.department,
    locationName: row.location_name ?? "",
    workplaceType: asWorkplace(row.workplace_type),
    level: asLevel(row.experience_level),
  }));

  const context = buildScoringContext(profile);
  const { ranked: all, shortlisted } = rankJobs(context, jobs, jobs.length);
  const skillHits = profile.skills
    .map((skill) => ({ skill, count: all.filter((scored) => scored.matchedSkills.includes(skill)).length }))
    .sort((a, b) => b.count - a.count);
  emit({ type: "shortlist", count: shortlisted, read: rows.length, skillHits });

  const kept = all.slice(0, KEEP);
  const rowById = new Map(rows.map((row) => [row.id, row] as const));

  const topIds = kept.slice(0, NOTES_FOR).map((scored) => rowById.get(scored.jobId)?.listing_id).filter((id): id is string => Boolean(id));

  // Prefer companies in the person's own hub; fall back to all shortlisted ones for remote or all-hub scopes.
  const localOnly = all.filter((scored) => scored.locationFit === "local");
  const pinSource = localOnly.length >= 6 ? localOnly : all;
  const bestByListing = new Map<string, number>();
  for (const scored of pinSource) {
    const listingId = rowById.get(scored.jobId)?.listing_id;
    if (listingId && (bestByListing.get(listingId) ?? -1) < scored.score) bestByListing.set(listingId, scored.score);
  }
  const pinCandidates = [...bestByListing.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_PINS * 2);

  const listingById = new Map<string, ListingRow>();
  const listingIds = Array.from(new Set([...topIds, ...pinCandidates.map(([id]) => id)]));
  if (listingIds.length > 0) {
    const { data } = await supabase.from("listings").select("id, title, city, website, latitude, longitude").in("id", listingIds);
    for (const listing of (data ?? []) as ListingRow[]) listingById.set(listing.id, listing);
  }

  let pins: MatchPin[] = pinCandidates.flatMap(([id, score]) => {
    const listing = listingById.get(id);
    if (!listing || listing.latitude == null || listing.longitude == null) return [];
    return [{ id, name: listing.title ?? "Company", lat: listing.latitude, lng: listing.longitude, score }];
  });
  // Listing coordinates are company headquarters, so for a hub keep the densest cluster: companies based in that hub.
  if (localOnly.length >= 6 && pins.length > 0) {
    const near = (a: MatchPin, b: MatchPin) => Math.abs(a.lat - b.lat) <= HUB_RADIUS_DEGREES && Math.abs(a.lng - b.lng) <= HUB_RADIUS_DEGREES;
    let densest: MatchPin[] = [];
    for (const pin of pins) {
      const neighbours = pins.filter((other) => near(pin, other));
      if (neighbours.length > densest.length) densest = neighbours;
    }
    const center = { lat: median(densest.map((pin) => pin.lat)), lng: median(densest.map((pin) => pin.lng)) } as MatchPin;
    pins = pins.filter((pin) => near(center, pin));
  }
  emit({ type: "pins", pins: pins.slice(0, MAX_PINS) });

  const companyOf = (jobId: string) => {
    const listingId = rowById.get(jobId)?.listing_id;
    return (listingId && listingById.get(listingId)?.title) || "Company";
  };
  const websiteOf = (jobId: string) => {
    const listingId = rowById.get(jobId)?.listing_id;
    return (listingId && listingById.get(listingId)?.website) || null;
  };

  emit({
    type: "rank",
    top: kept.slice(0, 5).map((scored) => ({
      title: rowById.get(scored.jobId)?.title ?? "",
      company: companyOf(scored.jobId),
      website: websiteOf(scored.jobId),
      score: scored.score,
      listingId: rowById.get(scored.jobId)?.listing_id ?? null,
      location: rowById.get(scored.jobId)?.location_name ?? "",
      breakdown: scored.breakdown,
    })),
  });

  const notesInput: NotesInput[] = kept.slice(0, NOTES_FOR).map((scored) => {
    const row = rowById.get(scored.jobId)!;
    return {
      jobId: scored.jobId,
      title: row.title,
      department: row.department,
      company: companyOf(scored.jobId),
      location: row.location_name ?? "",
      workplaceType: row.workplace_type,
      level: levelFromTitle(row.title) ?? row.experience_level,
      matchedSkills: scored.matchedSkills,
    };
  });
  const aiNotes = await generateAiNotes(profile, notesInput);
  const notesSource: NotesSource = aiNotes ? "ai" : "rules";

  const computedAt = new Date().toISOString();
  const matchRows = kept.map((scored, index) => {
    const ai = aiNotes?.get(scored.jobId);
    return {
      user_id: userId,
      job_id: scored.jobId,
      rank: index + 1,
      score: scored.score,
      skills_score: scored.breakdown.skills,
      role_score: scored.breakdown.role,
      level_score: scored.breakdown.level,
      location_score: scored.breakdown.location,
      matched_skills: scored.matchedSkills,
      fit_notes: ai ? ai.fit : scored.fitNotes,
      gap_notes: ai ? ai.gap : scored.gapNotes,
      notes_source: ai ? "ai" : "rules",
      computed_at: computedAt,
    };
  });

  emit({
    type: "notes",
    source: notesSource,
    samples: matchRows.slice(0, 3).map((row) => ({
      title: rowById.get(row.job_id)?.title ?? "",
      company: companyOf(row.job_id),
      website: websiteOf(row.job_id),
      fit: row.fit_notes[0] ?? null,
      gap: row.gap_notes[0] ?? null,
    })),
  });

  if (matchRows.length > 0) {
    const { error } = await supabase.from("job_matches").upsert(matchRows, { onConflict: "user_id,job_id" });
    if (error) {
      console.error("Match save error:", error);
      emit({ type: "error", message: "Could not save your matches. Try again in a moment." });
      return { ok: false, reason: "failed" };
    }
  }

  let cleanup = supabase.from("job_matches").delete().eq("user_id", userId);
  if (matchRows.length > 0) cleanup = cleanup.not("job_id", "in", `(${matchRows.map((row) => row.job_id).join(",")})`);
  const { error: cleanupError } = await cleanup;
  if (cleanupError) console.error("Match cleanup error:", cleanupError);

  const { error: runError } = await supabase.from("match_runs").upsert({
    user_id: userId,
    profile_hash: hash,
    scope: scope.label,
    roles_in_scope: inScope,
    roles_read: rows.length,
    shortlisted,
    ranked: matchRows.length,
    notes_source: notesSource,
    completed_at: computedAt,
  });
  if (runError) {
    console.error("Match run save error:", runError);
    emit({ type: "error", message: "Could not save your matches. Try again in a moment." });
    return { ok: false, reason: "failed" };
  }

  emit({ type: "done", ranked: matchRows.length, shortlisted, read: rows.length, inScope, notesSource });
  return { ok: true };
}
