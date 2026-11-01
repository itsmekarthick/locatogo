/** Kinds of work, inferred from job titles and from the skills on a resume. */
export type Family =
  | "software"
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile"
  | "cloud"
  | "data"
  | "ml"
  | "qa"
  | "security"
  | "design"
  | "product"
  | "embedded";

export const FAMILY_LABEL: Record<Family, string> = {
  software: "software engineering",
  frontend: "frontend",
  backend: "backend",
  fullstack: "full stack",
  mobile: "mobile",
  cloud: "cloud and DevOps",
  data: "data",
  ml: "machine learning",
  qa: "quality engineering",
  security: "security",
  design: "design",
  product: "product",
  embedded: "embedded",
};

// Applied to a job's title and department, and to past role titles on a resume.
const TITLE_PATTERNS: [Family, RegExp][] = [
  ["fullstack", /\bfull[\s-]?stack\b/i],
  ["frontend", /\b(front[\s-]?end|ui engineer|web developer|react|angular|vue|svelte)\b/i],
  ["backend", /\b(back[\s-]?end|server[\s-]?side|api engineer)\b/i],
  ["mobile", /\b(android|ios|mobile|react native|flutter)\b/i],
  ["cloud", /\b(devops|sre|site reliability|platform engineer|cloud|infrastructure|release engineer)\b/i],
  ["data", /\b(data (engineer|scientist|analyst|platform|architect)|analytics|business intelligence|etl)\b/i],
  ["ml", /\b(ml|machine learning|ai engineer|applied scientist|nlp|computer vision|llm|deep learning)\b/i],
  ["qa", /\b(qa|quality (assurance|engineer)|sdet|test (engineer|automation)|automation engineer)\b/i],
  ["security", /\b(security|appsec|infosec|cyber)\b/i],
  ["design", /\b(ux|ui\/ux|product designer|designer)\b/i],
  ["product", /\bproduct (manager|owner)\b/i],
  ["embedded", /\b(embedded|firmware|fpga|rtl|vlsi|hardware engineer)\b/i],
  ["software", /\b(software|developer|sde|swe|programmer|application engineer)\b|development engineer/i],
];

export function familiesFromText(text: string): Set<Family> {
  const found = new Set<Family>();
  for (const [family, pattern] of TITLE_PATTERNS) if (pattern.test(text)) found.add(family);
  return found;
}

// Lowercase skill keyword to the kinds of work it points at.
const SKILL_FAMILIES: Record<string, Family[]> = {
  react: ["frontend"], angular: ["frontend"], vue: ["frontend"], svelte: ["frontend"], "next.js": ["frontend", "fullstack"],
  html: ["frontend"], css: ["frontend"], tailwind: ["frontend"], typescript: ["frontend", "backend"], javascript: ["frontend", "backend"],
  "node.js": ["backend"], express: ["backend"], django: ["backend"], flask: ["backend"], fastapi: ["backend"], spring: ["backend"],
  "spring boot": ["backend"], ".net": ["backend"], "asp.net": ["backend"], java: ["backend"], "c#": ["backend"], go: ["backend"],
  golang: ["backend"], php: ["backend"], ruby: ["backend"], rails: ["backend"], graphql: ["backend"], "rest apis": ["backend"],
  microservices: ["backend"], python: ["backend", "data"], sql: ["backend", "data"], postgresql: ["backend", "data"],
  mysql: ["backend", "data"], mongodb: ["backend", "data"], redis: ["backend"],
  aws: ["cloud"], azure: ["cloud"], gcp: ["cloud"], kubernetes: ["cloud"], docker: ["cloud"], terraform: ["cloud"],
  "ci/cd": ["cloud"], jenkins: ["cloud"], "github actions": ["cloud"], "azure devops": ["cloud"], ansible: ["cloud"], linux: ["cloud"],
  pytorch: ["ml"], tensorflow: ["ml"], "scikit-learn": ["ml"], langchain: ["ml"], llm: ["ml"], nlp: ["ml"],
  spark: ["data"], hadoop: ["data"], airflow: ["data"], kafka: ["data", "backend"], dbt: ["data"], snowflake: ["data"],
  databricks: ["data"], "power bi": ["data"], tableau: ["data"],
  swift: ["mobile"], swiftui: ["mobile"], android: ["mobile"], kotlin: ["mobile", "backend"], flutter: ["mobile"], "react native": ["mobile", "frontend"],
  selenium: ["qa"], cypress: ["qa"], playwright: ["qa"], jest: ["qa"],
  figma: ["design"], "c++": ["embedded", "backend"], rtos: ["embedded"], verilog: ["embedded"],
};

const ENGINEERING: Family[] = ["software", "frontend", "backend", "fullstack", "mobile", "cloud", "data", "ml", "qa", "security", "embedded"];

export function familiesFromProfile(skills: string[], texts: string[]): Set<Family> {
  const found = new Set<Family>();
  for (const skill of skills) for (const family of SKILL_FAMILIES[skill.trim().toLowerCase()] ?? []) found.add(family);
  for (const text of texts) for (const family of familiesFromText(text)) found.add(family);
  if (ENGINEERING.some((family) => found.has(family) && family !== "software")) found.add("software");
  return found;
}

/** 0 to 1: how close a job's kind of work is to the profile's. */
export function roleAffinity(profile: Set<Family>, job: Set<Family>): { score: number; shared: Family | null } {
  if (job.size === 0) return { score: 0, shared: null };

  const specific = [...job].filter((family) => family !== "software");
  const shared = specific.find((family) => profile.has(family));
  if (shared) return { score: 1, shared };

  const adjacent = (job.has("fullstack") && (profile.has("frontend") || profile.has("backend"))) || (profile.has("fullstack") && (job.has("frontend") || job.has("backend")));
  if (adjacent) return { score: 0.8, shared: job.has("fullstack") ? (profile.has("frontend") ? "frontend" : "backend") : "fullstack" };

  if (specific.length === 0 && job.has("software") && ENGINEERING.some((family) => profile.has(family))) return { score: 0.7, shared: "software" };

  return { score: 0, shared: null };
}
