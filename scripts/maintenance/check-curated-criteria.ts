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
  const bangaloreDomainId = "461e4ee7-7a16-43b3-b342-5a968e44f306";

  const { count: curatedCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("domain_id", bangaloreDomainId)
    .not("tech_stack", "is", null);

  const { count: uncuratedCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("domain_id", bangaloreDomainId)
    .is("tech_stack", null);

  console.log(`Curated (with tech_stack): ${curatedCount}`);
  console.log(`Uncurated (without tech_stack): ${uncuratedCount}`);
}

main().catch(console.error);
