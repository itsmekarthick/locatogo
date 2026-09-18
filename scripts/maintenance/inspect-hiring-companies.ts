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

async function main() {
  const { data: hiringCompanies } = await supabase
    .from("listings")
    .select("id, title, city, active_jobs_count, careers_url, website")
    .gt("active_jobs_count", 0)
    .order("active_jobs_count", { ascending: false });

  console.log(`Total companies with active_jobs_count > 0: ${hiringCompanies?.length}`);
  console.log("Top 15 hiring companies:");
  hiringCompanies?.slice(0, 15).forEach(c => {
    console.log(`- ${c.title} (${c.city}): ${c.active_jobs_count} jobs [${c.careers_url || c.website}]`);
  });
}

main().catch(console.error);
