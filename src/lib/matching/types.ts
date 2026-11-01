export const EXPERIENCE_LEVELS = ["intern", "entry", "mid", "senior", "lead", "executive"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export type WorkplaceType = "on_site" | "hybrid" | "remote";

/** What the matcher knows about a person, read from their resume and profile. */
export type MatchProfile = {
  skills: string[];
  level: ExperienceLevel | null;
  yearsExperience: number | null;
  /** Preferred hub or city as the person typed or picked it. */
  location: string | null;
  headline: string | null;
  /** Titles from past roles, used to infer the kind of work they do. */
  roleTitles: string[];
};

export type MatchJob = {
  id: string;
  title: string;
  department: string | null;
  locationName: string;
  workplaceType: WorkplaceType | null;
  level: ExperienceLevel | null;
};

export type LevelFit = "exact" | "stretch" | "below" | "far" | "unknown";
export type LocationFit = "local" | "remote" | "elsewhere" | "unknown";

/** Each part is a whole number from 0 to 100. */
export type ScoreBreakdown = { skills: number; role: number; level: number; location: number };

export type ScoredJob = {
  jobId: string;
  score: number;
  breakdown: ScoreBreakdown;
  matchedSkills: string[];
  levelFit: LevelFit;
  locationFit: LocationFit;
  fitNotes: string[];
  gapNotes: string[];
};

export type NotesSource = "rules" | "ai";

/** How many of the top matches get a written fit note. */
export const NOTES_FOR = 10;

export type MatchTopPreview = { title: string; company: string; website: string | null; score: number; listingId: string | null; location: string; breakdown: ScoreBreakdown };

/** A role title seen while reading, so the scan can show what is really being read. */
export type ReadSample = { title: string; location: string };

/** The written note for one of the strongest matches. */
export type NoteSample = { title: string; company: string; website: string | null; fit: string | null; gap: string | null };

/** A company with open roles that relate to the profile, placed on the atlas by its listing coordinates. */
export type MatchPin = { id: string; name: string; lat: number; lng: number; score: number };

/** One line of the run stream; every number is something the server actually did. */
export type MatchRunEvent =
  | { type: "start"; scope: string; skills: string[]; level: ExperienceLevel | null; yearsExperience: number | null }
  | { type: "read"; inScope: number; read: number; cap: number; sample: ReadSample[] }
  | { type: "shortlist"; count: number; read: number; skillHits: { skill: string; count: number }[] }
  | { type: "pins"; pins: MatchPin[] }
  | { type: "rank"; top: MatchTopPreview[] }
  | { type: "notes"; source: NotesSource; samples: NoteSample[] }
  | { type: "done"; ranked: number; shortlisted: number; read: number; inScope: number; notesSource: NotesSource }
  | { type: "error"; message: string };

export type MatchItem = {
  id: string;
  title: string;
  company: string;
  slug: string | null;
  website: string | null;
  location: string;
  workplace: string | null;
  applyUrl: string | null;
  score: number;
  breakdown: ScoreBreakdown;
  matchedSkills: string[];
  fitNotes: string[];
  gapNotes: string[];
};

export type LastRun = {
  completedAt: string;
  scope: string;
  rolesInScope: number;
  rolesRead: number;
  shortlisted: number;
  notesSource: NotesSource;
};