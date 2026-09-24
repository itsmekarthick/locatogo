import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs, ExternalJob } from "../../src/lib/jobs/providers";

const env: Record<string, string> = {};
const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
fs.readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[m[1]] = v;
    }
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MAX_JOBS_PER_COMPANY = 150;

async function syncCompany(company: {
  id: string;
  tenant_id: string;
  title: string;
  city: string | null;
  country_code: string | null;
  careers_url: string | null;
  website: string | null;
}): Promise<{ synced: boolean; activeJobs: number; deactivatedJobs: number }> {
  if (!company.careers_url) {
    return { synced: false, activeJobs: 0, deactivatedJobs: 0 };
  }

  const board = detectBoard(company.careers_url);
  if (!board) {
    return { synced: false, activeJobs: 0, deactivatedJobs: 0 };
  }

  let rawJobs: ExternalJob[] = [];
  try {
    rawJobs = await fetchJobs(board);
  } catch (err: any) {
    console.warn(`   ⚠️ ATS error for ${company.title} (${board.provider}): ${err.message}`);
    return { synced: false, activeJobs: 0, deactivatedJobs: 0 };
  }

  const validJobs = rawJobs.filter((j) => {
    if (!j.title || !j.applyUrl) return false;
    const url = j.applyUrl.trim();
    return url !== "#" && url !== "" && url !== company.website;
  });

  const jobsToSync = validJobs.slice(0, MAX_JOBS_PER_COMPANY);
  const currentProviderIds = new Set(jobsToSync.map((j) => `${board.provider}:${j.providerJobId}`));

  // 1. Upsert active jobs
  for (const j of jobsToSync) {
    const atsJobId = `${board.provider}:${j.providerJobId}`;
    const jobRow = {
      tenant_id: company.tenant_id,
      listing_id: company.id,
      title: j.title.trim(),
      department: j.department || "Engineering",
      location_name: j.locationName || `${company.city || "Remote"}, ${company.country_code || ""}`.trim(),
      workplace_type: j.workplaceType || "hybrid",
      experience_level: "mid",
      apply_url: j.applyUrl.trim(),
      ats_job_id: atsJobId,
      posted_at: j.postedAt || new Date().toISOString(),
      is_active: true,
      last_synced_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("company_jobs")
      .select("id")
      .eq("listing_id", company.id)
      .eq("ats_job_id", atsJobId)
      .maybeSingle();

    if (existing) {
      await supabase.from("company_jobs").update(jobRow).eq("id", existing.id);
    } else {
      await supabase.from("company_jobs").insert(jobRow);
    }
  }

  // 2. Deactivate jobs no longer on the board
  const { data: existingActiveJobs } = await supabase
    .from("company_jobs")
    .select("id, ats_job_id")
    .eq("listing_id", company.id)
    .eq("is_active", true);

  let deactivated = 0;
  if (existingActiveJobs) {
    for (const ej of existingActiveJobs) {
      if (ej.ats_job_id && !currentProviderIds.has(ej.ats_job_id)) {
        await supabase.from("company_jobs").update({ is_active: false }).eq("id", ej.id);
        deactivated++;
      }
    }
  }

  // 3. Update listing active_jobs_count
  await supabase
    .from("listings")
    .update({
      active_jobs_count: jobsToSync.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);

  return { synced: true, activeJobs: jobsToSync.length, deactivatedJobs: deactivated };
}

async function main() {
  console.log("===============================================================");
  console.log("🔄 STARTING AUTOMATED GLOBAL JOB SYNC & STALE PRUNING");
  console.log("===============================================================\n");

  const startTime = Date.now();

  const { data: companies, error } = await supabase
    .from("listings")
    .select("id, tenant_id, title, city, country_code, careers_url, website")
    .eq("status", "published")
    .not("careers_url", "is", null)
    .order("title");

  if (error || !companies) {
    console.error("Failed to load companies:", error);
    process.exit(1);
  }

  const atsCompanies = companies.filter((c) => detectBoard(c.careers_url));
  console.log(`Found ${companies.length} published companies (${atsCompanies.length} with verified ATS boards)\n`);

  let totalSynced = 0;
  let totalActiveJobs = 0;
  let totalDeactivatedJobs = 0;

  for (let i = 0; i < atsCompanies.length; i++) {
    const comp = atsCompanies[i];
    process.stdout.write(`[${i + 1}/${atsCompanies.length}] ${comp.title} (${comp.city || "Global"})... `);

    const res = await syncCompany(comp);
    if (res.synced) {
      totalSynced++;
      totalActiveJobs += res.activeJobs;
      totalDeactivatedJobs += res.deactivatedJobs;
      console.log(`✅ ${res.activeJobs} active (${res.deactivatedJobs} pruned)`);
    } else {
      console.log(`⚠️ skipped/failed`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n===============================================================");
  console.log(`🎉 GLOBAL JOB SYNC COMPLETED in ${elapsed}s`);
  console.log(`🏢 Companies Updated:   ${totalSynced}/${atsCompanies.length}`);
  console.log(`💼 Active Jobs Live:    ${totalActiveJobs}`);
  console.log(`🧹 Stale Roles Pruned:  ${totalDeactivatedJobs}`);
  console.log("===============================================================\n");
}

main().catch(console.error);
