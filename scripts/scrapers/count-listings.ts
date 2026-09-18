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
  const { count: totalBangalore } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId);

  const { count: withType } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId)
    .not("company_type", "is", null);

  const { count: withoutType } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId)
    .is("company_type", null);

  console.log(`Total listings in Bangalore domain: ${totalBangalore}`);
  console.log(`Curated listings (with company_type): ${withType}`);
  console.log(`Old legacy listings (without company_type): ${withoutType}`);
}

main().catch(console.error);
