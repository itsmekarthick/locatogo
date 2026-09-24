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

const EXPANDED_METRO_DOMAINS = [
  {
    name: "Paris",
    slug: "paris",
    description: "Paris Innovation Capital: Station F, Generative AI frontier labs, deeptech leaders, and French Tech unicorns.",
    default_latitude: 48.8566,
    default_longitude: 2.3522,
    default_zoom: 12,
    timezone: "Europe/Paris",
    city: "Paris",
    country_code: "FR",
    currency: "EUR",
  },
  {
    name: "Amsterdam",
    slug: "amsterdam",
    description: "Amsterdam Tech Hub: Global payments infrastructure, travel tech leaders, open-source innovators, and European HQs.",
    default_latitude: 52.3676,
    default_longitude: 4.9041,
    default_zoom: 12,
    timezone: "Europe/Amsterdam",
    city: "Amsterdam",
    country_code: "NL",
    currency: "EUR",
  },
  {
    name: "Dublin",
    slug: "dublin",
    description: "Dublin Silicon Docks: European headquarters of global tech giants, enterprise SaaS, and Irish scale-ups.",
    default_latitude: 53.3498,
    default_longitude: -6.2603,
    default_zoom: 12,
    timezone: "Europe/Dublin",
    city: "Dublin",
    country_code: "IE",
    currency: "EUR",
  },
  {
    name: "Dubai",
    slug: "dubai",
    description: "Dubai Future District: DIFC FinTech hub, Web3 pioneers, global digital trade, and Middle East headquarters.",
    default_latitude: 25.2048,
    default_longitude: 55.2708,
    default_zoom: 12,
    timezone: "Asia/Dubai",
    city: "Dubai",
    country_code: "AE",
    currency: "AED",
  },
  {
    name: "Tokyo",
    slug: "tokyo",
    description: "Tokyo Tech Metropolis: Shibuya Bit Valley, robotics innovators, gaming giants, and Japanese tech scaleups.",
    default_latitude: 35.6762,
    default_longitude: 139.6503,
    default_zoom: 12,
    timezone: "Asia/Tokyo",
    city: "Tokyo",
    country_code: "JP",
    currency: "JPY",
  },
  {
    name: "Sydney",
    slug: "sydney",
    description: "Sydney Silicon Harbour: Tech Central, collaboration SaaS unicorns, consumer fintech, and Australasian tech leaders.",
    default_latitude: -33.8688,
    default_longitude: 151.2093,
    default_zoom: 12,
    timezone: "Australia/Sydney",
    city: "Sydney",
    country_code: "AU",
    currency: "AUD",
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

  for (const metro of EXPANDED_METRO_DOMAINS) {
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
        settings_json: { currency: metro.currency, country_code: metro.country_code, source: "expanded-tech-catalog" },
      },
      { onConflict: "domain_id" }
    );

    if (sErr) {
      console.error(`Failed to upsert settings for ${metro.name}:`, sErr);
    } else {
      console.log(`✅ Configured expanded domain: ${metro.name} (${domain.id})`);
    }
  }
}

main().catch(console.error);
