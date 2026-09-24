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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const GLOBAL_METRO_DOMAINS = [
  {
    name: "Chicago",
    slug: "chicago",
    description: "Chicago Tech Hub: Leading enterprise software, logistics tech, B2B SaaS, and FinTech across the Windy City.",
    default_latitude: 41.8781,
    default_longitude: -87.6298,
    default_zoom: 11,
    timezone: "America/Chicago",
    city: "Chicago",
    country_code: "US",
    currency: "USD",
  },
  {
    name: "Denver",
    slug: "denver",
    description: "Denver & Boulder Innovation Corridor: Cloud infrastructure, SaaS unicorns, cybersecurity, and outdoor tech.",
    default_latitude: 39.7392,
    default_longitude: -104.9903,
    default_zoom: 11,
    timezone: "America/Denver",
    city: "Denver",
    country_code: "US",
    currency: "USD",
  },
  {
    name: "Atlanta",
    slug: "atlanta",
    description: "Atlanta Tech Hub: FinTech powerhouse, sales enablement leaders, data privacy unicorns, and Midtown innovation.",
    default_latitude: 33.7490,
    default_longitude: -84.3880,
    default_zoom: 11,
    timezone: "America/New_York",
    city: "Atlanta",
    country_code: "US",
    currency: "USD",
  },
  {
    name: "San Diego",
    slug: "san-diego",
    description: "San Diego Tech Coast: Security automation, productivity platforms, biotech, and Southern California innovation.",
    default_latitude: 32.7157,
    default_longitude: -117.1611,
    default_zoom: 11,
    timezone: "America/Los_Angeles",
    city: "San Diego",
    country_code: "US",
    currency: "USD",
  },
  {
    name: "London",
    slug: "london",
    description: "London Tech Capital: European FinTech epicenter, Generative AI leaders, marketplace unicorns, and Silicon Roundabout.",
    default_latitude: 51.5074,
    default_longitude: -0.1278,
    default_zoom: 12,
    timezone: "Europe/London",
    city: "London",
    country_code: "GB",
    currency: "GBP",
  },
  {
    name: "Toronto",
    slug: "toronto",
    description: "Toronto Innovation Corridor: Pioneer AI labs, next-gen FinTech, adtech platforms, and Canadian tech leaders.",
    default_latitude: 43.6532,
    default_longitude: -79.3832,
    default_zoom: 12,
    timezone: "America/Toronto",
    city: "Toronto",
    country_code: "CA",
    currency: "CAD",
  },
  {
    name: "Berlin",
    slug: "berlin",
    description: "Berlin Startup Hub: European digital banking, e-commerce scaleups, travel tech, and creative tech ventures.",
    default_latitude: 52.5200,
    default_longitude: 13.4050,
    default_zoom: 12,
    timezone: "Europe/Berlin",
    city: "Berlin",
    country_code: "DE",
    currency: "EUR",
  },
  {
    name: "Singapore",
    slug: "singapore",
    description: "Singapore Global Gateway: Southeast Asia FinTech, digital banking, global cross-border payments, and APAC HQs.",
    default_latitude: 1.3521,
    default_longitude: 103.8198,
    default_zoom: 12,
    timezone: "Asia/Singapore",
    city: "Singapore",
    country_code: "SG",
    currency: "SGD",
  },
];

async function main() {
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", "karthick")
    .single();

  if (tErr || !tenant) {
    throw new Error(`Tenant 'karthick' not found: ${tErr?.message}`);
  }
  console.log(`Found tenant ${tenant.name} (${tenant.id})`);

  for (const metro of GLOBAL_METRO_DOMAINS) {
    const { data: domain, error: dErr } = await supabase
      .from("domains")
      .upsert(
        {
          tenant_id: tenant.id,
          name: metro.name,
          slug: metro.slug,
          description: metro.description,
          default_latitude: metro.default_latitude,
          default_longitude: metro.default_longitude,
          default_zoom: metro.default_zoom,
          status: "published",
        },
        { onConflict: "tenant_id,slug" }
      )
      .select("id")
      .single();

    if (dErr || !domain) {
      console.error(`Failed to upsert domain ${metro.name}:`, dErr);
      continue;
    }

    const { error: sErr } = await supabase.from("directory_settings").upsert(
      {
        domain_id: domain.id,
        default_timezone: metro.timezone,
        default_language: "en",
        geographic_scope_type: "city",
        geographic_scope_json: { city: metro.city, country_code: metro.country_code },
        settings_json: { currency: metro.currency, country_code: metro.country_code, source: "global-tech-catalog" },
      },
      { onConflict: "domain_id" }
    );

    if (sErr) {
      console.error(`Failed to upsert settings for ${metro.name}:`, sErr);
    } else {
      console.log(`✅ Configured global domain: ${metro.name} (${domain.id})`);
    }
  }
}

main().catch(console.error);
