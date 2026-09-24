import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env: Record<string, string> = {};
fs.readFileSync(".env", "utf8")
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixCountries() {
  console.log("Checking listings country codes...");

  // Update Indian metro listings that have null country_code
  const { data: updatedIn, error: inErr } = await supabase
    .from("listings")
    .update({ country_code: "IN" })
    .is("country_code", null)
    .select("id");

  if (inErr) {
    console.error("Error setting IN country_code:", inErr);
  } else {
    console.log(`✅ Set country_code = 'IN' for ${updatedIn?.length || 0} listings with null country.`);
  }

  // Double check all listings by country
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, city, country_code");

  const countryCounts: Record<string, number> = {};
  listings?.forEach((l) => {
    const cc = (l.country_code || "NULL").toUpperCase();
    countryCounts[cc] = (countryCounts[cc] || 0) + 1;
  });

  console.log("📊 Final Listing Counts by Country:", countryCounts);
}

fixCountries().catch(console.error);
