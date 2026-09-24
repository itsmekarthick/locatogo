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

const US_METRO_DOMAINS = [
  {
    name: "Silicon Valley & SF",
    slug: "siliconvalley",
    description: "Silicon Valley & San Francisco Tech Directory: Leading AI labs, SaaS unicorns, and venture-backed startups.",
    default_latitude: 37.7749,
    default_longitude: -122.4194,
    default_zoom: 11,
    timezone: "America/Los_Angeles",
    city: "San Francisco",
  },
  {
    name: "New York City",
    slug: "new-york",
    description: "New York City Tech Hub: FinTech, enterprise software, media tech, and scale-ups across Silicon Alley.",
    default_latitude: 40.7128,
    default_longitude: -74.006,
    default_zoom: 11,
    timezone: "America/New_York",
    city: "New York",
  },
  {
    name: "Seattle",
    slug: "seattle",
    description: "Seattle Tech Directory: Cloud computing giants, AI innovators, and enterprise software across the Pacific Northwest.",
    default_latitude: 47.6062,
    default_longitude: -122.3321,
    default_zoom: 11,
    timezone: "America/Los_Angeles",
    city: "Seattle",
  },
  {
    name: "Austin",
    slug: "austin",
    description: "Austin Silicon Hills: Leading SaaS, hardware, semiconductor, and fast-growing tech ventures.",
    default_latitude: 30.2672,
    default_longitude: -97.7431,
    default_zoom: 11,
    timezone: "America/Chicago",
    city: "Austin",
  },
  {
    name: "Boston",
    slug: "boston",
    description: "Boston Tech & Innovation Hub: Robotics, biotech, enterprise SaaS, and Cambridge university spin-outs.",
    default_latitude: 42.3601,
    default_longitude: -71.0589,
    default_zoom: 11,
    timezone: "America/New_York",
    city: "Boston",
  },
  {
    name: "Los Angeles",
    slug: "los-angeles",
    description: "Silicon Beach & Los Angeles: Consumer tech, gaming, entertainment technology, and venture startups.",
    default_latitude: 34.0522,
    default_longitude: -118.2437,
    default_zoom: 11,
    timezone: "America/Los_Angeles",
    city: "Los Angeles",
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

  for (const metro of US_METRO_DOMAINS) {
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
        geographic_scope_json: { city: metro.city, country_code: "US" },
        settings_json: { currency: "USD", country_code: "US", source: "us-tech-catalog" },
      },
      { onConflict: "domain_id" }
    );

    if (sErr) {
      console.error(`Failed to upsert settings for ${metro.name}:`, sErr);
    } else {
      console.log(`✅ Configured US domain: ${metro.name} (${domain.id})`);
    }
  }
}

main().catch(console.error);
