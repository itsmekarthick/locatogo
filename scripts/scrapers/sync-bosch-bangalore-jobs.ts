import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env: Record<string, string> = {};
fs.readFileSync(".env", "utf8")
  .split("\n")
  .forEach((l) => {
    const m = l.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: bosch } = await supabase
    .from("listings")
    .select("id, tenant_id, title, city")
    .ilike("title", "%bosch%bgsw%")
    .single();

  if (!bosch) {
    console.error("Bosch not found!");
    return;
  }
  console.log("Found Bosch:", bosch.id, bosch.title, bosch.city);

  // Fetch postings for Bengaluru & Bangalore from SmartRecruiters
  const [res1, res2] = await Promise.all([
    fetch("https://api.smartrecruiters.com/v1/companies/BoschGroup/postings?city=Bengaluru&limit=100"),
    fetch("https://api.smartrecruiters.com/v1/companies/BoschGroup/postings?city=Bangalore&limit=100"),
  ]);

  const d1 = await res1.json();
  const d2 = await res2.json();
  const rawPostings = [...(d1.content || []), ...(d2.content || [])];

  const seen = new Set<string>();
  const uniquePostings: any[] = [];
  for (const p of rawPostings) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      uniquePostings.push(p);
    }
  }

  console.log(`Fetched ${uniquePostings.length} unique Bangalore postings from SmartRecruiters`);

  // Delete stale overseas jobs for Bosch
  const { error: delErr } = await supabase
    .from("company_jobs")
    .delete()
    .eq("listing_id", bosch.id);
  if (delErr) {
    console.error("Error deleting old jobs:", delErr);
  } else {
    console.log("Deleted old non-Bangalore jobs for Bosch");
  }

  // Insert targeted Bangalore jobs
  const records = uniquePostings.map((p) => ({
    tenant_id: bosch.tenant_id,
    listing_id: bosch.id,
    title: p.name,
    department: p.department?.label || "Engineering & Software",
    location_name: "Bengaluru, India",
    workplace_type: p.location?.city?.toLowerCase().includes("remote") ? "remote" : "hybrid",
    experience_level: "mid",
    apply_url: `https://careers.smartrecruiters.com/BoschGroup/${p.id}`,
    ats_job_id: `smartrecruiters:${p.id}`,
    posted_at: p.releasedDate || new Date().toISOString(),
    is_active: true,
  }));

  const { error: insErr } = await supabase.from("company_jobs").insert(records);
  if (insErr) {
    console.error("Error inserting Bangalore jobs:", insErr);
  } else {
    console.log(`Successfully inserted ${records.length} Bangalore jobs for Bosch!`);
  }

  // Update Bosch listing active_jobs_count
  await supabase
    .from("listings")
    .update({
      active_jobs_count: records.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bosch.id);
  console.log(`Updated Bosch active_jobs_count to ${records.length}`);
}

run();
