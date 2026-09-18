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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const domainId = "461e4ee7-7a16-43b3-b342-5a968e44f306";
  const checks = [
    "Observe",
    "Freshworks",
    "HighRadius",
    "Zenoti",
    "Druva",
    "KredX",
    "Thoughtworks",
    "Confluent",
    "Elastic",
    "GitLab",
    "Docker",
  ];

  for (const q of checks) {
    const { data } = await supabase
      .from("listings")
      .select("id, title, slug, company_type")
      .eq("domain_id", domainId)
      .ilike("title", `%${q}%`);
    console.log(`Query "${q}":`, data?.map((d) => d.title));
  }
}

main().catch(console.error);
