/**
 * reset-all-cities.ts
 * One-time nuclear reset of all tech company listings, jobs, and profiles.
 * NON-tech listings (restaurants, hospitals, schools, etc.) are preserved.
 *
 * Run: npx tsx scripts/scrapers/reset-all-cities.ts
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

async function main() {
  console.log("🗑️  Starting full tech data reset across all metro cities...\n");

  // Step 1: Count before
  const { count: techBefore } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .not("company_type", "is", null);
  const { count: jobsBefore } = await supabase
    .from("company_jobs")
    .select("id", { count: "exact", head: true });
  console.log(`📊 Before: ${techBefore} tech listings, ${jobsBefore} jobs`);

  // Step 2: Get all tech listing IDs
  console.log("📋 Fetching all tech listing IDs...");
  const allIds: string[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from("listings")
      .select("id")
      .not("company_type", "is", null)
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allIds.push(...data.map((r) => r.id));
    if (data.length < PAGE) break;
  }
  console.log(`   Found ${allIds.length} tech listings.\n`);

  // Step 3: Delete company_jobs in chunks
  console.log("🔥 Deleting company_jobs...");
  if (allIds.length > 0) {
    for (let i = 0; i < allIds.length; i += 500) {
      const chunk = allIds.slice(i, i + 500);
      const { error } = await supabase.from("company_jobs").delete().in("listing_id", chunk);
      if (error) throw error;
      process.stdout.write(`   ${Math.min(i + 500, allIds.length)}/${allIds.length}\r`);
    }
  }
  console.log("\n   ✅ company_jobs cleared.");

  // Step 4: Delete company_profiles in chunks
  console.log("🔥 Deleting company_profiles...");
  if (allIds.length > 0) {
    for (let i = 0; i < allIds.length; i += 500) {
      const chunk = allIds.slice(i, i + 500);
      await supabase.from("company_profiles").delete().in("listing_id", chunk);
    }
  }
  console.log("   ✅ company_profiles cleared.");

  // Step 5: Delete tech listings in chunks to avoid timeouts
  console.log("🔥 Deleting tech listings...");
  if (allIds.length > 0) {
    for (let i = 0; i < allIds.length; i += 500) {
      const chunk = allIds.slice(i, i + 500);
      const { error: delErr } = await supabase.from("listings").delete().in("id", chunk);
      if (delErr) throw delErr;
      process.stdout.write(`   ${Math.min(i + 500, allIds.length)}/${allIds.length}\r`);
    }
  }
  console.log(`\n   ✅ Deleted ${allIds.length} tech listings.\n`);

  // Step 6: Verify
  const { count: remainingTech } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .not("company_type", "is", null);
  const { count: remainingJobs } = await supabase
    .from("company_jobs")
    .select("id", { count: "exact", head: true });
  const { count: nonTech } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .is("company_type", null);

  console.log("📊 Post-reset verification:");
  console.log(`   Tech listings remaining: ${remainingTech} (should be 0)`);
  console.log(`   Jobs remaining:          ${remainingJobs} (should be 0)`);
  console.log(`   Non-tech preserved:      ${nonTech} ✅`);
  console.log("\n✅ Reset complete. Ready for fresh seed.");
}

main().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
