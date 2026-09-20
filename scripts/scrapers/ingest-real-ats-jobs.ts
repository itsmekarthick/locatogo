import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs, fetchCareerPageJobs } from "../../src/lib/jobs/providers";

const env: Record<string, string> = {};
fs.readFileSync(".env", "utf8")
  .split("\n")
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CONCURRENCY = 10; // Number of companies to process in parallel

async function processCompany(company: any): Promise<{ jobs: number; desc: boolean }> {
  if (!company.careers_url && !company.website) return { jobs: 0, desc: false };

  let jobs: any[] = [];
  let board = company.careers_url ? detectBoard(company.careers_url) : null;
  let providerName = board ? board.provider.toUpperCase() : "CRAWL";
  let descFetched = false;

  console.log(`⏳ [${providerName}] ${company.title} (${company.city})...`);

  // Fetch description if missing
  if (!company.description && company.website) {
    try {
      const res = await fetch(company.website, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const html = await res.text();
        const match =
          html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i);
        if (match && match[1]) {
          const desc = match[1].trim();
          console.log(`   📝 [${company.title}] description extracted`);
          await supabase.from("listings").update({
            description: desc,
            short_description: company.short_description || desc.substring(0, 150),
          }).eq("id", company.id);
          descFetched = true;
        }
      }
    } catch (_) {
      // ignore fetch errors
    }
  }

  // Fetch jobs
  try {
    if (board) {
      jobs = await fetchJobs(board);
    } else {
      const urlToCrawl = company.careers_url || company.website;
      jobs = await fetchCareerPageJobs(urlToCrawl);
    }

    if (!jobs || jobs.length === 0) {
      console.log(`   ℹ️  [${company.title}] 0 jobs found`);
      return { jobs: 0, desc: descFetched };
    }

    console.log(`   ⚡ [${company.title}] ${jobs.length} jobs found — inserting...`);

    // Clear old jobs and insert fresh
    await supabase.from("company_jobs").delete().eq("listing_id", company.id);

    const maxJobs = company.title.toLowerCase().includes("servicenow") ? 650 : 150;
    const jobsToInsert = jobs.slice(0, maxJobs).map((j: any) => {
      let cleanApplyUrl = j.applyUrl;
      if (board && board.provider === "smartrecruiters" && j.providerJobId) {
        cleanApplyUrl = `https://careers.smartrecruiters.com/${board.token}/${j.providerJobId}`;
      }
      return {
        tenant_id: company.tenant_id,
        listing_id: company.id,
        title: j.title,
        department: j.department || "Engineering",
        location_name: j.locationName || `${company.city}, India`,
        workplace_type: j.workplaceType || "hybrid",
        experience_level: "mid",
        apply_url: cleanApplyUrl,
        ats_job_id: board ? `${board.provider}:${j.providerJobId}` : `crawl:${j.providerJobId}`,
        posted_at: j.postedAt || new Date().toISOString(),
        is_active: true,
      };
    });

    // Insert in chunks of 100
    for (let i = 0; i < jobsToInsert.length; i += 100) {
      const chunk = jobsToInsert.slice(i, i + 100);
      const { error: insErr } = await supabase.from("company_jobs").insert(chunk);
      if (insErr) console.error(`   ❌ Insert error for ${company.title}:`, insErr.message);
    }

    // Update active_jobs_count
    await supabase.from("listings").update({
      active_jobs_count: jobs.length,
      updated_at: new Date().toISOString(),
    }).eq("id", company.id);

    console.log(`   ✅ [${company.title}] ${jobsToInsert.length} jobs ingested`);
    return { jobs: jobsToInsert.length, desc: descFetched };
  } catch (err: any) {
    console.error(`   ❌ [${company.title}] Failed:`, err.message);
    return { jobs: 0, desc: descFetched };
  }
}

async function runWithConcurrency<T>(items: T[], concurrency: number, fn: (item: T) => Promise<any>) {
  let index = 0;
  let totalJobs = 0;
  let companiesProcessed = 0;

  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      const result = await fn(item);
      totalJobs += result.jobs || 0;
      if ((result.jobs || 0) > 0) companiesProcessed++;
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return { totalJobs, companiesProcessed };
}

async function fetchAllCompanies() {
  const PAGE_SIZE = 1000;
  let from = 0;
  const all: any[] = [];
  while (true) {
    const { data, error } = await supabase
      .from("listings")
      .select("id, tenant_id, title, city, careers_url, website, active_jobs_count, description, short_description")
      .or("careers_url.not.is.null,website.not.is.null")
      .range(from, from + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    console.log(`   📦 Loaded ${all.length} companies...`);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

async function main() {
  console.log("==========================================================");
  console.log(`  PARALLEL ATS JOB INGESTION (${CONCURRENCY} concurrent workers)`);
  console.log("==========================================================\n");

  const companies = await fetchAllCompanies();

  if (!companies || companies.length === 0) {
    console.log("No companies with careers_url or website found.");
    return;
  }

  console.log(`\n📦 Found ${companies.length} companies to process with ${CONCURRENCY} parallel workers.\n`);

  const start = Date.now();
  const { totalJobs, companiesProcessed } = await runWithConcurrency(companies, CONCURRENCY, processCompany);
  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);

  console.log("\n==========================================================");
  console.log("  ATS JOBS INGESTION COMPLETED");
  console.log("==========================================================");
  console.log(`🏢 Companies with jobs:  ${companiesProcessed}`);
  console.log(`💼 Total jobs inserted:  ${totalJobs}`);
  console.log(`⏱️  Time taken:           ${elapsed} minutes\n`);
}

main().catch(console.error);
