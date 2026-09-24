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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { count: listingCount } = await supabase.from("listings").select("*", { count: "exact", head: true });
  const { count: jobCount } = await supabase.from("company_jobs").select("*", { count: "exact", head: true });
  const { data: domains } = await supabase.from("domains").select("id, slug, name");

  console.log(`\n📊 DATABASE SUMMARY:`);
  console.log(`- Total Companies / Listings: ${listingCount}`);
  console.log(`- Total Live Synced Jobs:     ${jobCount}`);
  console.log(`- Total Global Metros:        ${domains?.length || 0}`);
}

main().catch(console.error);
