import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
envFile.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, slug, active_jobs_count, company_profile_id")
    .ilike("title", "%Infosys%");
  console.log("Listings for Infosys:", JSON.stringify(listings, null, 2));

  if (listings && listings.length > 0) {
    const ids = listings.map((l) => l.id);
    const { data: jobs } = await supabase
      .from("company_jobs")
      .select("id, title, listing_id, company_profile_id, apply_url")
      .in("listing_id", ids);
    console.log(`Jobs linked to listing IDs (${ids.join(",")}):`, JSON.stringify(jobs, null, 2));

    const { data: allInfosysJobs } = await supabase
      .from("company_jobs")
      .select("id, title, listing_id, company_profile_id, apply_url")
      .ilike("title", "%Infosys%");
    console.log("Jobs with Infosys in title or linked:", JSON.stringify(allInfosysJobs, null, 2));
  }
}

check().catch(console.error);
