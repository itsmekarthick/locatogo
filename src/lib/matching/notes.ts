import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { MatchProfile } from "./types";

export type NotesInput = {
  jobId: string;
  title: string;
  department: string | null;
  company: string;
  location: string;
  workplaceType: string | null;
  level: string | null;
  matchedSkills: string[];
};

export type AiNotes = { fit: string[]; gap: string[] };

const note = z.string().trim().min(3).transform((value) => value.slice(0, 140));
// The model sometimes returns a single string where a list was asked for.
const lines = z.union([z.array(note), note.transform((value) => [value])]).catch([]);
const entrySchema = z.object({
  id: z.string(),
  fit: lines,
  gap: lines,
});

const TIMEOUT_MS = 12000;

/**
 * Short "why it fits" and "what to check" lines for the strongest matches.
 * The model only sees the profile and the posting's title, team, level and place, so the
 * prompt forbids claims about duties it cannot see. Returns null on any failure so the
 * caller keeps its rule-based notes.
 */
export async function generateAiNotes(profile: MatchProfile, jobs: NotesInput[]): Promise<Map<string, AiNotes> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || jobs.length === 0) return null;

  const candidate = [
    `Headline: ${profile.headline ?? "not stated"}`,
    `Level: ${profile.level ?? "not stated"}`,
    `Years of experience: ${profile.yearsExperience ?? "not stated"}`,
    `Skills: ${profile.skills.join(", ") || "not stated"}`,
    `Recent titles: ${profile.roleTitles.join("; ") || "not stated"}`,
  ].join("\n");

  const roles = jobs
    .map((job) => JSON.stringify({ id: job.jobId, title: job.title, team: job.department, company: job.company, location: job.location, workplace: job.workplaceType, level: job.level, skills_in_title: job.matchedSkills }))
    .join("\n");

  const prompt = `You help a job seeker compare roles. Candidate:\n${candidate}\n\nRoles, one JSON object per line:\n${roles}\n\nFor each role return an object with "id" (copied exactly), "fit" (up to 2 short reasons it suits the candidate) and "gap" (up to 1 short thing to check or a mismatch).\nRules: use only the facts above, never invent duties, requirements or salary; do not mention facts the candidate has not stated, such as level or years of experience; each line under 90 characters; plain sentences with no emoji; return only a JSON array.`;

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: process.env.GEMINI_MATCH_MODEL || "gemini-3.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);
    if (!result) {
      console.error("Match notes timed out");
      return null;
    }

    const text = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      console.error("Match notes were not a list:", text.slice(0, 300));
      return null;
    }

    const allowed = new Set(jobs.map((job) => job.jobId));
    const notes = new Map<string, AiNotes>();
    for (const raw of parsed) {
      const entry = entrySchema.safeParse(raw);
      if (entry.success && allowed.has(entry.data.id) && entry.data.fit.length > 0) {
        notes.set(entry.data.id, { fit: entry.data.fit.slice(0, 2), gap: entry.data.gap.slice(0, 1) });
      }
    }
    if (notes.size === 0) console.error("Match notes had no usable entries:", text.slice(0, 300));
    return notes.size > 0 ? notes : null;
  } catch (error) {
    console.error("Match notes error:", error);
    return null;
  }
}
