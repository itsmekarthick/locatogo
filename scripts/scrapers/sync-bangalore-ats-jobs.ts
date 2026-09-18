/**
 * sync-bangalore-ats-jobs.ts
 *
 * Runs the ATS job synchronizer on all newly added Bangalore tech companies.
 * Connects directly to Greenhouse, Lever, Ashby, SmartRecruiters and official feeds
 * to ingest active job listings into the `company_jobs` table and update `active_jobs_count`.
 *
 * Run: npx tsx scripts/scrapers/sync-bangalore-ats-jobs.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs } from "../../src/lib/jobs/providers";

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("=================================================");
  console.log("  SYNCHRONIZING BANGALORE ATS CAREER PORTALS     ");
  console.log("=================================================\n");

  const domainId = "461e4ee7-7a16-43b3-b342-5a968e44f306"; // Bangalore

  // Fetch Bangalore companies with careers_url
  const { data: companies, error } = await supabase
    .from("listings")
    .select("id, tenant_id, title, careers_url, website")
    .eq("domain_id", domainId)
    .not("careers_url", "is", null);

  if (error || !companies) {
    throw new Error(`Failed to fetch companies: ${error?.message}`);
  }

  console.log(`Found ${companies.length} Bangalore companies with career links.`);

  let totalJobsFound = 0;
  let companiesWithActiveJobs = 0;
  let atsCount = 0;

  for (const co of companies) {
    const board = detectBoard(co.careers_url);
    if (!board) continue;
    atsCount++;

    try {
      const jobs = await fetchJobs(board);
      if (jobs.length > 0) {
        console.log(`💼 [${board.provider}] ${co.title}: found ${jobs.length} jobs`);
        totalJobsFound += jobs.length;
        companiesWithActiveJobs++;

        for (const job of jobs.slice(0, 25)) {
          const atsJobId = `${board.provider}:${job.providerJobId}`;
          const jobRecord = {
            tenant_id: co.tenant_id,
            listing_id: co.id,
            title: job.title,
            department: job.department,
            location_name: job.locationName,
            workplace_type: job.workplaceType,
            apply_url: job.applyUrl,
            ats_job_id: atsJobId,
            posted_at: job.postedAt || new Date().toISOString(),
            is_active: true,
          };

          const { data: existing } = await supabase
            .from("company_jobs")
            .select("id")
            .eq("listing_id", co.id)
            .eq("ats_job_id", atsJobId)
            .maybeSingle();

          if (existing) {
            await supabase.from("company_jobs").update(jobRecord).eq("id", existing.id);
          } else {
            await supabase.from("company_jobs").insert(jobRecord);
          }
        }

        // Update active jobs count in listings
        await supabase
          .from("listings")
          .update({
            active_jobs_count: jobs.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", co.id);
      }
    } catch (err: any) {
      console.warn(`  ⚠️ Could not fetch jobs for ${co.title} (${board.provider}):`, err?.message || err);
    }
  }

  console.log(`\n🎉 ATS Sync Completed:`);
  console.log(`   ATS Platforms detected: ${atsCount}`);
  console.log(`   Companies hiring now:   ${companiesWithActiveJobs}`);
  console.log(`   Total open jobs added:  ${totalJobsFound}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
