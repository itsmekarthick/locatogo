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
  const { error } = await supabase
    .from("domains")
    .update({
      default_latitude: 17.4399,
      default_longitude: 78.3750,
      default_zoom: 12,
      description: "Explore Cyberabad, HITEC City, Financial District, and Hyderabad's tech ecosystem.",
      updated_at: new Date().toISOString(),
    })
    .eq("slug", "hyderabad");

  if (error) console.error("Error updating Hyderabad domain center:", error.message);
  else console.log("✅ Updated Hyderabad domain center to HITEC City / Cyberabad (17.4399, 78.3750).");
}

main().catch(console.error);
