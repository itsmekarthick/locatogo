import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
envFile.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

// Test with ANON key like the server component does!
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: rawJobs, error: jobsErr } = await supabase
    .from("company_jobs")
    .select("*")
    .eq("is_active", true)
    .order("posted_at", { ascending: false });

  console.log("Anon key rawJobs count:", rawJobs?.length, "Error:", jobsErr?.message);

  if (rawJobs) {
    const infosysJobs = rawJobs.filter((j: any) => j.listing_id === "7846cabf-ec9b-4995-920d-6b7b7c81492c");
    console.log("Infosys jobs found with ANON key:", infosysJobs.length);
  }
}

check().catch(console.error);
