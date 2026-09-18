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
  const { data: domains } = await supabase.from("domains").select("id, name, slug");
  if (!domains) return;

  for (const d of domains) {
    const { count } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", d.id);

    const { count: withType } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", d.id)
      .not("company_type", "is", null);

    console.log(`Domain: ${d.name.padEnd(20)} (${d.slug}): ${count} total, ${withType} curated`);
  }
}

main().catch(console.error);
