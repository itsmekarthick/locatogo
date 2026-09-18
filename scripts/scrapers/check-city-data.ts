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
  const { data: domains, error: domErr } = await supabase.from("domains").select("id, name, slug");
  console.log("DOMAINS IN DB:", domains);

  const { data: cityCounts, error: cntErr } = await supabase
    .from("listings")
    .select("city")
    .not("company_type", "is", null);

  const counts: Record<string, number> = {};
  cityCounts?.forEach((c) => {
    const k = c.city || "Unknown";
    counts[k] = (counts[k] || 0) + 1;
  });
  console.log("TECH COMPANIES PER CITY IN DB:", counts);

  const { count: jobCount } = await supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("is_active", true);
  console.log("TOTAL ACTIVE JOBS:", jobCount);
}

run().catch(console.error);
