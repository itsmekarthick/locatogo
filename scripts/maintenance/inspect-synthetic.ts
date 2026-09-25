import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env: Record<string, string> = {};
const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
fs.readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^['\"]|['\"]$/g, "");
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Check how many company_jobs have genuine ATS providers
  const { count: totalJobs } = await supabase.from("company_jobs").select("*", { count: "exact", head: true });
  const { count: ghJobs } = await supabase.from("company_jobs").select("*", { count: "exact", head: true }).like("ats_job_id", "greenhouse:%");
  const { count: ashbyJobs } = await supabase.from("company_jobs").select("*", { count: "exact", head: true }).like("ats_job_id", "ashby:%");
  const { count: leverJobs } = await supabase.from("company_jobs").select("*", { count: "exact", head: true }).like("ats_job_id", "lever:%");
  const { count: syntheticJobs } = await supabase.from("company_jobs").select("*", { count: "exact", head: true }).like("ats_job_id", "ats:%");

  console.log(`\n📊 JOBS BREAKDOWN:`);
  console.log(`- Total jobs: ${totalJobs}`);
  console.log(`- Real Greenhouse jobs: ${ghJobs}`);
  console.log(`- Real Ashby jobs:      ${ashbyJobs}`);
  console.log(`- Real Lever jobs:      ${leverJobs}`);
  console.log(`- Synthetic ats: jobs:  ${syntheticJobs}`);

  // Check listings description
  const { count: totalListings } = await supabase.from("listings").select("*", { count: "exact", head: true });
  const { count: syntheticListings } = await supabase.from("listings").select("*", { count: "exact", head: true }).like("description", "%funding to expand its engineering presence.%");

  console.log(`\n🏢 LISTINGS BREAKDOWN:`);
  console.log(`- Total listings: ${totalListings}`);
  console.log(`- Synthetic listings: ${syntheticListings}`);
  console.log(`- Real organic listings: ${(totalListings || 0) - (syntheticListings || 0)}`);
}

main().catch(console.error);
