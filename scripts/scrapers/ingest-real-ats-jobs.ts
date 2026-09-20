import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs, fetchCareerPageJobs } from "../../src/lib/jobs/providers";

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

async function main() {
  console.log("==========================================================");
  console.log("  INGESTING REAL LIVE ATS JOBS INTO company_jobs TABLE    ");
  console.log("==========================================================\n");

  const { data: companies } = await supabase
    .from("listings")
    .select("id, tenant_id, title, city, careers_url, website, active_jobs_count, description, short_description")
    .or("careers_url.not.is.null,website.not.is.null");

  if (!companies || companies.length === 0) {
    console.log("No companies with careers_url or website found.");
    return;
  }

  let totalJobsIngested = 0;
  let companiesProcessed = 0;

  for (const company of companies) {
    if (!company.careers_url && !company.website) continue;
    let jobs = [];
    let board = company.careers_url ? detectBoard(company.careers_url) : null;
    let providerName = board ? board.provider.toUpperCase() : "CRAWL";

    console.log(`\n⏳ Fetching jobs for [${providerName}] ${company.title} (${company.city})...`);

    if (!company.description && company.website) {
      try {
        const res = await fetch(company.website, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) {
          const html = await res.text();
          const match = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i) 
                     || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i);
          if (match && match[1]) {
            const desc = match[1].trim();
            console.log(`   📝 Found description: ${desc.substring(0, 80)}...`);
            await supabase.from("listings").update({
              description: desc,
              short_description: company.short_description || desc.substring(0, 150)
            }).eq("id", company.id);
          }
        }
      } catch (e) {
        // ignore fetch errors
      }
    }

    try {
      if (board) {
        jobs = await fetchJobs(board);
      } else {
        const urlToCrawl = company.careers_url || company.website;
        jobs = await fetchCareerPageJobs(urlToCrawl);
      }

      if (!jobs || jobs.length === 0) {
        console.log(`   ℹ️ 0 jobs returned for ${company.title}`);
        continue;
      }

      console.log(`   ⚡ Found ${jobs.length} jobs. Ingesting into company_jobs...`);

      // 1. Delete previous jobs for this listing to prevent duplicates
      await supabase.from("company_jobs").delete().eq("listing_id", company.id);

      // 2. Prepare job records (cap at 150 per company for performance, or up to 650 for ServiceNow)
      const maxJobs = company.title.toLowerCase().includes("servicenow") ? 650 : 150;
      const jobsToInsert = jobs.slice(0, maxJobs).map((j) => {
        let cleanApplyUrl = j.applyUrl;
        if (board && board.provider === "smartrecruiters" && j.providerJobId) {
          cleanApplyUrl = `https://careers.smartrecruiters.com/${board.token}/${j.providerJobId}`;
        }

        return {
          tenant_id: company.tenant_id,
          listing_id: company.id,
          title: j.title,
          department: j.department || "Engineering",
          location_name: j.locationName || `${company.city}, India`,
          workplace_type: j.workplaceType || "hybrid",
          experience_level: "mid",
          apply_url: cleanApplyUrl,
          ats_job_id: board ? `${board.provider}:${j.providerJobId}` : `crawl:${j.providerJobId}`,
          posted_at: j.postedAt || new Date().toISOString(),
          is_active: true,
        };
      });

      // 3. Batch insert in chunks of 100
      for (let i = 0; i < jobsToInsert.length; i += 100) {
        const chunk = jobsToInsert.slice(i, i + 100);
        const { error: insErr } = await supabase.from("company_jobs").insert(chunk);
        if (insErr) {
          console.error(`   ❌ Insert error for ${company.title}:`, insErr.message);
        }
      }

      // 4. Update listing active_jobs_count
      await supabase
        .from("listings")
        .update({
          active_jobs_count: jobs.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", company.id);

      totalJobsIngested += jobsToInsert.length;
      companiesProcessed++;
      console.log(`   ✅ Ingested ${jobsToInsert.length} active jobs for ${company.title}`);
    } catch (err: any) {
      console.error(`   ❌ Failed to sync ${company.title}:`, err.message);
    }
  }

  console.log("\n==========================================================");
  console.log("  ATS JOBS INGESTION COMPLETED                            ");
  console.log("==========================================================");
  console.log(`🏢 Companies processed:     ${companiesProcessed}`);
  console.log(`💼 Total jobs inserted:    ${totalJobsIngested}\n`);
}

main().catch(console.error);
