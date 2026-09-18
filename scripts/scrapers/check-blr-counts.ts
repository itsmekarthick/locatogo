import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const domainId = "461e4ee7-7a16-43b3-b342-5a968e44f306"; // Bangalore

  const { count: totalBangalore } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("domain_id", domainId);

  const { count: techWithCareers } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("domain_id", domainId)
    .not("careers_url", "is", null);

  const { data: curatedListings } = await supabase
    .from("listings")
    .select("title, locality, company_type, funding_stage, website, careers_url, is_featured")
    .eq("domain_id", domainId)
    .not("careers_url", "is", null)
    .limit(250);

  const localities: Record<string, number> = {};
  const types: Record<string, number> = {};
  const stages: Record<string, number> = {};
  let featuredCount = 0;

  curatedListings?.forEach((l) => {
    if (l.locality) localities[l.locality] = (localities[l.locality] || 0) + 1;
    if (l.company_type) types[l.company_type] = (types[l.company_type] || 0) + 1;
    if (l.funding_stage) stages[l.funding_stage] = (stages[l.funding_stage] || 0) + 1;
    if (l.is_featured) featuredCount++;
  });

  console.log({
    totalBangaloreListings: totalBangalore,
    curatedBangaloreTechWithCareers: techWithCareers,
    featuredCount,
    companyTypes: types,
    stages,
    topLocalities: Object.entries(localities).sort((a, b) => b[1] - a[1]),
    sample: curatedListings?.slice(0, 5),
  });

  process.exit(0);
}

run();
