/**
 * Unit tests: resume extraction parsing. Run with `npx tsx src/lib/matching/resume-schema.test.ts`.
 */
import assert from "node:assert";
import { parseResumeExtraction } from "./resume-schema";

console.log("Running resume extraction tests...");

// Full object wrapped in a code fence
const full = parseResumeExtraction(
  "```json\n" +
    JSON.stringify({
      headline: "Senior backend engineer",
      level: "Senior",
      years_experience: 7.25,
      skills: ["Java", "java", " Spring Boot ", 42, "PostgreSQL"],
      work_history: [
        { title: "Backend Engineer", company: "Acme", start_year: 2019, end_year: null },
        { company: "Missing title" },
        { title: "Intern", company: "Beta", start_year: "2017", end_year: 2018 },
      ],
      education: [{ degree: "B.Tech", field: "Computer Science", institution: "NIT", year: 2018 }],
    }) +
    "\n```",
);
assert.deepStrictEqual(full.skills, ["Java", "Spring Boot", "PostgreSQL"]);
assert.strictEqual(full.headline, "Senior backend engineer");
assert.strictEqual(full.level, "senior");
assert.strictEqual(full.yearsExperience, 7.3);
assert.strictEqual(full.workHistory.length, 2);
assert.deepStrictEqual(full.workHistory[0], { title: "Backend Engineer", company: "Acme", startYear: 2019, endYear: null });
assert.strictEqual(full.workHistory[1].startYear, null);
assert.strictEqual(full.education[0].institution, "NIT");

// Invalid level falls back to years
const fallback = parseResumeExtraction(JSON.stringify({ level: "wizard", years_experience: 0.5, skills: ["Go"] }));
assert.strictEqual(fallback.level, "entry");
assert.deepStrictEqual(fallback.skills, ["Go"]);

// Missing level and years stay unknown
const unknown = parseResumeExtraction(JSON.stringify({ skills: ["Rust"], years_experience: null, level: null }));
assert.strictEqual(unknown.level, null);
assert.strictEqual(unknown.yearsExperience, null);

// Plain array and comma list are still accepted as skills
assert.deepStrictEqual(parseResumeExtraction('["React", "TypeScript"]').skills, ["React", "TypeScript"]);
assert.deepStrictEqual(parseResumeExtraction("React, Node.js").skills, ["React", "Node.js"]);

// Skills are capped at 15
const many = parseResumeExtraction(JSON.stringify({ skills: Array.from({ length: 30 }, (_, index) => `Skill${index}`) }));
assert.strictEqual(many.skills.length, 15);

console.log("Resume extraction tests passed.");
