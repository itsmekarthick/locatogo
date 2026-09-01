import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Parse .env
const envFile = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
envFile.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Test disambiguated query
  const { data: rawListings, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      slug,
      short_description,
      description,
      address_line_1,
      locality,
      city,
      latitude,
      longitude,
      website,
      careers_url,
      company_type,
      funding_stage,
      employee_range,
      tech_stack,
      founded_year,
      active_jobs_count,
      category:categories!listings_category_id_domain_id_fkey(name, slug)
    `)
    .eq("status", "published")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(5000);

  console.log("Disambiguated Query Error:", error);
  console.log("Total published listings returned:", rawListings?.length);
  if (rawListings && rawListings.length > 0) {
    const techCount = rawListings.filter((l: any) => l.company_type || (l.category?.name || "").includes("Tech")).length;
    console.log("Tech companies count:", techCount);
    console.log("Sample listing:", rawListings[rawListings.length - 1]);
  }
}

run();
