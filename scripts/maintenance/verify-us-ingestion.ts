import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env: Record<string, string> = {};
fs.readFileSync(".env", "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[m[1]] = v;
    }
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  const US_SLUGS = ["siliconvalley", "new-york", "seattle", "austin", "boston", "los-angeles"];

  const { data: domains } = await supabase
    .from("domains")
    .select("id, name, slug, default_latitude, default_longitude")
    .in("slug", US_SLUGS);

  console.log("===============================================================");
  console.log("📊 US REGIONS VERIFICATION REPORT");
  console.log("===============================================================\n");

  let totalUsListings = 0;
  let totalUsJobs = 0;

  for (const d of domains || []) {
    const { data: listings } = await supabase
      .from("listings")
      .select("id, title, city, active_jobs_count, latitude, longitude, careers_url")
      .eq("domain_id", d.id);

    const count = listings?.length || 0;
    const jobsCount = listings?.reduce((acc, l) => acc + (l.active_jobs_count || 0), 0) || 0;
    totalUsListings += count;
    totalUsJobs += jobsCount;

    console.log(`🏙️  ${d.name} (${d.slug}):`);
    console.log(`   Center: Lat ${d.default_latitude}, Lon ${d.default_longitude}`);
    console.log(`   Companies: ${count}`);
    console.log(`   Active Jobs: ${jobsCount}`);
    if (listings && listings.length > 0) {
      console.log(`   Sample Companies: ${listings.slice(0, 3).map((l) => `${l.title} (${l.active_jobs_count} jobs)`).join(", ")}`);
    }
    console.log("");
  }

  console.log("---------------------------------------------------------------");
  console.log(`🇺🇸 Grand Total US Companies: ${totalUsListings}`);
  console.log(`💼 Grand Total US Live Jobs:  ${totalUsJobs}`);
  console.log("---------------------------------------------------------------\n");

  // Sample check on actual company_jobs records
  const { data: sampleJobs } = await supabase
    .from("company_jobs")
    .select("title, department, apply_url, location_name, ats_job_id")
    .eq("is_active", true)
    .limit(5);

  console.log("🔍 Sample Direct Apply Job Records:");
  sampleJobs?.forEach((j, idx) => {
    console.log(`  ${idx + 1}. [${j.department}] ${j.title}`);
    console.log(`     Location: ${j.location_name}`);
    console.log(`     Apply URL: ${j.apply_url}`);
    console.log(`     ATS ID:   ${j.ats_job_id}\n`);
  });
}

verify().catch(console.error);
