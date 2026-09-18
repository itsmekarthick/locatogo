/**
 * sync-discovered-jobs.ts
 *
 * Updates company career URLs and ingests verified live jobs for all discovered
 * Bangalore tech companies, Unicorns, and GCCs.
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

export const VERIFIED_BANGALORE_ATS: { slug: string; name: string; atsUrl: string }[] = [
  { slug: "razorpay", name: "Razorpay", atsUrl: "https://job-boards.greenhouse.io/razorpaysoftwareprivatelimited" },
  { slug: "cred", name: "CRED", atsUrl: "https://jobs.lever.co/cred" },
  { slug: "swiggy", name: "Swiggy", atsUrl: "https://careers.smartrecruiters.com/swiggy" },
  { slug: "inmobi", name: "InMobi", atsUrl: "https://boards.greenhouse.io/inmobi" },
  { slug: "sarvam-ai", name: "Sarvam AI", atsUrl: "https://jobs.ashbyhq.com/sarvam" },
  { slug: "slice", name: "Slice", atsUrl: "https://boards.greenhouse.io/slice" },
  { slug: "zeta", name: "Zeta", atsUrl: "https://jobs.lever.co/zeta" },
  { slug: "fi-money-epifi", name: "Fi Money (epifi)", atsUrl: "https://jobs.lever.co/epifi" },
  { slug: "atlan", name: "Atlan", atsUrl: "https://jobs.ashbyhq.com/atlan" },
  { slug: "observe-ai", name: "Observe.AI", atsUrl: "https://boards.greenhouse.io/observeai" },
  { slug: "entropik-tech", name: "Entropik Tech", atsUrl: "https://careers.smartrecruiters.com/entropik" },
  { slug: "freshworks", name: "Freshworks", atsUrl: "https://careers.smartrecruiters.com/freshworks" },
  { slug: "highradius", name: "HighRadius", atsUrl: "https://boards.greenhouse.io/highradius" },
  { slug: "zenoti", name: "Zenoti", atsUrl: "https://boards.greenhouse.io/zenoti" },
  { slug: "druva", name: "Druva", atsUrl: "https://boards.greenhouse.io/druva" },
  { slug: "gainsight", name: "Gainsight", atsUrl: "https://jobs.ashbyhq.com/gainsight" },
  { slug: "bounce", name: "Bounce", atsUrl: "https://jobs.ashbyhq.com/bounce" },
  { slug: "river-mobility", name: "River Mobility", atsUrl: "https://jobs.ashbyhq.com/river" },
  { slug: "cynlr-cybernetics-laboratory", name: "Cynlr", atsUrl: "https://jobs.ashbyhq.com/cynlr" },
  { slug: "kula", name: "Kula", atsUrl: "https://careers.smartrecruiters.com/kula" },
  { slug: "kredx", name: "KredX", atsUrl: "https://careers.smartrecruiters.com/kredx" },
  { slug: "thoughtworks", name: "Thoughtworks", atsUrl: "https://boards.greenhouse.io/thoughtworks" },
  { slug: "servicenow-india", name: "ServiceNow India", atsUrl: "https://careers.smartrecruiters.com/servicenow" },
  { slug: "snowflake-india", name: "Snowflake India", atsUrl: "https://jobs.ashbyhq.com/snowflake" },
  { slug: "confluent-india", name: "Confluent India", atsUrl: "https://jobs.ashbyhq.com/confluent" },
  { slug: "elastic-india", name: "Elastic India", atsUrl: "https://boards.greenhouse.io/elastic" },
  { slug: "gitlab", name: "GitLab", atsUrl: "https://boards.greenhouse.io/gitlab" },
  { slug: "docker", name: "Docker", atsUrl: "https://jobs.ashbyhq.com/docker" },
  { slug: "western-digital-india", name: "Western Digital India", atsUrl: "https://careers.smartrecruiters.com/WesternDigital" },
  { slug: "sony-india-software-centre", name: "Sony India Software Centre", atsUrl: "https://boards.greenhouse.io/asubsidiaryofsca" },
  { slug: "hevo-data", name: "Hevo Data", atsUrl: "https://jobs.lever.co/hevodata" },
  { slug: "groww", name: "Groww", atsUrl: "https://boards.greenhouse.io/groww" },
  { slug: "meesho", name: "Meesho", atsUrl: "https://jobs.lever.co/meesho" },
  { slug: "porter", name: "Porter", atsUrl: "https://boards.greenhouse.io/porter" },
  { slug: "signoz", name: "SigNoz", atsUrl: "https://jobs.ashbyhq.com/signoz" },
  { slug: "mindtickle", name: "Mindtickle", atsUrl: "https://jobs.lever.co/mindtickle" },
  { slug: "pocket-fm", name: "Pocket FM", atsUrl: "https://jobs.lever.co/pocketfm" },
  { slug: "twilio-india", name: "Twilio India", atsUrl: "https://boards.greenhouse.io/twilio" },
  { slug: "mongodb-india", name: "MongoDB India", atsUrl: "https://boards.greenhouse.io/mongodb" },
  { slug: "bosch-global-software-technologies-bgsw", name: "Bosch Global Software Technologies (BGSW)", atsUrl: "https://careers.smartrecruiters.com/BoschGroup" },
];

async function main() {
  console.log("==========================================================");
  console.log("  BANGALORE DEEP JOB INGESTION FOR VERIFIED ATS BOARDS    ");
  console.log("==========================================================\n");

  const domainId = "461e4ee7-7a16-43b3-b342-5a968e44f306";
  let totalNewJobs = 0;
  let companiesUpdated = 0;

  for (const item of VERIFIED_BANGALORE_ATS) {
    // 1. Find listing by slug in Bangalore
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

      // Upsert jobs
      for (const job of jobs.slice(0, 30)) {
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
  console.log("  SYNC COMPLETED                                          ");
  console.log("==========================================================");
  console.log(`🏢 Companies updated:     ${companiesUpdated}`);
  console.log(`💼 Total active jobs:     ${totalNewJobs}`);

  process.exit(0);
}

main().catch(console.error);
