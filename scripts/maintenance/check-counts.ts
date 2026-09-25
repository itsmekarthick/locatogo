import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env: Record<string, string> = {};
const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
fs.readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^['\"]|['\"]$/g, "");
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { count: totalCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true });

  const { count: usCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("country_code", "US");

  const { count: inCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("country_code", "IN");

  console.log("\n=================================================");
  console.log(`🌍 TOTAL COMPANIES IN DATABASE: ${totalCount}`);
  console.log(`🇺🇸 TOTAL UNITED STATES COMPANIES: ${usCount}`);
  console.log(`🇮🇳 TOTAL INDIA COMPANIES: ${inCount}`);
  console.log("=================================================\n");

  const allListings: any[] = [];
  for (let page = 0; page < 25; page++) {
    const { data: pageData } = await supabase
      .from("listings")
      .select("city, country_code, active_jobs_count")
      .not("company_type", "is", null)
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!pageData || pageData.length === 0) break;
    allListings.push(...pageData);
  }

  const countryCounts: Record<string, number> = {};
  const cityCounts: Record<string, { count: number; jobs: number }> = {};

  for (const l of allListings) {
    const cc = l.country_code || "Unknown";
    countryCounts[cc] = (countryCounts[cc] || 0) + 1;

    const key = `${cc} - ${l.city || 'Unknown'}`;
    if (!cityCounts[key]) cityCounts[key] = { count: 0, jobs: 0 };
    cityCounts[key].count++;
    cityCounts[key].jobs += (l.active_jobs_count || 0);
  }

  console.log("--- Summary by Country Code ---");
  for (const [c, cnt] of Object.entries(countryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.padEnd(10)}: ${cnt} companies`);
  }

  console.log("\n--- Top Metros by Company Count ---");
  const sorted = Object.entries(cityCounts).sort((a, b) => b[1].count - a[1].count);
  for (const [city, data] of sorted.slice(0, 35)) {
    console.log(`${city.padEnd(30)} | ${String(data.count).padStart(5)} companies | ${String(data.jobs).padStart(6)} jobs`);
  }
}

main().catch(console.error);
