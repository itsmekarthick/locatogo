import { FAMILY_LABEL, familiesFromProfile, familiesFromText, roleAffinity, type Family } from "./families";
import {
  EXPERIENCE_LEVELS,
  type ExperienceLevel,
  type LevelFit,
  type LocationFit,
  type MatchJob,
  type MatchProfile,
  type ScoredJob,
} from "./types";

export const WEIGHTS = { skills: 0.35, role: 0.25, level: 0.25, location: 0.15 } as const;

const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  intern: "Internship",
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
};

// Names people use for the same place; the first term is the one shown.
const LOCATION_GROUPS = [
  ["bengaluru", "bangalore"],
  ["delhi", "new delhi", "gurgaon", "gurugram", "noida", "ncr"],
  ["mumbai", "bombay", "navi mumbai"],
  ["hyderabad"],
  ["chennai"],
  ["pune"],
  ["new york", "nyc", "brooklyn", "manhattan"],
  ["san francisco", "bay area", "silicon valley", "palo alto", "mountain view", "san jose", "sunnyvale", "menlo park"],
  ["seattle", "bellevue", "redmond"],
  ["london"],
  ["singapore"],
];

const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["js"],
  typescript: ["ts"],
  "node.js": ["node", "nodejs"],
  react: ["react.js", "reactjs"],
  "next.js": ["nextjs"],
  kubernetes: ["k8s"],
  postgresql: ["postgres"],
  golang: ["go"],
  "machine learning": ["ml"],
  "c#": ["csharp"],
  ".net": ["dotnet"],
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Locations that count as "here" for a profile, lowercased and including common alternate names. */
export function locationTerms(location: string | null): string[] {
  const value = location?.trim().toLowerCase();
  if (!value || value === "remote") return [];
  for (const group of LOCATION_GROUPS) if (group.some((term) => value.includes(term))) return group;
  return [value];
}

export function levelFromYears(years: number | null): ExperienceLevel | null {
  if (years == null || Number.isNaN(years)) return null;
  if (years < 1) return "entry";
  if (years < 3) return "entry";
  if (years < 6) return "mid";
  if (years < 10) return "senior";
  return "lead";
}

const levelIndex = (level: ExperienceLevel) => EXPERIENCE_LEVELS.indexOf(level);

// Checked from most to least senior so "Senior Director" reads as executive.
const TITLE_LEVELS: [ExperienceLevel, RegExp][] = [
  ["executive", /\b(director|vp|vice president|chief|cto|ceo|head of)\b/i],
  ["lead", /\b(principal|distinguished|architect|lead|engineering manager|software (development )?manager|manager,? (of )?(software )?engineering)\b|\bstaff\b(?=(\s+\w+){0,2}\s+(engineer|scientist|developer|designer))/i],
  ["senior", /\b(senior|sr\.?)(?=\W|$)/i],
  ["intern", /\bintern(ship)?\b/i],
  ["entry", /\b(junior|jr\.?|graduate|entry[\s-]level|fresher|trainee|associate)(?=\W|$)/i],
];

/**
 * Jobs store a level that defaults to mid, so a stated seniority in the title wins, then a stated years requirement.
 * Returns null when the title says nothing and the stored level should be used.
 */
export function levelFromTitle(title: string): ExperienceLevel | null {
  for (const [level, pattern] of TITLE_LEVELS) if (pattern.test(title)) return level;
  const years = /(\d{1,2})\s*\+?\s*(?:years|yrs)/i.exec(title);
  if (!years) return null;
  const count = Number(years[1]);
  if (count >= 10) return "lead";
  if (count >= 6) return "senior";
  if (count >= 3) return "mid";
  return null;
}

function levelScore(profile: ExperienceLevel | null, job: ExperienceLevel | null): { score: number; fit: LevelFit } {
  if (!profile || !job) return { score: 0.5, fit: "unknown" };
  const distance = levelIndex(job) - levelIndex(profile);
  if (distance === 0) return { score: 1, fit: "exact" };
  if (distance === 1) return { score: 0.7, fit: "stretch" };
  if (distance === -1) return { score: 0.6, fit: "below" };
  return { score: distance > 0 ? 0.25 : 0.2, fit: "far" };
}

function locationScore(profileLocation: string | null, job: MatchJob): { score: number; fit: LocationFit } {
  if (!profileLocation?.trim()) return { score: 0.5, fit: "unknown" };
  const wantsRemote = profileLocation.trim().toLowerCase() === "remote";
  if (job.workplaceType === "remote") return { score: wantsRemote ? 1 : 0.8, fit: "remote" };
  if (wantsRemote) return { score: 0.3, fit: "elsewhere" };
  const place = job.locationName.toLowerCase();
  if (locationTerms(profileLocation).some((term) => place.includes(term))) return { score: 1, fit: "local" };
  return { score: 0.2, fit: "elsewhere" };
}

type SkillMatcher = { skill: string; patterns: RegExp[] };

/** Build the matchers once per run; skills of one character ("C", "R") are too ambiguous in titles to use. */
export function buildSkillMatchers(skills: string[]): SkillMatcher[] {
  const seen = new Set<string>();
  const matchers: SkillMatcher[] = [];
  for (const raw of skills) {
    const skill = raw.trim();
    const key = skill.toLowerCase();
    if (skill.length < 2 || seen.has(key)) continue;
    seen.add(key);
    const names = [key, ...(SKILL_ALIASES[key] ?? [])];
    matchers.push({
      skill,
      patterns: names.map((name) => new RegExp(`(?<![a-z0-9+#.])${escapeRegex(name)}(?![a-z0-9+#])`, "i")),
    });
  }
  return matchers;
}

export type ScoringContext = {
  profile: MatchProfile;
  matchers: SkillMatcher[];
  families: Set<Family>;
  level: ExperienceLevel | null;
};

export function buildScoringContext(profile: MatchProfile): ScoringContext {
  return {
    profile,
    matchers: buildSkillMatchers(profile.skills),
    families: familiesFromProfile(profile.skills, [profile.headline ?? "", ...profile.roleTitles]),
    level: profile.level ?? levelFromYears(profile.yearsExperience),
  };
}

const percent = (value: number) => Math.round(value * 100);

/** Scores one job from 0 to 100, or returns null when neither its title nor its kind of work relates to the profile. */
export function scoreJob(context: ScoringContext, job: MatchJob): ScoredJob | null {
  const text = `${job.title} ${job.department ?? ""}`;
  const matchedSkills = context.matchers.filter((matcher) => matcher.patterns.some((pattern) => pattern.test(text))).map((matcher) => matcher.skill);
  const affinity = roleAffinity(context.families, familiesFromText(text));
  if (matchedSkills.length === 0 && affinity.score === 0) return null;

  const skills = matchedSkills.length === 0 ? 0 : Math.min(1, 0.75 + 0.25 * (matchedSkills.length - 1));
  const jobLevel = levelFromTitle(job.title) ?? job.level;
  const level = levelScore(context.level, jobLevel);
  const location = locationScore(context.profile.location, job);

  const total = WEIGHTS.skills * skills + WEIGHTS.role * affinity.score + WEIGHTS.level * level.score + WEIGHTS.location * location.score;

  const fitNotes: string[] = [];
  const gapNotes: string[] = [];

  if (matchedSkills.length > 0) fitNotes.push(`Title names ${matchedSkills.slice(0, 3).join(", ")}`);
  if (affinity.shared) fitNotes.push(`Fits your ${FAMILY_LABEL[affinity.shared]} background`);
  if (level.fit === "exact" && context.level) fitNotes.push(`${LEVEL_LABEL[context.level]}, in line with your experience`);
  if (level.fit === "stretch") fitNotes.push("A step up from your current level");
  if (location.fit === "local") fitNotes.push(`Based in ${context.profile.location}`);
  if (location.fit === "remote") fitNotes.push("Open to remote work");

  if (matchedSkills.length === 0) gapNotes.push("The title doesn't name your skills, so check the posting");
  if (level.fit === "below") gapNotes.push("Below your current level");
  if (level.fit === "far") gapNotes.push(levelIndex(jobLevel ?? "mid") > levelIndex(context.level ?? "mid") ? "Well above your current level" : "Well below your current level");
  if (location.fit === "elsewhere") gapNotes.push(`Not based in ${context.profile.location ?? "your hub"}`);

  return {
    jobId: job.id,
    score: Math.round(total * 100),
    breakdown: { skills: percent(skills), role: percent(affinity.score), level: percent(level.score), location: percent(location.score) },
    matchedSkills,
    levelFit: level.fit,
    locationFit: location.fit,
    fitNotes: fitNotes.slice(0, 3),
    gapNotes: gapNotes.slice(0, 2),
  };
}

/** Best first; ties go to the more recent job id order so results are stable between runs. */
export function rankJobs(context: ScoringContext, jobs: MatchJob[], limit: number): { ranked: ScoredJob[]; shortlisted: number } {
  const scored: ScoredJob[] = [];
  for (const job of jobs) {
    const result = scoreJob(context, job);
    if (result) scored.push(result);
  }
  scored.sort((a, b) => b.score - a.score || a.jobId.localeCompare(b.jobId));
  return { ranked: scored.slice(0, limit), shortlisted: scored.length };
}
