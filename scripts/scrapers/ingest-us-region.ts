import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs, ExternalJob } from "../../src/lib/jobs/providers";
import { US_COMPANIES_BY_CITY, USCompanyRecord } from "./us-company-catalog";

const env: Record<string, string> = {};
fs.readFileSync(".env", "utf8")
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

  // Get tech category
  const { data: category, error: cErr } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("tenant_id", tenant.id)
    .eq("slug", "tech-coworking")
    .single();

  if (cErr || !category) {
    throw new Error(`Category 'tech-coworking' not found for tenant: ${cErr?.message}`);
  }

  // Get domains
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
  company: USCompanyRecord
): Promise<{ listingId: string; jobsCount: number }> {
  // 1. Upsert Listing
  const listingData = {
    tenant_id: tenantId,
    domain_id: domainId,
    category_id: categoryId,
    title: company.title,
    slug: company.slug,
    short_description: company.short_description,
    description: `${company.title} is a leading ${company.company_type.replace(/_/g, " ")} organization located in ${company.city}, ${company.state}.`,
    address_line_1: company.address_line_1,
    locality: company.locality,
    city: company.city,
    administrative_area: company.state,
    postal_code: company.postal_code,
    country_code: "US",
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

  // Filter valid direct-apply jobs
  const validJobs = rawJobs.filter((j) => {
    if (!j.title || !j.applyUrl) return false;
    const url = j.applyUrl.trim();
    if (url === "#" || url === "" || url === company.website) return false;
    return true;
  });

  const jobsToInsert = validJobs.slice(0, MAX_JOBS_PER_COMPANY);

  // 3. Clear existing company_jobs for this listing and insert fresh ones
  await supabase.from("company_jobs").delete().eq("listing_id", listingId);

  if (jobsToInsert.length > 0) {
    const jobRows = jobsToInsert.map((j) => ({
      tenant_id: tenantId,
      listing_id: listingId,
      title: j.title.trim(),
      department: j.department || "Engineering",
      location_name: j.locationName || `${company.city}, United States`,
      workplace_type: j.workplaceType || "hybrid",
      experience_level: "mid",
      apply_url: j.applyUrl.trim(),
      ats_job_id: board ? `${board.provider}:${j.providerJobId}` : `ats:${j.providerJobId}`,
      posted_at: j.postedAt || new Date().toISOString(),
      is_active: true,
      last_synced_at: new Date().toISOString(),
    }));

    // Insert in chunks of 50
    for (let i = 0; i < jobRows.length; i += 50) {
      const chunk = jobRows.slice(i, i + 50);
      const { error: insErr } = await supabase.from("company_jobs").insert(chunk);
      if (insErr) {
        console.error(`   ❌ Failed to insert jobs chunk for ${company.title}:`, insErr.message);
      }
    }
  }

  // 4. Update active_jobs_count on listings
  await supabase
    .from("listings")
    .update({
      active_jobs_count: jobsToInsert.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  return { listingId, jobsCount: jobsToInsert.length };
}

export async function ingestRegion(citySlug: string) {
  const companies = US_COMPANIES_BY_CITY[citySlug];
  if (!companies || companies.length === 0) {
    console.error(`❌ No companies configured for region: ${citySlug}`);
    return;
  }

  const { tenantId, categoryId, domainMap } = await getContext();
  const domainId = domainMap.get(citySlug);

  if (!domainId) {
    console.error(`❌ Domain for '${citySlug}' not found in Supabase!`);
    return;
  }

  console.log(`\n===============================================================`);
  console.log(`🚀 INGESTING US REGION: [${citySlug.toUpperCase()}]`);
  console.log(`🏢 Total Companies to process: ${companies.length}`);
  console.log(`📍 Target Domain ID: ${domainId}`);
  console.log(`===============================================================\n`);

  let totalJobsIngested = 0;
  let successCount = 0;

  for (let i = 0; i < companies.length; i++) {
    const comp = companies[i];
    process.stdout.write(`[${i + 1}/${companies.length}] ${comp.title} (${comp.city})... `);
    try {
      const res = await ingestCompany(supabase, tenantId, domainId, categoryId, comp);
      successCount++;
      totalJobsIngested += res.jobsCount;
      console.log(`✅ ${res.jobsCount} live jobs synced!`);
    } catch (err: any) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }

  console.log(`\n🏁 [${citySlug.toUpperCase()}] SUMMARY:`);
  console.log(`   Companies Synced: ${successCount}/${companies.length}`);
  console.log(`   Total Live Jobs:  ${totalJobsIngested}\n`);

  return { companies: successCount, jobs: totalJobsIngested };
}

async function main() {
  const args = process.argv.slice(2);
  const cityArg = args.find((a) => a.startsWith("--city="))?.split("=")[1] || args[args.indexOf("--city") + 1];
  const allArg = args.includes("--all");

  const availableCities = Object.keys(US_COMPANIES_BY_CITY);

  if (allArg) {
    console.log("🌐 Ingesting ALL US Regions sequentially...\n");
    let grandTotalCompanies = 0;
    let grandTotalJobs = 0;

    for (const city of availableCities) {
      const res = await ingestRegion(city);
      if (res) {
        grandTotalCompanies += res.companies;
        grandTotalJobs += res.jobs;
      }
    }

    console.log("\n===============================================================");
    console.log("🎉 ALL US REGIONS INGESTION COMPLETED!");
    console.log(`🏢 Grand Total Companies: ${grandTotalCompanies}`);
    console.log(`💼 Grand Total Live Jobs: ${grandTotalJobs}`);
    console.log("===============================================================\n");
  } else if (cityArg) {
    if (!availableCities.includes(cityArg)) {
      console.error(`❌ Unknown city: '${cityArg}'. Available: ${availableCities.join(", ")}`);
      process.exit(1);
    }
    await ingestRegion(cityArg);
  } else {
    console.log("Usage:");
    console.log("  npx tsx scripts/scrapers/ingest-us-region.ts --city=<slug>");
    console.log("  npx tsx scripts/scrapers/ingest-us-region.ts --all");
    console.log(`Available cities: ${availableCities.join(", ")}`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
