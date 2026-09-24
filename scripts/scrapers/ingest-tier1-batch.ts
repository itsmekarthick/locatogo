import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs, ExternalJob } from "../../src/lib/jobs/providers";
import { TIER1_COMPANIES, Tier1CompanyRecord } from "./tier1-tech-catalog";

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

async function getContext() {
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", "karthick")
    .single();

  if (tErr || !tenant) {
    throw new Error(`Tenant 'karthick' not found: ${tErr?.message}`);
  }

  const { data: category, error: cErr } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("tenant_id", tenant.id)
    .eq("slug", "tech-coworking")
    .single();

  if (cErr || !category) {
    throw new Error(`Category 'tech-coworking' not found for tenant: ${cErr?.message}`);
  }

  const { data: domains, error: dErr } = await supabase
    .from("domains")
    .select("id, name, slug")
    .eq("tenant_id", tenant.id);

  if (dErr || !domains) {
    throw new Error(`Failed to load domains: ${dErr?.message}`);
  }

  const domainMap = new Map<string, string>();
  for (const d of domains) {
    domainMap.set(d.slug, d.id);
  }

  return { tenantId: tenant.id, categoryId: category.id, domainMap };
}

async function ingestCompany(
  supabase: SupabaseClient,
  tenantId: string,
  domainId: string,
  categoryId: string,
  company: Tier1CompanyRecord
): Promise<{ listingId: string; jobsCount: number }> {
  // 1. Upsert Listing
  const listingData = {
    tenant_id: tenantId,
    domain_id: domainId,
    category_id: categoryId,
    title: company.title,
    slug: company.slug,
    short_description: company.short_description,
    description: `${company.title} is a leading ${company.company_type.replace(/_/g, " ")} organization located in ${company.city}, ${company.state || company.country_code}.`,
    address_line_1: company.address_line_1,
    locality: company.locality,
    city: company.city,
    administrative_area: company.state,
    postal_code: company.postal_code,
    country_code: company.country_code,
    latitude: company.latitude,
    longitude: company.longitude,
    website: company.website,
    careers_url: company.careers_url,
    status: "published",
    verification_status: "verified",
    company_type: company.company_type,
    funding_stage: company.funding_stage,
    updated_at: new Date().toISOString(),
  };

  const { data: savedListing, error: upsertErr } = await supabase
    .from("listings")
    .upsert(listingData, { onConflict: "domain_id,slug" })
    .select("id")
    .single();

  if (upsertErr || !savedListing) {
    throw new Error(`Failed to upsert listing for ${company.title}: ${upsertErr?.message}`);
  }

  const listingId = savedListing.id;

  // 2. Fetch Live ATS Jobs
  let rawJobs: ExternalJob[] = [];
  const board = detectBoard(company.careers_url);

  if (board) {
    try {
      rawJobs = await fetchJobs(board);
    } catch (err: any) {
      console.warn(`   ⚠️  ATS error for ${company.title} (${board.provider}): ${err.message}`);
    }
  }

  const validJobs = rawJobs.filter((j) => {
    if (!j.title || !j.applyUrl) return false;
    const url = j.applyUrl.trim();
    if (url === "#" || url === "" || url === company.website) return false;
    return true;
  });

  const jobsToInsert = validJobs.slice(0, MAX_JOBS_PER_COMPANY);

  // 3. Clear existing company_jobs and insert fresh
  await supabase.from("company_jobs").delete().eq("listing_id", listingId);

  if (jobsToInsert.length > 0) {
    const jobRows = jobsToInsert.map((j) => ({
      tenant_id: tenantId,
      listing_id: listingId,
      title: j.title.trim(),
      department: j.department || "Engineering",
      location_name: j.locationName || `${company.city}, ${company.country_code}`,
      workplace_type: j.workplaceType || "hybrid",
      experience_level: "mid",
      apply_url: j.applyUrl.trim(),
      ats_job_id: board ? `${board.provider}:${j.providerJobId}` : `ats:${j.providerJobId}`,
      posted_at: j.postedAt || new Date().toISOString(),
      is_active: true,
      last_synced_at: new Date().toISOString(),
    }));

    for (let i = 0; i < jobRows.length; i += 50) {
      const chunk = jobRows.slice(i, i + 50);
      const { error: insErr } = await supabase.from("company_jobs").insert(chunk);
      if (insErr) {
        console.error(`   ❌ Failed to insert jobs chunk for ${company.title}:`, insErr.message);
      }
    }
  }

  // 4. Update active_jobs_count
  await supabase
    .from("listings")
    .update({
      active_jobs_count: jobsToInsert.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  return { listingId, jobsCount: jobsToInsert.length };
}

async function main() {
  console.log("===============================================================");
  console.log("🚀 CRAWLING & PUSHING TIER-1 GLOBAL TECH COMPANIES & JOBS");
  console.log("===============================================================\n");

  const { tenantId, categoryId, domainMap } = await getContext();
  const metros = Object.keys(TIER1_COMPANIES);

  let grandTotalCompanies = 0;
  let grandTotalJobs = 0;

  for (const metro of metros) {
    const companies = TIER1_COMPANIES[metro];
    const domainId = domainMap.get(metro);
    if (!domainId) {
      console.warn(`⚠️ Domain for ${metro} not found in database, skipping`);
      continue;
    }

    console.log(`\n📍 Metro: [${metro.toUpperCase()}] (${companies.length} companies)`);
    for (const comp of companies) {
      process.stdout.write(`   - ${comp.title} (${comp.city}, ${comp.country_code})... `);
      try {
        const res = await ingestCompany(supabase, tenantId, domainId, categoryId, comp);
        grandTotalCompanies++;
        grandTotalJobs += res.jobsCount;
        console.log(`✅ ${res.jobsCount} live jobs synced!`);
      } catch (err: any) {
        console.log(`❌ Failed: ${err.message}`);
      }
    }
  }

  console.log("\n===============================================================");
  console.log(`🎉 TIER-1 BATCH INGESTION COMPLETED!`);
  console.log(`🏢 Total Companies Pushed: ${grandTotalCompanies}`);
  console.log(`💼 Total Live Jobs Pushed:  ${grandTotalJobs}`);
  console.log("===============================================================\n");
}

main().catch(console.error);
