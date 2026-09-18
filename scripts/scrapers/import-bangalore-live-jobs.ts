import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { harvestLinkedInJobs, type HarvestedJob } from "./linkedin-jobs-harvester.ts";

const DOMAIN_ID = "461e4ee7-7a16-43b3-b342-5a968e44f306";
const TENANT_ID = "1c186ac3-a365-4653-bd47-b87758890dfb";
type CompanyRow = { id: string; title: string; locality: string | null };

function loadEnv(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) values[match[1]] = (match[2] || "").trim().replace(/^['"]|['"]$/g, "");
  }
  return values;
}

function normalizeCompanyName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(private|pvt|limited|ltd|inc|corporation|corp|technologies|technology|india|development|centre|center)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function findCompany(job: HarvestedJob, companies: Array<{ id: string; title: string; locality: string | null }>) {
  const jobName = normalizeCompanyName(job.companyName);
  const exact = companies.filter((company) => normalizeCompanyName(company.title) === jobName);
  if (exact.length === 1) return exact[0];

  const contained = companies.filter((company) => {
    const companyName = normalizeCompanyName(company.title);
    return companyName.length >= 6 && jobName.length >= 6 && (companyName.includes(jobName) || jobName.includes(companyName));
  });
  return contained.length === 1 ? contained[0] : null;
}

async function fetchAllCompanies(supabase: SupabaseClient) {
  const companies: CompanyRow[] = [];
  for (let offset = 0; offset < 10000; offset += 1000) {
    const { data, error } = await supabase
      .from("listings")
      .select("id,title,locality")
      .eq("domain_id", DOMAIN_ID)
      .not("company_type", "is", null)
      .range(offset, offset + 999);
    if (error) throw error;
    companies.push(...((data || []) as CompanyRow[]));
    if (!data || data.length < 1000) break;
  }
  return companies;
}

async function fetchExistingSourceUrls(supabase: SupabaseClient) {
  const urls = new Set<string>();
  for (let offset = 0; offset < 10000; offset += 1000) {
    const { data, error } = await supabase.from("company_jobs").select("source_url").range(offset, offset + 999);
    if (error) throw error;
    for (const row of (data || []) as Array<{ source_url: string | null }>) {
      if (row.source_url) urls.add(row.source_url);
    }
    if (!data || data.length < 1000) break;
  }
  return urls;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const startedAt = new Date().toISOString();
  const companies = await fetchAllCompanies(supabase);
  const existingSourceUrls = await fetchExistingSourceUrls(supabase);

  console.log(`Loaded ${companies.length} fresh Bangalore companies. Harvesting live jobs...`);
  const jobs = await harvestLinkedInJobs({ maxPagesPerKeyword: 3, delayMs: 500 });
  const unmatched: HarvestedJob[] = [];
  const records: Array<Record<string, unknown>> = [];

  for (const job of jobs) {
    const company = findCompany(job, companies);
    if (!company) {
      unmatched.push(job);
      continue;
    }
    if (existingSourceUrls.has(job.sourceUrl)) continue;
    records.push({
      tenant_id: TENANT_ID,
      listing_id: company.id,
      title: job.title,
      department: job.department,
      location_name: job.location || company.locality || "Bengaluru, Karnataka, India",
      workplace_type: job.workplaceType,
      experience_level: job.experienceLevel,
      apply_url: job.applyUrl,
      source_url: job.sourceUrl,
      company_url: job.companyUrl,
      source_search_url: job.sourceSearchUrl,
      description: job.description,
      employment_type: job.employmentType,
      source_fetched_at: job.sourceFetchedAt,
      ats_job_id: `linkedin:${job.jobId}`,
      is_active: true,
      posted_at: job.sourceFetchedAt,
    });
  }

  let inserted = 0;
  for (let offset = 0; offset < records.length; offset += 500) {
    const { error } = await supabase.from("company_jobs").insert(records.slice(offset, offset + 500));
    if (error) throw error;
    inserted += Math.min(500, records.length - offset);
    console.log(`Inserted ${inserted} / ${records.length} live jobs`);
  }

  const log = {
    startedAt,
    completedAt: new Date().toISOString(),
    source: "linkedin_guest_jobs",
    companyCount: companies.length,
    harvestedCount: jobs.length,
    insertedCount: inserted,
    unmatchedCount: unmatched.length,
    unmatchedCompanies: [...new Set(unmatched.map((job) => job.companyName))],
    searchUrls: [...new Set(jobs.map((job) => job.sourceSearchUrl))],
    jobUrls: [...new Set(jobs.map((job) => job.sourceUrl))],
    unmatchedJobs: unmatched,
  };
  fs.mkdirSync(path.join(process.cwd(), "logs"), { recursive: true });
  const logPath = path.join(process.cwd(), "logs", `bangalore-live-jobs-${startedAt.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), "utf8");
  console.log(JSON.stringify({ harvested: jobs.length, inserted, unmatched: unmatched.length, logPath }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});