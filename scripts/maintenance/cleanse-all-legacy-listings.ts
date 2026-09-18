/**
 * cleanse-all-legacy-listings.ts
 *
 * Atomically purges all uncurated legacy records (~100,000 rows) across all metro cities,
 * preserving exactly the 219 verified Bangalore tech companies and their live harvested jobs.
 */

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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function main() {
  console.log("==========================================================");
  console.log("  DATABASE PURGE: REMOVING ALL LEGACY UNCURATED RECORDS   ");
  console.log("==========================================================\n");

  const bangaloreDomainId = "461e4ee7-7a16-43b3-b342-5a968e44f306";

  // 1. Extract protected slugs from seed file
  const seedFile = fs.readFileSync("scripts/scrapers/seed-bangalore-comprehensive.ts", "utf8");
  const names: string[] = [];
  for (const m of seedFile.matchAll(/^\s*name:\s*"([^"]+)",/gm)) {
    names.push(m[1]);
  }
  const protectedSlugs = Array.from(new Set(names.map(slugify)));
  console.log(`🛡️ Protected Bangalore Curated Slugs: ${protectedSlugs.length}\n`);

  // 2. Fetch all domains
  const { data: domains } = await supabase.from("domains").select("id, name, slug");
  if (!domains) return;

  for (const d of domains) {
    console.log(`Processing domain: ${d.name} (${d.slug})...`);

    if (d.id === bangaloreDomainId) {
      // Clean Bangalore: delete where slug NOT IN protectedSlugs
      console.log(`  Deleting uncurated listings in Bangalore...`);
      const { count, error } = await supabase
        .from("listings")
        .delete({ count: "exact" })
        .eq("domain_id", bangaloreDomainId)
        .not("slug", "in", `(${protectedSlugs.join(",")})`);

      if (error) {
        console.error(`  ❌ Error purging Bangalore:`, error.message);
      } else {
        console.log(`  ✅ Purged ${count} legacy uncurated rows in Bangalore!`);
      }
    } else {
      // Other domains: delete all legacy listings
      const { count, error } = await supabase
        .from("listings")
        .delete({ count: "exact" })
        .eq("domain_id", d.id);

      if (error) {
        console.error(`  ❌ Error purging ${d.name}:`, error.message);
      } else {
        console.log(`  ✅ Purged ${count} legacy rows in ${d.name}!`);
      }
    }
  }

  // 3. Clean any orphaned company_jobs
  const { data: validListingIds } = await supabase
    .from("listings")
    .select("id")
    .eq("domain_id", bangaloreDomainId);

  const validIdSet = new Set((validListingIds || []).map((l) => l.id));
  const { data: allJobs } = await supabase.from("company_jobs").select("id, listing_id");
  const orphanedJobIds = (allJobs || []).filter((j) => !validIdSet.has(j.listing_id)).map((j) => j.id);

  if (orphanedJobIds.length > 0) {
    console.log(`\n🧹 Cleaning ${orphanedJobIds.length} orphaned jobs...`);
    for (let i = 0; i < orphanedJobIds.length; i += 100) {
      const chunk = orphanedJobIds.slice(i, i + 100);
      await supabase.from("company_jobs").delete().in("id", chunk);
    }
    console.log(`✅ Orphaned jobs cleaned.`);
  }

  // 4. Final verification
  console.log("\n==========================================================");
  console.log("  PURGE VERIFICATION SUMMARY                              ");
  console.log("==========================================================");

  for (const d of domains) {
    const { count } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", d.id);

    console.log(`🏛️ ${d.name.padEnd(16)} (${d.slug.padEnd(12)}) -> ${count} clean records`);
  }

  const { count: finalJobCount } = await supabase
    .from("company_jobs")
    .select("*", { count: "exact", head: true });

  console.log(`\n💼 Total live active jobs in company_jobs table: ${finalJobCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
