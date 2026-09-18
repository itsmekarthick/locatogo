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
  const { count, error } = await supabase.from("company_jobs").select("*", { count: "exact", head: true });
  console.log("Total company_jobs in DB:", count, "error:", error);

  const { data: sampleJobs } = await supabase.from("company_jobs").select("id, title, listing_id, tenant_id").limit(5);
  console.log("Sample jobs in DB:", sampleJobs);

  const { data: hydListings } = await supabase.from("listings").select("id, title, slug, active_jobs_count, tenant_id").eq("domain_id", "c0441a34-5395-4462-9492-e982ab9035c0").limit(10);
  console.log("Hyd listings:", hydListings?.map(l => ({ id: l.id, title: l.title, count: l.active_jobs_count, tenant: l.tenant_id })));
}

main().catch(console.error);
