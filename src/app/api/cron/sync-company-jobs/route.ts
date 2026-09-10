import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectBoard, fetchCareerPageJobs, fetchJobs } from "@/lib/jobs/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NON_EMPLOYER_SIGNAL = /\b(?:academy|authorized reseller|computer store|computer repair|co[- ]?working|coaching|dealer|distributor|electronics store|mobile shop|repair center|service center|showroom|training center|workspace)\b/i;
const DIRECTORY_HOST = /(?:linkedin\.com|facebook\.com|instagram\.com|justdial\.com|indiamart\.com|magicpin\.in|nearbuy\.com|sulekha\.com|singleinterface\.com|yelp\.com)/i;

function isLikelyEmployer(title: string, website: string | null | undefined): boolean {
  return !NON_EMPLOYER_SIGNAL.test(title) && !DIRECTORY_HOST.test(website || "");
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase service configuration is missing" }, { status: 500 });

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const requestUrl = new URL(request.url);
  const batchSize = Math.min(Math.max(Number(requestUrl.searchParams.get("limit") || "25"), 1), 100);
  const offset = Math.max(Number(requestUrl.searchParams.get("offset") || "0"), 0);
  const city = requestUrl.searchParams.get("city")?.trim();
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

  const summary = { city: city || null, offset, requested: batchSize, companies: companies?.length || 0, synced: 0, skipped: 0, failed: 0, zeroJobs: 0, jobs: 0 };
  await Promise.all((companies || []).map(async (company) => {
    const board = detectBoard(company.careers_url);
    const sourceUrl = company.careers_url || company.website;
    if (!isLikelyEmployer(company.title, company.website)) {
      summary.skipped++;
      return;
    }
    if (!sourceUrl) {
      summary.skipped++;
      return;
    }

    try {
      const provider = board?.provider || "career-page";
      const jobs = board ? await fetchJobs(board) : await fetchCareerPageJobs(sourceUrl);
      const providerIds = jobs.map((job) => job.providerJobId);
      for (const job of jobs) {
        const jobRecord = {
          tenant_id: company.tenant_id,
          listing_id: company.id,
          title: job.title,
          department: job.department,
          location_name: job.locationName,
          workplace_type: job.workplaceType,
          apply_url: job.applyUrl,
          ats_job_id: `${provider}:${job.providerJobId}`,
          posted_at: job.postedAt || new Date().toISOString(),
          is_active: true,
        };
        const atsJobId = `${provider}:${job.providerJobId}`;
        const { data: existingJob, error: lookupError } = await supabase
          .from("company_jobs")
          .select("id")
          .eq("listing_id", company.id)
          .eq("ats_job_id", atsJobId)
          .maybeSingle();
        if (lookupError) throw lookupError;
        const { error: writeError } = existingJob
          ? await supabase.from("company_jobs").update(jobRecord).eq("id", existingJob.id)
          : await supabase.from("company_jobs").insert({ ...jobRecord, ats_job_id: atsJobId });
        if (writeError) throw writeError;
      }

      let staleQuery = supabase.from("company_jobs").update({ is_active: false }).eq("listing_id", company.id).eq("is_active", true);
      if (providerIds.length) staleQuery = staleQuery.not("ats_job_id", "in", `(${providerIds.map((id) => `${provider}:${id}`).join(",")})`);
      const { error: staleError } = await staleQuery;
      if (staleError) throw staleError;

      await supabase.from("listings").update({ active_jobs_count: jobs.length }).eq("id", company.id);
      summary.synced++;
      if (!jobs.length) summary.zeroJobs++;
      summary.jobs += jobs.length;
    } catch (syncError) {
      console.error(`[job-sync] ${company.title}:`, syncError);
      summary.failed++;
    }
  }));

  return NextResponse.json(summary);
}
