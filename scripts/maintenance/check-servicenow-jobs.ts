import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

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

async function run() {
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, slug, active_jobs_count, careers_url")
    .ilike("title", "%servicenow%");
  console.log("Listings matching servicenow:", JSON.stringify(listings, null, 2));

  if (listings && listings.length > 0) {
    for (const l of listings) {
      const { data: jobs, count } = await supabase
        .from("company_jobs")
        .select("id, title, listing_id, apply_url", { count: "exact" })
        .eq("listing_id", l.id);
      console.log(`Listing [${l.id}] ${l.title} -> total jobs in company_jobs: ${count}`);
      if (jobs && jobs.length > 0) {
        console.log("Sample job:", jobs[0]);
      }
    }
  }

  const { data: allJobsLikeServiceNow, count: countAll } = await supabase
    .from("company_jobs")
    .select("id, title, listing_id, apply_url", { count: "exact" })
    .ilike("apply_url", "%servicenow%");
  console.log(`Total jobs in company_jobs with servicenow in apply_url: ${countAll}`);
  if (allJobsLikeServiceNow && allJobsLikeServiceNow.length > 0) {
    console.log("Their listing_ids:", [...new Set(allJobsLikeServiceNow.map(j => j.listing_id))]);
  }
}

run().catch(console.error);
