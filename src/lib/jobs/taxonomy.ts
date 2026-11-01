/** Filter vocabulary shared by the database, the facets API and the explorer, so ids and labels never drift apart. */

export const LEVELS = [
  { id: "intern", label: "Intern" },
  { id: "entry", label: "Entry level" },
  { id: "mid", label: "Mid level" },
  { id: "senior", label: "Senior" },
  { id: "lead", label: "Lead" },
  { id: "executive", label: "Director and above" },
] as const;

export const WORK_MODES = [
  { id: "on_site", label: "On-site" },
  { id: "hybrid", label: "Hybrid" },
  { id: "remote", label: "Remote" },
] as const;

export const ROLE_CATEGORIES = [
  { id: "engineering", label: "Software engineering" },
  { id: "backend", label: "Backend" },
  { id: "frontend", label: "Frontend" },
  { id: "fullstack", label: "Full stack" },
  { id: "mobile", label: "Mobile" },
  { id: "devops", label: "DevOps and infrastructure" },
  { id: "data", label: "Data" },
  { id: "ml_ai", label: "Machine learning and AI" },
  { id: "security", label: "Security" },
  { id: "qa", label: "QA and testing" },
  { id: "hardware", label: "Hardware and embedded" },
  { id: "eng_management", label: "Engineering management" },
  { id: "product", label: "Product" },
  { id: "design", label: "Design" },
  { id: "sales", label: "Sales and partnerships" },
  { id: "marketing", label: "Marketing" },
  { id: "customer", label: "Customer success and support" },
  { id: "people_ops", label: "People, finance and operations" },
  { id: "consulting", label: "Consulting and solutions" },
  { id: "other", label: "Other" },
] as const;

export type LevelId = (typeof LEVELS)[number]["id"];
export type WorkModeId = (typeof WORK_MODES)[number]["id"];
export type RoleCategoryId = (typeof ROLE_CATEGORIES)[number]["id"];

export const LEVEL_IDS = LEVELS.map((item) => item.id);
export const WORK_MODE_IDS = WORK_MODES.map((item) => item.id);
export const ROLE_CATEGORY_IDS = ROLE_CATEGORIES.map((item) => item.id);

/** The job-level part of the explorer filters. Empty lists and false mean "no filter". */
export type JobFilters = {
  levels: string[];
  workModes: string[];
  categories: string[];
  freshers: boolean;
};

export const NO_JOB_FILTERS: JobFilters = { levels: [], workModes: [], categories: [], freshers: false };

export const hasJobFilters = (filters: JobFilters) =>
  filters.levels.length > 0 || filters.workModes.length > 0 || filters.categories.length > 0 || filters.freshers;

/** What `tech_atlas_job_facets` returns, with counts of roles. */
export type JobFacets = {
  levels: Record<string, number>;
  workplaces: Record<string, number>;
  categories: Record<string, number>;
  freshers: number;
  roles: number;
  /** Companies with at least one role that passes every filter, with how many roles that is. */
  companies: [string, number][];
};

export const EMPTY_FACETS: JobFacets = { levels: {}, workplaces: {}, categories: {}, freshers: 0, roles: 0, companies: [] };

/** Keeps only known ids from a comma separated list, in the order given and without repeats. */
export function parseIdList(value: string | null | undefined, allowed: readonly string[]): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  for (const part of value.split(",")) {
    const id = part.trim();
    if (allowed.includes(id)) seen.add(id);
  }
  return [...seen];
}
