import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { detectBoard, fetchJobs } from "@/lib/jobs/providers";
import { jobMatchesLocation } from "@/lib/jobs/location-matcher";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing company id" }, { status: 400 });
  }

  const requestedCity =
    request.nextUrl.searchParams.get("city") ||
    request.nextUrl.searchParams.get("location") ||
    request.nextUrl.searchParams.get("hub");

  let supabase: any;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    supabase = await createSupabaseServerClient();
  }

  // Fetch listing details for context (city, careers URL)
  const { data: listing } = await supabase
    .from("listings")
    .select("id, tenant_id, title, city, locality, careers_url")
    .eq("id", id)
    .single();

  const targetCity = requestedCity?.trim() || listing?.city?.trim() || "Bangalore";

  // 1. Fetch pre-ingested active jobs for this company
  const { data: storedJobs, error } = await supabase
    .from("company_jobs")
    .select(
      "id, title, department, location_name, workplace_type, experience_level, salary_range, apply_url, posted_at, is_active"
    )
    .eq("listing_id", id)
    .eq("is_active", true)
    .order("posted_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("Error fetching company jobs:", error);
  }

  if (storedJobs && storedJobs.length > 0) {
    const localJobs = storedJobs.filter((j: any) => jobMatchesLocation(j.location_name, targetCity));

    // If we have jobs matching the requested place, return them with full metadata
    if (localJobs.length > 0) {
      return NextResponse.json({
        jobs: localJobs,
        allJobs: storedJobs,
        targetCity,
        localCount: localJobs.length,
        total: storedJobs.length,
        source: "cache",
      });
    }

    // If stored jobs exist but none matched the city and company has a careers portal,
    // check if live-syncing with city targeting brings in real local openings
    if (listing?.careers_url) {
      const board = detectBoard(listing.careers_url);
      if (board && board.provider === "smartrecruiters") {
        try {
          const targetedJobs = await fetchJobs(board, { city: targetCity });
          const matchingTargeted = targetedJobs.filter((j) =>
            jobMatchesLocation(j.locationName, targetCity)
          );

          if (matchingTargeted.length > 0) {
            const records = matchingTargeted.slice(0, 150).map((j) => ({
              tenant_id: listing.tenant_id,
              listing_id: listing.id,
              title: j.title,
              department: j.department || "Engineering",
              location_name: j.locationName || `${targetCity}, India`,
              workplace_type: j.workplaceType || "hybrid",
              experience_level: "mid",
              apply_url: j.applyUrl,
              ats_job_id: `${board.provider}:${j.providerJobId}`,
              posted_at: j.postedAt || new Date().toISOString(),
              is_active: true,
            }));

            // Replace stale overseas jobs with targeted local jobs
            await supabase.from("company_jobs").delete().eq("listing_id", listing.id);
            await supabase.from("company_jobs").insert(records);
            await supabase
              .from("listings")
              .update({
                active_jobs_count: records.length,
                updated_at: new Date().toISOString(),
              })
              .eq("id", listing.id);

            return NextResponse.json({
              jobs: records,
              allJobs: records,
              targetCity,
              localCount: records.length,
              total: records.length,
              source: "targeted_sync",
            });
          }
        } catch (syncErr) {
          console.warn("City-targeted ATS fetch error:", syncErr);
        }
      }
    }

    // Fallback if no specific city matches: return all stored jobs with notice
    return NextResponse.json({
      jobs: storedJobs,
      allJobs: storedJobs,
      targetCity,
      localCount: 0,
      total: storedJobs.length,
      source: "cache_all",
    });
  }

  // 2. If no jobs are in company_jobs yet, check if the listing has a careers_url to live-fetch
  if (listing?.careers_url) {
    const board = detectBoard(listing.careers_url);
    if (board) {
      try {
        const liveJobs = await fetchJobs(board, { city: targetCity });
        if (liveJobs && liveJobs.length > 0) {
          // Prioritize local jobs
          const localOnly = liveJobs.filter((j) => jobMatchesLocation(j.locationName, targetCity));
          const selectedJobs = localOnly.length > 0 ? localOnly : liveJobs;

          const maxJobs = listing.title.toLowerCase().includes("servicenow") ? 650 : 150;
          const records = selectedJobs.slice(0, maxJobs).map((j) => {
            let cleanApplyUrl = j.applyUrl;
            if (board.provider === "smartrecruiters" && j.providerJobId) {
              cleanApplyUrl = `https://careers.smartrecruiters.com/${board.token}/${j.providerJobId}`;
            }
            return {
              tenant_id: listing.tenant_id,
              listing_id: listing.id,
              title: j.title,
              department: j.department || "Engineering",
              location_name: j.locationName || `${targetCity || listing.city || "India"}`,
              workplace_type: j.workplaceType || "hybrid",
              experience_level: "mid",
              apply_url: cleanApplyUrl,
              ats_job_id: `${board.provider}:${j.providerJobId}`,
              posted_at: j.postedAt || new Date().toISOString(),
              is_active: true,
            };
          });

          // Insert into company_jobs
          await supabase.from("company_jobs").insert(records);

          // Update listing active_jobs_count
          await supabase
            .from("listings")
            .update({
              active_jobs_count: records.length,
              updated_at: new Date().toISOString(),
            })
            .eq("id", listing.id);

          return NextResponse.json({
            jobs: records,
            allJobs: records,
            targetCity,
            localCount: localOnly.length,
            total: records.length,
            source: "live_synced",
          });
        }
      } catch (err) {
        console.warn("Live ATS fetch error:", err);
      }
    }
  }

  return NextResponse.json({
    jobs: [],
    allJobs: [],
    targetCity,
    localCount: 0,
    total: 0,
  });
}
