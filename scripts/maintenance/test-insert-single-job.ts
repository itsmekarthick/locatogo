import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

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

async function test() {
  const listingId = "9652e475-1290-4b63-a6c6-11be79eeaf84"; // ServiceNow Hyderabad
  const tenantId = "1c186ac3-a365-4653-bd47-b87758890dfb";

  const { data, error } = await supabase.from("company_jobs").insert({
    tenant_id: tenantId,
    listing_id: listingId,
    title: "Staff Product Security Engineer, PSIRT",
    department: "Digital Technology",
    location_name: "Hyderabad, India",
    workplace_type: "hybrid",
    apply_url: "https://careers.smartrecruiters.com/servicenow/744000150415361",
    ats_job_id: "smartrecruiters:744000150415361",
    posted_at: new Date().toISOString(),
    is_active: true,
  }).select();

  console.log("Insert result:", { data, error });
}

test().catch(console.error);
