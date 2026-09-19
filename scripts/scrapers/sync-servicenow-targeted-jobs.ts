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
  const res = await fetch("https://api.smartrecruiters.com/v1/companies/servicenow/postings?country=in&limit=100");
  const data = await res.json();
  const allIndiaJobs = data.content || [];

  console.log(`Fetched ${allIndiaJobs.length} India jobs from ServiceNow`);

  const targets = [
    { city: "Bangalore", query: "bangalore" },
    { city: "Hyderabad", query: "hyderabad" },
  ];

  for (const t of targets) {
    const { data: listings } = await supabase
      .from("listings")
      .select("id, tenant_id, title, city")
      .ilike("title", "%servicenow%")
      .eq("city", t.city);

    if (listings && listings.length > 0) {
      const targetJobs = allIndiaJobs.filter((j: any) =>
        (j.location?.city || "").toLowerCase().includes(t.query)
      );

      for (const comp of listings) {
        await supabase.from("company_jobs").delete().eq("listing_id", comp.id);
        const records = targetJobs.map((j: any) => ({
          tenant_id: comp.tenant_id,
          listing_id: comp.id,
          title: j.name,
          department: j.department?.label || "Enterprise Cloud",
          location_name: `${t.city}, India`,
          workplace_type: "hybrid",
          experience_level: "mid",
          apply_url: `https://careers.smartrecruiters.com/servicenow/${j.id}`,
          ats_job_id: `smartrecruiters:${j.id}`,
          posted_at: j.releasedDate || new Date().toISOString(),
          is_active: true,
        }));

        if (records.length > 0) {
          await supabase.from("company_jobs").insert(records);
        }
        await supabase
          .from("listings")
          .update({ active_jobs_count: records.length, updated_at: new Date().toISOString() })
          .eq("id", comp.id);
        console.log(`Updated ${comp.title} (${comp.city}) with ${records.length} jobs`);
      }
    }
  }
}

run();
