import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env
const envFile = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
envFile.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { count: totalListings } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true });

  const { count: bangaloreTech } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .ilike("city", "%Bangalore%")
    .not("company_type", "is", null);

  const { count: totalJobs } = await supabase
    .from("company_jobs")
    .select("id", { count: "exact", head: true });

  const { count: activeJobs } = await supabase
    .from("company_jobs")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: hiringListings } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .gt("active_jobs_count", 0);

  const { data: domains } = await supabase
    .from("domains")
    .select("id, slug, name, tenant_id")
    .limit(10);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name")
    .limit(10);

  console.log(JSON.stringify({
    totalListings,
    bangaloreTech,
    totalJobs,
    activeJobs,
    hiringListings,
    domains,
    categories,
  }, null, 2));
}

main().catch(console.error);
