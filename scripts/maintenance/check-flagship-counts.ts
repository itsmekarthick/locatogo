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
  const { data: domains } = await supabase.from("domains").select("id, name, slug").order("name");
  console.log("DOMAINS IN DATABASE:");
  for (const d of domains || []) {
    const { count } = await supabase.from("listings").select("*", { count: "exact", head: true }).eq("domain_id", d.id);
    console.log(`- ${d.name} (slug: '${d.slug}'): ${count} listings`);
  }
}

main().catch(console.error);
