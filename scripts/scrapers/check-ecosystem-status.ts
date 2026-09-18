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
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const { count: totalListings } = await supabase.from("listings").select("id", { count: "exact", head: true });
  const { count: techListings } = await supabase.from("listings").select("id", { count: "exact", head: true }).not("company_type", "is", null);
  const { count: totalJobs } = await supabase.from("company_jobs").select("id", { count: "exact", head: true });
  const { count: activeJobs } = await supabase.from("company_jobs").select("id", { count: "exact", head: true }).eq("is_active", true);
  const { count: hiringCompanies } = await supabase.from("listings").select("id", { count: "exact", head: true }).gt("active_jobs_count", 0);

  // Check company types distribution
  const { data: sampleTech } = await supabase.from("listings").select("company_type, funding_stage").not("company_type", "is", null).limit(1000);
  const typeCounts: Record<string, number> = {};
  const stageCounts: Record<string, number> = {};
  (sampleTech || []).forEach(item => {
    typeCounts[item.company_type] = (typeCounts[item.company_type] || 0) + 1;
    stageCounts[item.funding_stage] = (stageCounts[item.funding_stage] || 0) + 1;
  });

  console.log({
    totalListings,
    techListings,
    totalJobs,
    activeJobs,
    hiringCompanies,
    sampleTypes: typeCounts,
    sampleStages: stageCounts,
  });
}

run().catch(console.error);
