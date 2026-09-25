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

async function run() {
  const { count: total } = await supabase.from("listings").select("*", { count: "exact", head: true });
  const { count: verified } = await supabase.from("listings").select("*", { count: "exact", head: true }).eq("verification_status", "verified");
  const { count: published } = await supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "published");
  console.log({ total, verified, published });
}
run();
