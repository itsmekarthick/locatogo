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

async function check() {
  const { data: tenants } = await supabase.from("tenants").select("id, name, slug");
  console.log("TENANTS:", tenants);

  const { data: domains } = await supabase.from("domains").select("id, tenant_id, name, slug, default_latitude, default_longitude");
  console.log("DOMAINS:", domains);

  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("sort_order");
  console.log("CATEGORIES COUNT:", categories?.length);

  const { count: listingCount } = await supabase.from("listings").select("id", { count: "exact", head: true });
  console.log("TOTAL LISTINGS:", listingCount);

  const { data: listings } = await supabase.from("listings").select("country_code, city, domain_id");
  const map: Record<string, number> = {};
  listings?.forEach((l) => {
    const key = `${l.country_code || "NONE"} | ${l.city || "NONE"}`;
    map[key] = (map[key] || 0) + 1;
  });
  console.log("LISTINGS BY REGION:", map);

  const { count: jobCount } = await supabase.from("company_jobs").select("id", { count: "exact", head: true });
  console.log("TOTAL JOBS:", jobCount);
}

check();
