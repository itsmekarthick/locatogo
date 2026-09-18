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
  const t0 = Date.now();
  // Try direct delete by domain_id with .neq("id", "00000000-0000-0000-0000-000000000000") on Kolkata domain
  const { data: kolkata } = await supabase.from("domains").select("id").eq("slug", "kolkata").single();
  if (!kolkata) return;

  console.log("Testing direct delete by domain_id on Kolkata domain:", kolkata.id);
  const { error, count } = await supabase.from("listings").delete({ count: "exact" }).eq("domain_id", kolkata.id);
  console.log(`Deleted result in ${Date.now() - t0}ms, count: ${count}, error:`, error?.message || "none");
}

main().catch(console.error);
