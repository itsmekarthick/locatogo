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
  const domainId = "461e4ee7-7a16-43b3-b342-5a968e44f306";
  const { data: companies } = await supabase
    .from("listings")
    .select("id, title, website, careers_url, active_jobs_count, company_type")
    .eq("domain_id", domainId)
    .not("company_type", "is", null)
    .order("title");

  if (!companies) return;

  const withJobs = companies.filter((c) => (c.active_jobs_count || 0) > 0);
  const zeroJobs = companies.filter((c) => !c.active_jobs_count || c.active_jobs_count === 0);

  console.log(`Total Bangalore companies: ${companies.length}`);
  console.log(`Companies with active jobs: ${withJobs.length}`);
  console.log(`Companies with 0 jobs: ${zeroJobs.length}\n`);

  console.log("Sample companies with 0 jobs:");
  for (const c of zeroJobs.slice(0, 30)) {
    console.log(`- ${c.title} (${c.website}) -> ${c.careers_url}`);
  }
}

main().catch(console.error);
