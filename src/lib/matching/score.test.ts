/**
 * Unit tests: matching engine scoring.
 * Run with: npx tsx src/lib/matching/score.test.ts
 */
import assert from "node:assert";
import { buildScoringContext, levelFromTitle, levelFromYears, locationTerms, rankJobs, scoreJob } from "./score";
import type { MatchJob, MatchProfile } from "./types";

const profile: MatchProfile = {
  skills: ["Azure", "C#", "Java", "Python", "React", "Terraform", "C"],
  level: "mid",
  yearsExperience: 4.7,
  location: "Bangalore",
  headline: "Full stack software engineer",
  roleTitles: ["Software Engineer", "Software Engineering Intern"],
};
const context = buildScoringContext(profile);

const job = (overrides: Partial<MatchJob> & { id: string; title: string }): MatchJob => ({
  department: null,
  locationName: "Bengaluru, India",
  workplaceType: "hybrid",
  level: "mid",
  ...overrides,
});

// A title naming a skill, at the right level, in the right city, ranks near the top.
const strong = scoreJob(context, job({ id: "a", title: "React Developer" }));
assert.ok(strong && strong.score >= 85, `expected a strong score, got ${strong?.score}`);
assert.deepStrictEqual(strong?.matchedSkills, ["React"]);
assert.strictEqual(strong?.levelFit, "exact");
assert.strictEqual(strong?.locationFit, "local");

// A generic software title still matches through the profile's kind of work.
const generic = scoreJob(context, job({ id: "b", title: "Senior Software Development Engineer", level: "senior" }));
assert.ok(generic && generic.score >= 45 && generic.score < strong!.score);
assert.strictEqual(generic?.levelFit, "stretch");

// Unrelated roles are left out rather than scored low.
assert.strictEqual(scoreJob(context, job({ id: "c", title: "Finance Manager", department: "Finance" })), null);
assert.strictEqual(scoreJob(context, job({ id: "d", title: "Mechanical Design Engineer", department: "Mechanical" })), null);

// One-letter skills never match inside words, and C does not match C++ or Cloud.
const cLoose = scoreJob(buildScoringContext({ ...profile, skills: ["C"], headline: null, roleTitles: [] }), job({ id: "e", title: "Cloud Support Associate" }));
assert.strictEqual(cLoose, null);

// "C#" and "Java" are not found inside "JavaScript" or "C++".
const javaInJs = scoreJob(buildScoringContext({ ...profile, skills: ["Java"], headline: null, roleTitles: [] }), job({ id: "f", title: "JavaScript Engineer" }));
assert.ok(!javaInJs || javaInJs.matchedSkills.length === 0);

// Aliases: a profile with "Kubernetes" matches a "K8s" title.
const alias = scoreJob(buildScoringContext({ ...profile, skills: ["Kubernetes"], headline: null, roleTitles: [] }), job({ id: "g", title: "K8s Platform Engineer" }));
assert.deepStrictEqual(alias?.matchedSkills, ["Kubernetes"]);

// Remote and elsewhere locations.
const remote = scoreJob(context, job({ id: "h", title: "React Developer", locationName: "Remote", workplaceType: "remote" }));
assert.strictEqual(remote?.locationFit, "remote");
const away = scoreJob(context, job({ id: "i", title: "React Developer", locationName: "London, UK", workplaceType: "on_site" }));
assert.strictEqual(away?.locationFit, "elsewhere");
assert.ok(away!.score < strong!.score);
assert.ok(away!.gapNotes.some((note) => note.includes("Bangalore")));

// Ranking is best-first, capped, and stable for equal scores.
const jobs = [
  job({ id: "z2", title: "Software Engineer" }),
  job({ id: "z1", title: "Software Engineer" }),
  job({ id: "top", title: "React Developer" }),
  job({ id: "skip", title: "HR Business Partner", department: "People" }),
];
const { ranked, shortlisted } = rankJobs(context, jobs, 2);
assert.strictEqual(shortlisted, 3);
assert.deepStrictEqual(ranked.map((item) => item.jobId), ["top", "z1"]);

// Scores are deterministic.
assert.strictEqual(JSON.stringify(rankJobs(context, jobs, 5)), JSON.stringify(rankJobs(context, jobs, 5)));

// Helpers.
assert.strictEqual(levelFromYears(0.5), "entry");
assert.strictEqual(levelFromYears(4.7), "mid");
assert.strictEqual(levelFromYears(12), "lead");
assert.strictEqual(levelFromYears(null), null);
assert.ok(locationTerms("Bangalore").includes("bengaluru"));
assert.deepStrictEqual(locationTerms("Remote"), []);

// Seniority stated in the title beats the stored level, which defaults to mid.
assert.strictEqual(levelFromTitle("Principal Engineer, Data [ 8+ years ]"), "lead");
assert.strictEqual(levelFromTitle("Sr. Backend Engineer"), "senior");
assert.strictEqual(levelFromTitle("Software Engineer, 7+ years"), "senior");
assert.strictEqual(levelFromTitle("Senior Director of Engineering"), "executive");
assert.strictEqual(levelFromTitle("Software Engineering Intern"), "intern");
assert.strictEqual(levelFromTitle("Associate Software Engineer"), "entry");
assert.strictEqual(levelFromTitle("Software Engineer"), null);
assert.strictEqual(levelFromTitle("Product Manager, Growth"), null);
assert.strictEqual(levelFromTitle("Account Manager"), null);
assert.strictEqual(levelFromTitle("Engineering Manager - Axion"), "lead");
assert.strictEqual(levelFromTitle("Sr./Staff Backend Engineer"), "lead");
assert.strictEqual(levelFromTitle("Staff Accountant"), null);
assert.strictEqual(levelFromTitle("Senior Manager, Finance"), "senior");
const principal = scoreJob(context, job({ id: "p1", title: "Principal Engineer, Java", level: "mid" }));
assert.ok(principal && principal.levelFit === "far" && principal.gapNotes.includes("Well above your current level"));

console.log("Matching scoring tests passed.");
