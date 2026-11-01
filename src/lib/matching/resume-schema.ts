import { z } from "zod";
import { EXPERIENCE_LEVELS, type ExperienceLevel } from "./types";
import { levelFromYears } from "./score";

const text = (max: number) => z.string().trim().min(1).max(max);
const year = z.number().int().min(1950).max(2100);

const workItemSchema = z.object({
  title: text(120),
  company: text(120).nullish().catch(null),
  start_year: year.nullish().catch(null),
  end_year: year.nullish().catch(null),
});

const educationItemSchema = z.object({
  degree: text(120),
  field: text(120).nullish().catch(null),
  institution: text(160).nullish().catch(null),
  year: year.nullish().catch(null),
});

/** Lenient on shape: bad optional fields become null, bad list items are dropped. */
const extractionSchema = z.object({
  headline: z.string().trim().max(200).nullish().catch(null),
  level: z.string().trim().toLowerCase().nullish().catch(null),
  years_experience: z.coerce.number().min(0).max(60).nullish().catch(null),
  skills: z.array(z.unknown()).catch([]),
  work_history: z.array(z.unknown()).catch([]),
  education: z.array(z.unknown()).catch([]),
});

export type ResumeWorkItem = { title: string; company: string | null; startYear: number | null; endYear: number | null };
export type ResumeEducationItem = { degree: string; field: string | null; institution: string | null; year: number | null };

export type ResumeExtraction = {
  skills: string[];
  headline: string | null;
  level: ExperienceLevel | null;
  yearsExperience: number | null;
  workHistory: ResumeWorkItem[];
  education: ResumeEducationItem[];
};

function items<T>(list: unknown[], schema: z.ZodType<T>, limit: number): T[] {
  const result: T[] = [];
  for (const entry of list) {
    const parsed = schema.safeParse(entry);
    if (parsed.success) result.push(parsed.data);
    if (result.length === limit) break;
  }
  return result;
}

function parseJson(response: string): unknown {
  const cleaned = response.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function cleanSkills(values: unknown[]): string[] {
  const unique = new Map<string, string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const skill = value.trim().slice(0, 60);
    if (skill && !unique.has(skill.toLocaleLowerCase())) unique.set(skill.toLocaleLowerCase(), skill);
    if (unique.size === 15) break;
  }
  return Array.from(unique.values());
}

/**
 * Reads the model response for a resume. A plain JSON array or comma list is still
 * accepted so that skills are kept when the model ignores the requested shape.
 */
export function parseResumeExtraction(response: string): ResumeExtraction {
  const json = parseJson(response);
  const empty: ResumeExtraction = { skills: [], headline: null, level: null, yearsExperience: null, workHistory: [], education: [] };

  if (Array.isArray(json)) return { ...empty, skills: cleanSkills(json) };
  const parsed = extractionSchema.safeParse(json);
  if (!parsed.success) {
    return { ...empty, skills: cleanSkills(response.replace(/[\[\]"{}]/g, "").split(",")) };
  }

  const data = parsed.data;
  const yearsExperience = data.years_experience == null ? null : Math.round(data.years_experience * 10) / 10;
  const stated = EXPERIENCE_LEVELS.find((level) => level === data.level);

  return {
    skills: cleanSkills(data.skills),
    headline: data.headline || null,
    level: stated ?? levelFromYears(yearsExperience),
    yearsExperience,
    workHistory: items(data.work_history, workItemSchema, 6).map((item) => ({
      title: item.title,
      company: item.company ?? null,
      startYear: item.start_year ?? null,
      endYear: item.end_year ?? null,
    })),
    education: items(data.education, educationItemSchema, 3).map((item) => ({
      degree: item.degree,
      field: item.field ?? null,
      institution: item.institution ?? null,
      year: item.year ?? null,
    })),
  };
}

export const RESUME_EXTRACTION_PROMPT = `Read this resume and return one JSON object with exactly these keys:
- "skills": the 10 to 15 most prominent technical skills, tools and programming languages, as strings
- "headline": a short professional headline such as "Senior backend engineer", at most 80 characters
- "level": one of "intern", "entry", "mid", "senior", "lead", "executive", judged from scope and years of experience
- "years_experience": total years of professional experience as a number, 0 if none
- "work_history": up to 6 most recent roles as objects with "title", "company", "start_year", "end_year" (null if current)
- "education": up to 3 entries as objects with "degree", "field", "institution", "year"
Use null for anything the resume does not state. Return only the JSON object.`;
