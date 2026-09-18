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
  console.log("==========================================================");
  console.log("  MAPORA TECH ATLAS: MULTI-METRO ECOSYSTEM OVERVIEW      ");
  console.log("==========================================================\n");

  const { data: domains } = await supabase.from("domains").select("id, name, slug").order("name");
  if (!domains) return;

  for (const d of domains) {
    const { count: totalListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", d.id);

    const { count: hiringListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", d.id)
      .gt("active_jobs_count", 0);

    const { data: jobs } = await supabase
      .from("listings")
      .select("active_jobs_count")
      .eq("domain_id", d.id);

    const sumJobs = (jobs || []).reduce((acc, j) => acc + (j.active_jobs_count || 0), 0);

    console.log(
      `🏛️ ${d.name.padEnd(16)} (${d.slug.padEnd(12)}) : ${String(totalListings).padStart(3, " ")} companies | ${String(hiringListings).padStart(2, " ")} hiring | ${sumJobs.toLocaleString()} live jobs`
    );
  }

  const { count: totalStoredJobs } = await supabase
    .from("company_jobs")
    .select("*", { count: "exact", head: true });

  console.log(`\n💼 Total rich job postings stored in company_jobs table: ${totalStoredJobs}`);
}

main().catch(console.error);
