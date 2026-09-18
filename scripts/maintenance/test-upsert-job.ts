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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, tenant_id")
    .ilike("title", "%servicenow%")
    .limit(1);

  if (!listings || listings.length === 0) {
    console.log("No listing found");
    return;
  }
  const l = listings[0];
  console.log("Found listing:", l);

  const testJob = {
    tenant_id: l.tenant_id,
    listing_id: l.id,
    title: "Software Engineer (Test)",
    department: "Engineering",
    location_name: "Hyderabad, Telangana, India",
    workplace_type: "hybrid",
    apply_url: "https://careers.smartrecruiters.com/servicenow/test",
    ats_job_id: "smartrecruiters:test12345",
    posted_at: new Date().toISOString(),
    is_active: true,
  };

  const { data, error } = await supabase.from("company_jobs").upsert(testJob, { onConflict: "listing_id,ats_job_id" }).select();
  console.log("Upsert result:", { data, error });
}

main().catch(console.error);
