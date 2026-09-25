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
  const hubs = ["siliconvalley", "new-york", "london", "bangalore"];
  for (const h of hubs) {
    const { data: d } = await supabase.from("domains").select("id, name, slug").eq("slug", h).single();
    if (!d) continue;
    const { data: listings } = await supabase
      .from("listings")
      .select("title, website, careers_url, city")
      .eq("domain_id", d.id)
      .limit(5);

    console.log(`\n📍 ${d.name} (${d.slug}):`);
    for (const l of listings || []) {
      console.log(`   - ${l.title}: website=${l.website}, careers=${l.careers_url}`);
    }
  }
}

main().catch(console.error);
