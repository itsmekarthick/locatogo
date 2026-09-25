import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env: Record<string, string> = {};
const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
fs.readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^['\"]|['\"]$/g, "");
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await supabase
    .from("listings")
    .select("description")
    .ilike("description", "%providing % solutions%")
    .limit(2000);

  const catCounts: Record<string, number> = {};
  for (const d of data || []) {
    const m = d.description?.match(/providing (.*) solutions/);
    if (m) {
      const c = m[1];
      catCounts[c] = (catCounts[c] || 0) + 1;
    }
  }

  console.log("Categories found in descriptions:");
  for (const [cat, cnt] of Object.entries(catCounts).sort((a, b) => b - a)) {
    console.log(`  - ${cat}: ${cnt}`);
  }
}

main().catch(console.error);
