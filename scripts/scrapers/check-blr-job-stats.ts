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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const domainId = "461e4ee7-7a16-43b3-b342-5a968e44f306"; // Bangalore

  const { data: companies } = await supabase
    .from("listings")
    .select("id, title, website, careers_url, active_jobs_count, company_type")
    .eq("domain_id", domainId)
    .gt("active_jobs_count", 0)
    .order("active_jobs_count", { ascending: false });

  const { count: totalJobs } = await supabase
    .from("company_jobs")
    .select("*", { count: "exact", head: true });

  console.log("==========================================================");
  console.log("  BANGALORE TECH ATLAS: LIVE JOB HARVESTING METRICS      ");
  console.log("==========================================================\n");
  console.log(`🏢 Total Bangalore companies with live jobs: ${companies?.length || 0}`);
  console.log(`💼 Total active jobs stored in company_jobs:   ${totalJobs || 0}\n`);

  console.log("Top Hiring Companies in Bangalore:");
  companies?.slice(0, 30).forEach((c, idx) => {
    console.log(
      `  ${String(idx + 1).padStart(2, " ")}. ${c.title.padEnd(42)} [${(c.company_type || "tech").padEnd(16)}] : ${c.active_jobs_count} jobs`
    );
  });
}

main().catch(console.error);
