/**
 * resolve-all-bangalore-careers.ts
 *
 * Automatically inspects the website and careers URL of all Bangalore companies,
 * resolves direct ATS boards (Greenhouse, Lever, Ashby, SmartRecruiters, Workable, etc.),
 * updates their `careers_url` in the database, and harvests live jobs.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs, parseJobPostingJsonLd } from "../../src/lib/jobs/providers";

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

// Known manual overrides for companies where ATS token differs from slug
const KNOWN_DIRECT_ATS_OVERRIDES: Record<string, string> = {
  "Razorpay": "https://job-boards.greenhouse.io/razorpaysoftwareprivatelimited",
  "CRED": "https://jobs.lever.co/cred",
  "Sarvam AI": "https://jobs.ashbyhq.com/sarvam",
  "Postman": "https://jobs.ashbyhq.com/postman",
  "Groww": "https://boards.greenhouse.io/groww",
  "Meesho": "https://jobs.lever.co/meesho",
  "Porter": "https://boards.greenhouse.io/porter",
  "SigNoz": "https://jobs.ashbyhq.com/signoz",
  "Mindtickle": "https://jobs.lever.co/mindtickle",
  "Pocket FM": "https://jobs.lever.co/pocketfm",
  "Twilio India": "https://boards.greenhouse.io/twilio",
  "MongoDB India": "https://boards.greenhouse.io/mongodb",
  "Bosch Global Software Technologies (BGSW)": "https://careers.smartrecruiters.com/BoschGroup",
  "Sprinklr": "https://careers.smartrecruiters.com/Sprinklr",
  "Gainsight": "https://boards.greenhouse.io/gainsight",
  "Atlassian India": "https://www.atlassian.com/company/careers",
  "Google India": "https://careers.google.com/locations/bangalore",
  "Microsoft India": "https://careers.microsoft.com",
};

function findAtsLinkInHtml(html: string): string | null {
  // Greenhouse
  const gh = html.match(/https?:\/\/(?:job-boards|boards)\.greenhouse\.io\/[a-zA-Z0-9_\-]+/i);
  if (gh) return gh[0];

  // Lever
  const lev = html.match(/https?:\/\/jobs\.lever\.co\/[a-zA-Z0-9_\-]+/i);
  if (lev) return lev[0];

  // Ashby
  const ash = html.match(/https?:\/\/jobs\.ashbyhq\.com\/[a-zA-Z0-9_\-]+/i);
  if (ash) return ash[0];

  // SmartRecruiters
  const sr = html.match(/https?:\/\/(?:careers|jobs)\.smartrecruiters\.com\/[a-zA-Z0-9_\-]+/i);
  if (sr) return sr[0];

  return null;
}

async function main() {
  console.log("==========================================================");
  console.log("  BANGALORE CAREER PORTAL DEEP RESOLVER & HARVESTER       ");
  console.log("==========================================================\n");

  const domainId = "461e4ee7-7a16-43b3-b342-5a968e44f306"; // Bangalore

  // 1. Fetch curated Bangalore listings
  const { data: companies, error } = await supabase
    .from("listings")
    .select("id, tenant_id, title, website, careers_url, active_jobs_count")
    .eq("domain_id", domainId)
    .not("careers_url", "is", null)
    .not("company_type", "is", null)
    .order("updated_at", { ascending: false });

  if (error || !companies) {
    throw new Error(`Failed to load companies: ${error?.message}`);
  }

  console.log(`Loaded ${companies.length} Bangalore companies to inspect.\n`);

  let resolvedAts = 0;
  let updatedListings = 0;
  let totalJobsHarvested = 0;

  for (let i = 0; i < companies.length; i++) {
    const co = companies[i];
    let atsUrl: string | null = null;

    // Check manual override first
    if (KNOWN_DIRECT_ATS_OVERRIDES[co.title]) {
      atsUrl = KNOWN_DIRECT_ATS_OVERRIDES[co.title];
    } else if (co.careers_url && detectBoard(co.careers_url)) {
      atsUrl = co.careers_url;
    }

    // If not direct ATS yet, try crawling career page or website
    if (!atsUrl) {
      const candidatesToCrawl = [
        co.careers_url,
        co.website ? `${co.website.replace(/\/+$/, "")}/careers` : null,
        co.website ? `${co.website.replace(/\/+$/, "")}/jobs` : null,
      ].filter(Boolean) as string[];

      for (const targetUrl of candidatesToCrawl) {
        try {
          const res = await fetch(targetUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml",
            },
            signal: AbortSignal.timeout(6_000),
          });

          if (!res.ok) continue;
          const html = await res.text();

          const foundAts = findAtsLinkInHtml(html);
          if (foundAts) {
            atsUrl = foundAts;
            console.log(`🔍 [${co.title}] Auto-discovered ATS from ${targetUrl} -> ${atsUrl}`);
            break;
          }

          // Also check for JSON-LD JobPosting schema
          const jsonLdJobs = parseJobPostingJsonLd(html, targetUrl);
          if (jsonLdJobs.length > 0) {
            console.log(`📄 [${co.title}] Extracted ${jsonLdJobs.length} jobs from JSON-LD schema on ${targetUrl}`);
            totalJobsHarvested += jsonLdJobs.length;

            for (const job of jsonLdJobs.slice(0, 20)) {
              await supabase.from("company_jobs").upsert({
                tenant_id: co.tenant_id,
                listing_id: co.id,
                title: job.title,
                department: job.department,
                location_name: job.locationName,
                workplace_type: job.workplaceType,
                apply_url: job.applyUrl,
                ats_job_id: `jsonld:${job.providerJobId}`,
                posted_at: job.postedAt || new Date().toISOString(),
                is_active: true,
              }, { onConflict: "listing_id,ats_job_id" });
            }

            await supabase
              .from("listings")
              .update({
                active_jobs_count: jsonLdJobs.length,
                updated_at: new Date().toISOString(),
              })
              .eq("id", co.id);

            break;
          }
        } catch {
          // Timeout or blocked, continue
        }
      }
    }

    // If we have an ATS URL, test and fetch jobs
    if (atsUrl) {
      resolvedAts++;
      const board = detectBoard(atsUrl);

      // Update listing with direct ATS url
      if (co.careers_url !== atsUrl) {
        await supabase
          .from("listings")
          .update({ careers_url: atsUrl, updated_at: new Date().toISOString() })
          .eq("id", co.id);
        updatedListings++;
      }

      if (board) {
        try {
          const jobs = await fetchJobs(board);
          if (jobs.length > 0) {
            console.log(`💼 [${board.provider}] ${co.title}: ${jobs.length} jobs`);
            totalJobsHarvested += jobs.length;

            for (const job of jobs.slice(0, 25)) {
              const atsJobId = `${board.provider}:${job.providerJobId}`;
              await supabase.from("company_jobs").upsert({
                tenant_id: co.tenant_id,
                listing_id: co.id,
                title: job.title,
                department: job.department,
                location_name: job.locationName,
                workplace_type: job.workplaceType,
                apply_url: job.applyUrl,
                ats_job_id: atsJobId,
                posted_at: job.postedAt || new Date().toISOString(),
                is_active: true,
              }, { onConflict: "listing_id,ats_job_id" });
            }

            await supabase
              .from("listings")
              .update({
                active_jobs_count: jobs.length,
                updated_at: new Date().toISOString(),
              })
              .eq("id", co.id);
          }
        } catch (err: any) {
          // Keep going
        }
      }
    }
  }

  console.log("\n==========================================================");
  console.log("  RESOLVER SUMMARY                                        ");
  console.log("==========================================================");
  console.log(`✅ Total ATS Portals Active:     ${resolvedAts}`);
  console.log(`✅ Company listings updated:    ${updatedListings}`);
  console.log(`💼 Total active jobs indexed:   ${totalJobsHarvested}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error in resolver:", err);
  process.exit(1);
});
