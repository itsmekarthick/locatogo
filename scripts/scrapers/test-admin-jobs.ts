import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import fs from "fs";

const envFile = fs.readFileSync(".env", "utf8");
envFile.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

async function check() {
  const supabase = createSupabaseAdminClient();
  const { data: rawJobs, error } = await supabase
    .from("company_jobs")
    .select("*")
    .eq("is_active", true)
    .order("posted_at", { ascending: false });

  console.log("Admin rawJobs count:", rawJobs?.length, "Error:", error?.message);

  const infosysJobs = (rawJobs || []).filter((j: any) => j.listing_id === "7846cabf-ec9b-4995-920d-6b7b7c81492c");
  console.log("Infosys jobs found with ADMIN client:", infosysJobs.length);
}

check().catch(console.error);
