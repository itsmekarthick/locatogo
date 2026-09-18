/**
 * sync-hyderabad-ats-jobs.ts
 *
 * Ingests verified live jobs for Hyderabad tech giants, GCCs, and SaaS leaders.
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

export const HYDERABAD_ATS_MAP: { slug: string; name: string; atsUrl: string }[] = [
  {
    slug: "servicenow-india-hyderabad",
    name: "ServiceNow India (Hyderabad)",
    atsUrl: "https://careers.smartrecruiters.com/servicenow",
  },
  {
    slug: "highradius-hyderabad-hq",
    name: "HighRadius (Hyderabad HQ)",
    atsUrl: "https://boards.greenhouse.io/highradius",
  },
  {
    slug: "zenoti-hyderabad-r-d",
    name: "Zenoti (Hyderabad R&D)",
    atsUrl: "https://boards.greenhouse.io/zenoti",
  },
  {
    slug: "servicetitan-hyderabad",
    name: "ServiceTitan (Hyderabad)",
    atsUrl: "https://careers.smartrecruiters.com/servicetitan",
  },
  {
    slug: "uber-hyderabad-tech-center",
    name: "Uber Hyderabad Tech Center",
    atsUrl: "https://careers.smartrecruiters.com/uber",
  },
  {
    slug: "western-digital-india-hyderabad",
    name: "Western Digital India (Hyderabad)",
    atsUrl: "https://careers.smartrecruiters.com/WesternDigital",
  },
];

async function main() {
  console.log("==========================================================");
  console.log("  HYDERABAD DEEP JOB INGESTION FOR VERIFIED ATS BOARDS    ");
  console.log("==========================================================\n");

  const domainId = "c0441a34-5395-4462-9492-e982ab9035c0"; // Hyderabad
  let totalNewJobs = 0;
  let companiesUpdated = 0;

  for (const item of HYDERABAD_ATS_MAP) {
    const { data: listings } = await supabase
      .from("listings")
      .select("id, tenant_id, title, slug, careers_url")
      .eq("domain_id", domainId)
      .eq("slug", item.slug)
      .limit(1);

    if (!listings || listings.length === 0) {
      console.log(`⚠️ Listing not found for slug: ${item.slug} (${item.name})`);
      continue;
    }

    const listing = listings[0];
    const board = detectBoard(item.atsUrl);
    if (!board) {
      console.log(`⚠️ Could not parse board for: ${item.name} (${item.atsUrl})`);
      continue;
    }

    // Update careers_url if changed
    if (listing.careers_url !== item.atsUrl) {
      await supabase
        .from("listings")
        .update({ careers_url: item.atsUrl, updated_at: new Date().toISOString() })
        .eq("id", listing.id);
    }

    try {
      const jobs = await fetchJobs(board);
      if (!jobs || jobs.length === 0) {
        console.log(`ℹ️ [${board.provider}] ${item.name}: 0 jobs returned`);
        continue;
      }

      // Upsert top 25 jobs
      for (const job of jobs.slice(0, 25)) {
        const atsJobId = `${board.provider}:${job.providerJobId}`;
        await supabase.from("company_jobs").upsert({
          tenant_id: listing.tenant_id,
          listing_id: listing.id,
          title: job.title,
          department: job.department,
          location_name: job.locationName,
          workplace_type: job.workplaceType,
          apply_url: job.applyUrl,
          ats_job_id: atsJobId,
          posted_at: job.postedAt || new Date().toISOString(),
          is_active: true,
        }, { onConflict: "listing_id,ats_job_id" });
      }

      // Update listing active_jobs_count
      await supabase
        .from("listings")
        .update({
          active_jobs_count: jobs.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      companiesUpdated++;
      totalNewJobs += jobs.length;
      console.log(`✅ [${board.provider.toUpperCase()}] ${item.name.padEnd(35)} -> ${jobs.length} jobs indexed`);
    } catch (err: any) {
      console.error(`❌ Error fetching jobs for ${item.name}:`, err.message);
    }
  }

  console.log("\n==========================================================");
  console.log("  HYDERABAD SYNC COMPLETED                                ");
  console.log("==========================================================");
  console.log(`🏢 Companies updated:     ${companiesUpdated}`);
  console.log(`💼 Total active jobs:     ${totalNewJobs}`);

  process.exit(0);
}

main().catch(console.error);
