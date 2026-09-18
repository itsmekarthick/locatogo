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

const HUBS = [
  { id: "bengaluru", name: "Bengaluru" },
  { id: "hyderabad", name: "Hyderabad" },
  { id: "delhi-ncr", name: "Delhi NCR" },
  { id: "mumbai", name: "Mumbai" },
  { id: "chennai", name: "Chennai" },
  { id: "pune", name: "Pune" },
  { id: "kolkata", name: "Kolkata" },
  { id: "kochi", name: "Kochi" },
];

async function run() {
  for (const hub of HUBS) {
    let query = supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "published").not("company_type", "is", null);
    if (hub.id === "bengaluru") {
      query = query.or("city.ilike.%bangalore%,city.ilike.%bengaluru%");
    } else if (hub.id === "delhi-ncr") {
      query = query.or("city.ilike.%delhi%,city.ilike.%gurugram%,city.ilike.%noida%");
    } else {
      query = query.ilike("city", `%${hub.name}%`);
    }
    const { count } = await query;
    console.log(`  ${hub.name.padEnd(12)}: ${count} companies`);
  }
}

run();
