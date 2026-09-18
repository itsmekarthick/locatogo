import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs } from "../../src/lib/jobs/providers";

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

const METRO_ATS_MAPPINGS = [
  { namePattern: "%InMobi%", city: "Delhi NCR", careers_url: "https://boards.greenhouse.io/inmobi" },
  { namePattern: "%Freshworks%", city: "Chennai", careers_url: "https://careers.smartrecruiters.com/freshworks" },
  { namePattern: "%Druva%", city: "Pune", careers_url: "https://boards.greenhouse.io/druva" },
  { namePattern: "%PubMatic%", city: "Pune", careers_url: "https://boards.greenhouse.io/pubmatic" },
  { namePattern: "%Thoughtworks%", city: "Pune", careers_url: "https://boards.greenhouse.io/thoughtworks" },
];

async function main() {
  console.log("⚡ Starting Live ATS Ingestion for Metro Companies...\n");

  for (const m of METRO_ATS_MAPPINGS) {
    const { data: listing } = await supabase
      .from("listings")
      .select("id, tenant_id, title, city, careers_url")
      .ilike("title", m.namePattern)
      .eq("city", m.city)
      .maybeSingle();

    if (!listing) {
      console.warn(`Listing not found for slug: ${m.slug}`);
      continue;
    }

    // Update careers_url on listing
    await supabase.from("listings").update({ careers_url: m.careers_url }).eq("id", listing.id);

    const board = detectBoard(m.careers_url);
    if (!board) continue;

    try {
      console.log(`⏳ Fetching live jobs for [${board.provider.toUpperCase()}] ${listing.title} (${listing.city})...`);
      const jobs = await fetchJobs(board);
      if (!jobs || jobs.length === 0) {
        console.log(`   ℹ️ 0 jobs for ${listing.title}`);
        continue;
      }

      console.log(`   ⚡ Found ${jobs.length} jobs. Ingesting...`);

      // Delete old jobs for listing
      await supabase.from("company_jobs").delete().eq("listing_id", listing.id);

      const toInsert = jobs.slice(0, 150).map((j) => {
        let cleanApply = j.applyUrl;
        if (board.provider === "smartrecruiters" && j.providerJobId) {
          cleanApply = `https://careers.smartrecruiters.com/${board.token}/${j.providerJobId}`;
        }
        return {
          tenant_id: listing.tenant_id,
          listing_id: listing.id,
          title: j.title,
          department: j.department || "Engineering",
          location_name: j.locationName || `${listing.city}, India`,
          workplace_type: j.workplaceType || "hybrid",
          experience_level: "mid",
          apply_url: cleanApply,
          ats_job_id: `${board.provider}:${j.providerJobId}`,
          posted_at: j.postedAt || new Date().toISOString(),
          is_active: true,
        };
      });

      for (let i = 0; i < toInsert.length; i += 100) {
        const chunk = toInsert.slice(i, i + 100);
        const { error: insErr } = await supabase.from("company_jobs").insert(chunk);
        if (insErr) {
          console.error(`   ❌ Insert error for ${listing.title}:`, insErr.message);
        }
      }

      await supabase
        .from("listings")
        .update({
          active_jobs_count: jobs.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      console.log(`   ✅ Ingested ${toInsert.length} active jobs for ${listing.title}!`);
    } catch (err: any) {
      console.error(`   ❌ Error for ${listing.title}:`, err.message);
    }
  }

  const { count: totalJobs } = await supabase
    .from("company_jobs")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  console.log(`\n💼 Total Active Live Jobs across all companies in DB: ${totalJobs}`);
}

main().catch(console.error);
