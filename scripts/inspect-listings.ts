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

  const { data: latest } = await supabase
    .from("listings")
    .select("id, title, status, category_id, company_type, funding_stage, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  console.log("Latest 10 listings:", latest);
}

run();
