import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env: Record<string, string> = {};
const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
fs.readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[m[1]] = v;
    }
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from("domains")
    .select("id, name, slug, default_latitude, default_longitude")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching domains:", error);
    return;
  }

  console.log(`Found ${data?.length} domains:`);
  for (const d of data || []) {
    console.log(`- ${d.name.padEnd(25)} | ${d.slug.padEnd(18)} | ${d.id}`);
  }
}

main().catch(console.error);
