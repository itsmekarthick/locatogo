/**
 * purge-legacy-listings.ts
 *
 * Safely removes legacy uncurated scraping records across all domains,
 * preserving all 219 curated Bangalore tech companies and their jobs.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { BANGALORE_COMPANIES } from "../scrapers/seed-bangalore-comprehensive";

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
  console.log("  DATABASE PURGE: REMOVING LEGACY UNCURATED RECORDS       ");
  console.log("==========================================================\n");

  const bangaloreDomainId = "461e4ee7-7a16-43b3-b342-5a968e44f306";
  const curatedSlugs = new Set(BANGALORE_COMPANIES.map((c) => slugify(c.name)));

  console.log(`Curated Bangalore companies to preserve: ${curatedSlugs.size}`);

  // 1. Fetch all Bangalore listings matching curated slugs
  const { data: preservedListings, error: presErr } = await supabase
    .from("listings")
    .select("id, slug, title")
    .eq("domain_id", bangaloreDomainId);

  if (presErr || !preservedListings) {
    throw new Error(`Failed to read listings: ${presErr?.message}`);
  }

  const preservedIds = new Set<string>();
  for (const l of preservedListings) {
    if (curatedSlugs.has(l.slug)) {
      preservedIds.add(l.id);
    }
  }

  console.log(`Found ${preservedIds.size} matching verified listings to protect in Bangalore.\n`);

  // 2. Fetch all domains
  const { data: domains } = await supabase.from("domains").select("id, name, slug");
  if (!domains) return;

  for (const d of domains) {
    console.log(`Processing domain: ${d.name} (${d.slug})...`);

    let deletedInDomain = 0;

    if (d.id !== bangaloreDomainId) {
      // For all other domains, delete all uncurated records
      while (true) {
        const { data: batch, error: batchErr } = await supabase
          .from("listings")
          .select("id")
          .eq("domain_id", d.id)
          .limit(1000);

        if (batchErr || !batch || batch.length === 0) break;

        const idsToDelete = batch.map((b) => b.id);
        await supabase.from("company_jobs").delete().in("listing_id", idsToDelete);
        const { error: delErr } = await supabase.from("listings").delete().in("id", idsToDelete);

        if (delErr) {
          console.error(`Error deleting batch in ${d.name}:`, delErr.message);
          break;
        }

        deletedInDomain += idsToDelete.length;
        process.stdout.write(`  Deleted ${deletedInDomain} legacy records in ${d.name}...\r`);
      }
    } else {
      // For Bangalore, delete records whose id is NOT in preservedIds
      while (true) {
        // Fetch up to 1000 listings
        const { data: batch, error: batchErr } = await supabase
          .from("listings")
          .select("id")
          .eq("domain_id", bangaloreDomainId)
          .limit(1000);

        if (batchErr || !batch || batch.length === 0) break;

        const idsToDelete = batch.map((b) => b.id).filter((id) => !preservedIds.has(id));

        if (idsToDelete.length === 0) {
          // All records in this batch are preserved, check if there are more
          // To paginate past preserved ones, fetch the ones with older/different updated_at or offset
          const { data: remainingNonPreserved } = await supabase
            .from("listings")
            .select("id")
            .eq("domain_id", bangaloreDomainId)
            .is("company_type", null)
            .limit(1000);

          if (!remainingNonPreserved || remainingNonPreserved.length === 0) {
            // Also check for legacy it_services_consulting that are not in preservedIds
            const { data: legacyConsulting } = await supabase
              .from("listings")
              .select("id")
              .eq("domain_id", bangaloreDomainId)
              .eq("company_type", "it_services_consulting")
              .limit(1000);

            const toDelete = (legacyConsulting || []).map((l) => l.id).filter((id) => !preservedIds.has(id));
            if (toDelete.length === 0) break;

            await supabase.from("company_jobs").delete().in("listing_id", toDelete);
            await supabase.from("listings").delete().in("id", toDelete);
            deletedInDomain += toDelete.length;
            continue;
          }

          const remIds = remainingNonPreserved.map((r) => r.id).filter((id) => !preservedIds.has(id));
          if (remIds.length === 0) break;

          await supabase.from("company_jobs").delete().in("listing_id", remIds);
          await supabase.from("listings").delete().in("id", remIds);
          deletedInDomain += remIds.length;
          process.stdout.write(`  Deleted ${deletedInDomain} legacy records in Bangalore...\r`);
          continue;
        }

        await supabase.from("company_jobs").delete().in("listing_id", idsToDelete);
        const { error: delErr } = await supabase.from("listings").delete().in("id", idsToDelete);

        if (delErr) {
          console.error(`Error deleting batch in Bangalore:`, delErr.message);
          break;
        }

        deletedInDomain += idsToDelete.length;
        process.stdout.write(`  Deleted ${deletedInDomain} legacy records in Bangalore...\r`);
      }
    }

    console.log(`  ✅ Finished ${d.name}: Deleted ${deletedInDomain} legacy records.`);
  }

  // 3. Final verification
  console.log("\n==========================================================");
  console.log("  PURGE VERIFICATION                                      ");
  console.log("==========================================================");

  for (const d of domains) {
    const { count } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", d.id);

    console.log(`Domain: ${d.name.padEnd(20)} (${d.slug}) -> ${count} clean records remaining`);
  }

  const { count: jobCount } = await supabase
    .from("company_jobs")
    .select("*", { count: "exact", head: true });

  console.log(`Total active company_jobs in database: ${jobCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during purge:", err);
  process.exit(1);
});
