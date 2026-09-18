import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { detectBoard, fetchCareerPageJobs, fetchJobs } from "@/lib/jobs/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 5 minutes for the full-sweep ?all=true mode
export const maxDuration = 300;

const NON_EMPLOYER_SIGNAL = /\b(?:academy|authorized reseller|computer store|computer repair|co[- ]?working|coaching|dealer|distributor|electronics store|mobile shop|repair center|service center|showroom|training center|workspace)\b/i;
const DIRECTORY_HOST = /(?:linkedin\.com|facebook\.com|instagram\.com|justdial\.com|indiamart\.com|magicpin\.in|nearbuy\.com|sulekha\.com|singleinterface\.com|yelp\.com)/i;

function isLikelyEmployer(title: string, website: string | null | undefined): boolean {
  return !NON_EMPLOYER_SIGNAL.test(title) && !DIRECTORY_HOST.test(website || "");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncCompany(
  supabase: SupabaseClient<any, any, any>,
  company: { id: string; tenant_id: string; title: string; careers_url: string | null; website: string | null }
): Promise<{ synced: boolean; jobs: number; skipped: boolean }> {
  const board = detectBoard(company.careers_url);
  const sourceUrl = company.careers_url || company.website;

  if (!isLikelyEmployer(company.title, company.website) || !sourceUrl) {
    return { synced: false, jobs: 0, skipped: true };
  }

  try {
    const provider = board?.provider || "career-page";
    const jobs = board ? await fetchJobs(board) : await fetchCareerPageJobs(sourceUrl);
    const providerIds = jobs.map((job) => job.providerJobId);

    for (const job of jobs) {
      const atsJobId = `${provider}:${job.providerJobId}`;
      const jobRecord = {
        tenant_id: company.tenant_id,
        listing_id: company.id,
        title: job.title,
        department: job.department,
        location_name: job.locationName,
        workplace_type: job.workplaceType,
        apply_url: job.applyUrl,
        ats_job_id: atsJobId,
        posted_at: job.postedAt || new Date().toISOString(),
        is_active: true,
      };
      const { data: existingJob } = await supabase
        .from("company_jobs")
        .select("id")
        .eq("listing_id", company.id)
        .eq("ats_job_id", atsJobId)
        .maybeSingle();

      if (existingJob) {
        await supabase.from("company_jobs").update(jobRecord).eq("id", existingJob.id);
      } else {
        await supabase.from("company_jobs").insert(jobRecord);
      }
    }

    // Mark stale jobs as inactive
    let staleQuery = supabase
      .from("company_jobs")
      .update({ is_active: false })
      .eq("listing_id", company.id)
      .eq("is_active", true);
    if (providerIds.length) {
      const atsIds = providerIds.map((id) => `${provider}:${id}`);
      staleQuery = staleQuery.not("ats_job_id", "in", `(${atsIds.join(",")})`);
    }
    await staleQuery;

    // Update active job count + last synced timestamp
    await supabase
      .from("listings")
      .update({ active_jobs_count: jobs.length, updated_at: new Date().toISOString() })
      .eq("id", company.id);

    return { synced: true, jobs: jobs.length, skipped: false };
  } catch (err) {
    console.error(`[job-sync] ${company.title}:`, err);
    return { synced: false, jobs: 0, skipped: false };
  }
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase service configuration is missing" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const requestUrl = new URL(request.url);
  const batchSize = Math.min(Math.max(Number(requestUrl.searchParams.get("limit") || "25"), 1), 200);
  const offset = Math.max(Number(requestUrl.searchParams.get("offset") || "0"), 0);
  const city = requestUrl.searchParams.get("city")?.trim();
  const allMode = requestUrl.searchParams.get("all") === "true";

  const startTime = Date.now();

  const summary = {
    mode: allMode ? "full-sweep" : "batch",
    city: city || null,
    offset: allMode ? 0 : offset,
    total_companies: 0,
    synced: 0,
    skipped: 0,
    failed: 0,
    zero_jobs: 0,
    jobs_active: 0,
    duration_ms: 0,
  };

  if (allMode) {
    // Full sweep: process all companies in serial batches of 25
    const SWEEP_BATCH = 25;
    let currentOffset = 0;
    let totalProcessed = 0;

    for (;;) {
      let query = supabase
        .from("listings")
        .select("id, tenant_id, title, careers_url, website")
        .eq("status", "published")
        .not("company_type", "is", null)
        .or("careers_url.not.is.null,website.not.is.null");
      if (city) query = query.ilike("city", city);
      const { data: companies, error } = await query
        .order("id")
        .range(currentOffset, currentOffset + SWEEP_BATCH - 1);

      if (error || !companies || companies.length === 0) break;
      totalProcessed += companies.length;
      summary.total_companies += companies.length;

      await Promise.all(
        companies.map(async (company) => {
          const result = await syncCompany(supabase, company);
          if (result.skipped) summary.skipped++;
          else if (result.synced) {
            summary.synced++;
            if (result.jobs === 0) summary.zero_jobs++;
            summary.jobs_active += result.jobs;
          } else {
            summary.failed++;
          }
        })
      );

      if (companies.length < SWEEP_BATCH) break;
      currentOffset += SWEEP_BATCH;
    }
  } else {
    // Single batch mode
    let companiesQuery = supabase
      .from("listings")
      .select("id, tenant_id, title, careers_url, website")
      .eq("status", "published")
      .not("company_type", "is", null)
      .or("careers_url.not.is.null,website.not.is.null");
    if (city) companiesQuery = companiesQuery.ilike("city", city);
    const { data: companies, error } = await companiesQuery
      .order("id")
      .range(offset, offset + batchSize - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    summary.total_companies = companies?.length || 0;

    await Promise.all(
      (companies || []).map(async (company) => {
        const result = await syncCompany(supabase, company);
        if (result.skipped) summary.skipped++;
        else if (result.synced) {
          summary.synced++;
          if (result.jobs === 0) summary.zero_jobs++;
          summary.jobs_active += result.jobs;
        } else {
          summary.failed++;
        }
      })
    );
  }

  summary.duration_ms = Date.now() - startTime;
  console.log(`[job-sync] Completed: ${JSON.stringify(summary)}`);
  return NextResponse.json(summary);
}
