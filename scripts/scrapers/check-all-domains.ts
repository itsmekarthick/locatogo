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

async function run() {
  const { data: domains } = await supabase.from("domains").select("id, name, slug");
  console.log("DOMAINS IN DB:");
  for (const d of domains || []) {
    const { count: totalListings } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("domain_id", d.id);
    const { count: techListings } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("domain_id", d.id)
      .not("company_type", "is", null);
    console.log(`  ${d.name.padEnd(14)} (${d.slug.padEnd(12)}): total=${totalListings || 0}, tech=${techListings || 0}`);
  }

  const { count: globalTotal } = await supabase.from("listings").select("id", { count: "exact", head: true });
  console.log(`\nGLOBAL TOTAL LISTINGS IN DB: ${globalTotal}`);
}

run();
