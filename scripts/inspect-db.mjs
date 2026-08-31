import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Parse .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function inspectDb() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const [
    { count: listingsCount, data: sampleListings },
    { count: categoriesCount, data: sampleCategories },
    { count: domainsCount, data: sampleDomains },
    { count: tenantsCount, data: tenants },
  ] = await Promise.all([
    supabase.from("listings").select("id, title, locality, status", { count: "exact" }).limit(10),
    supabase.from("categories").select("id, name, slug", { count: "exact" }),
    supabase.from("domains").select("id, name, slug", { count: "exact" }),
    supabase.from("tenants").select("id, name", { count: "exact" }),
  ]);

  console.log("=== Current Database State ===");
  console.log(`- Tenants (${tenantsCount}):`, tenants);
  console.log(`- Domains (${domainsCount}):`, sampleDomains);
  console.log(`- Categories (${categoriesCount}):`, sampleCategories);
  console.log(`- Listings (${listingsCount}):`, sampleListings);
}

inspectDb();
