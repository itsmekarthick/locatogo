import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import { detectBoard, fetchJobs, ExternalJob } from "../../src/lib/jobs/providers";
import { Tier1CompanyRecord } from "./tier1-tech-catalog";

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

const MAX_JOBS_PER_COMPANY = 200;

export const AI_TIER1_COMPANIES: Record<string, Tier1CompanyRecord[]> = {
  siliconvalley: [
    {
      title: "Anthropic",
      slug: "anthropic",
      short_description: "AI safety and research company behind Claude, building reliable, interpretable, and steerable AI systems.",
      website: "https://anthropic.com",
      careers_url: "https://boards.greenhouse.io/anthropic",
      address_line_1: "500 Howard St",
      locality: "SoMa",
      city: "San Francisco",
      state: "CA",
      postal_code: "94105",
      country_code: "US",
      latitude: 37.7885,
      longitude: -122.3965,
      company_type: "startup",
      funding_stage: "Unicorn",
    },
    {
      title: "OpenAI",
      slug: "openai",
      short_description: "AI research and deployment company behind ChatGPT, GPT-4, and Sora, dedicated to building safe AGI.",
      website: "https://openai.com",
      careers_url: "https://jobs.ashbyhq.com/openai",
      address_line_1: "3180 18th St",
      locality: "Mission District",
      city: "San Francisco",
      state: "CA",
      postal_code: "94110",
      country_code: "US",
      latitude: 37.7618,
      longitude: -122.4173,
      company_type: "startup",
      funding_stage: "Unicorn",
    },
    {
      title: "Perplexity",
      slug: "perplexity",
      short_description: "Next-generation conversational AI answer engine redefining search with real-time sources and direct citations.",
      website: "https://perplexity.ai",
      careers_url: "https://jobs.ashbyhq.com/perplexity",
      address_line_1: "548 Market St",
      locality: "Financial District",
      city: "San Francisco",
      state: "CA",
      postal_code: "94104",
      country_code: "US",
      latitude: 37.7898,
      longitude: -122.4012,
      company_type: "startup",
      funding_stage: "Unicorn",
    },
    {
      title: "Stripe",
      slug: "stripe",
      short_description: "Financial infrastructure for the internet, powering billions in payments for companies of all sizes.",
      website: "https://stripe.com",
      careers_url: "https://boards.greenhouse.io/stripe",
      address_line_1: "354 Oyster Point Blvd",
      locality: "South San Francisco",
      city: "South San Francisco",
      state: "CA",
      postal_code: "94080",
      country_code: "US",
      latitude: 37.6631,
      longitude: -122.3855,
      company_type: "product_saas",
      funding_stage: "Unicorn",
    },
    {
      title: "Palantir",
      slug: "palantir",
      short_description: "Foundational data analytics and AI operations platforms (Foundry, Gotham, AIP) for government and global enterprises.",
      website: "https://palantir.com",
      careers_url: "https://jobs.lever.co/palantir",
      address_line_1: "100 Hamilton Ave",
      locality: "Downtown Palo Alto",
      city: "Palo Alto",
      state: "CA",
      postal_code: "94301",
      country_code: "US",
      latitude: 37.4443,
      longitude: -122.1601,
      company_type: "product_saas",
      funding_stage: "Public",
    },
    {
      title: "Coinbase",
      slug: "coinbase",
      short_description: "Leading cryptocurrency and web3 platform building an open financial system for the decentralized digital economy.",
      website: "https://coinbase.com",
      careers_url: "https://boards.greenhouse.io/coinbase",
      address_line_1: "548 Market St",
      locality: "Financial District",
      city: "San Francisco",
      state: "CA",
      postal_code: "94104",
      country_code: "US",
      latitude: 37.7901,
      longitude: -122.4015,
      company_type: "product_saas",
      funding_stage: "Public",
    },
    {
      title: "Airbnb",
      slug: "airbnb",
      short_description: "Online marketplace connecting travelers with unique accommodations and curated experiences globally.",
      website: "https://airbnb.com",
      careers_url: "https://boards.greenhouse.io/airbnb",
      address_line_1: "888 Brannan St",
      locality: "SoMa",
      city: "San Francisco",
      state: "CA",
      postal_code: "94103",
      country_code: "US",
      latitude: 37.7717,
      longitude: -122.4052,
      company_type: "product_saas",
      funding_stage: "Public",
    },
    {
      title: "Pinterest",
      slug: "pinterest",
      short_description: "Visual discovery engine where hundreds of millions find inspiration, curate ideas, and shop.",
      website: "https://pinterest.com",
      careers_url: "https://boards.greenhouse.io/pinterest",
      address_line_1: "505 Brannan St",
      locality: "SoMa",
      city: "San Francisco",
      state: "CA",
      postal_code: "94107",
      country_code: "US",
      latitude: 37.7766,
      longitude: -122.3995,
      company_type: "product_saas",
      funding_stage: "Public",
    },
    {
      title: "Roblox",
      slug: "roblox",
      short_description: "Immersive 3D creation platform and virtual universe connecting over 70 million daily active creators and players.",
      website: "https://roblox.com",
      careers_url: "https://boards.greenhouse.io/roblox",
      address_line_1: "970 Park Pl",
      locality: "San Mateo",
      city: "San Mateo",
      state: "CA",
      postal_code: "94403",
      country_code: "US",
      latitude: 37.5451,
      longitude: -122.2988,
      company_type: "product_saas",
      funding_stage: "Public",
    },
    {
      title: "Okta",
      slug: "okta",
      short_description: "World's leading independent identity cloud and access management solution securing enterprise workforces.",
      website: "https://okta.com",
      careers_url: "https://boards.greenhouse.io/okta",
      address_line_1: "100 1st St",
      locality: "Financial District",
      city: "San Francisco",
      state: "CA",
      postal_code: "94105",
      country_code: "US",
      latitude: 37.7905,
      longitude: -122.3982,
      company_type: "product_saas",
      funding_stage: "Public",
    },
    {
      title: "Twilio",
      slug: "twilio",
      short_description: "Customer engagement platform and cloud communications API powerhouse powering SMS, Voice, and Video.",
      website: "https://twilio.com",
      careers_url: "https://boards.greenhouse.io/twilio",
      address_line_1: "101 Spear St",
      locality: "Financial District",
      city: "San Francisco",
      state: "CA",
      postal_code: "94105",
      country_code: "US",
      latitude: 37.7925,
      longitude: -122.3929,
      company_type: "product_saas",
      funding_stage: "Public",
    },
  ],

  london: [
    {
      title: "Monzo",
      slug: "monzo",
      short_description: "Digital mobile bank making money work for everyone with instant spending notifications and smart budgeting.",
      website: "https://monzo.com",
      careers_url: "https://boards.greenhouse.io/monzo",
      address_line_1: "Broadwalk House, 5 Appold St",
      locality: "City of London",
      city: "London",
      state: "England",
      postal_code: "EC2A 2DA",
      country_code: "GB",
      latitude: 51.5204,
      longitude: -0.0818,
      company_type: "startup",
      funding_stage: "Unicorn",
    },
    {
      title: "Deliveroo",
      slug: "deliveroo",
      short_description: "On-demand food and grocery logistics marketplace delivering from the best local restaurants across Europe and Asia.",
      website: "https://deliveroo.co.uk",
      careers_url: "https://boards.greenhouse.io/deliveroo",
      address_line_1: "1 Cousin Ln",
      locality: "City of London",
      city: "London",
      state: "England",
      postal_code: "EC4R 3TE",
      country_code: "GB",
      latitude: 51.5108,
      longitude: -0.0913,
      company_type: "product_saas",
      funding_stage: "Public",
    },
  ],

  paris: [
    {
      title: "Qonto",
      slug: "qonto",
      short_description: "Leading European business finance solution empowering SMEs and freelancers with modern banking and invoicing.",
      website: "https://qonto.com",
      careers_url: "https://jobs.ashbyhq.com/qonto",
      address_line_1: "18 Rue de Navarin",
      locality: "9th Arrondissement",
      city: "Paris",
      state: "Île-de-France",
      postal_code: "75009",
      country_code: "FR",
      latitude: 48.8784,
      longitude: 2.3392,
      company_type: "startup",
      funding_stage: "Unicorn",
    },
  ],
};

async function getContext() {
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", "karthick")
    .single();

  if (tErr || !tenant) {
    throw new Error(`Tenant 'karthick' not found: ${tErr?.message}`);
  }

  const { data: category, error: cErr } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("tenant_id", tenant.id)
    .eq("slug", "tech-coworking")
    .single();

  if (cErr || !category) {
    throw new Error(`Category 'tech-coworking' not found for tenant: ${cErr?.message}`);
  }

  const { data: domains, error: dErr } = await supabase
    .from("domains")
    .select("id, name, slug")
    .eq("tenant_id", tenant.id);

  if (dErr || !domains) {
    throw new Error(`Failed to load domains: ${dErr?.message}`);
  }

  const domainMap = new Map<string, string>();
  for (const d of domains) {
    domainMap.set(d.slug, d.id);
  }

  return { tenantId: tenant.id, categoryId: category.id, domainMap };
}

async function ingestCompany(
  supabase: SupabaseClient,
  tenantId: string,
  domainId: string,
  categoryId: string,
  company: Tier1CompanyRecord
): Promise<{ listingId: string; jobsCount: number }> {
  // 1. Upsert Listing
  const listingData = {
    tenant_id: tenantId,
    domain_id: domainId,
    category_id: categoryId,
    title: company.title,
    slug: company.slug,
    short_description: company.short_description,
    description: `${company.title} is a leading ${company.company_type.replace(/_/g, " ")} organization located in ${company.city}, ${company.state || company.country_code}.`,
    address_line_1: company.address_line_1,
    locality: company.locality,
    city: company.city,
    administrative_area: company.state,
    postal_code: company.postal_code,
    country_code: company.country_code,
    latitude: company.latitude,
    longitude: company.longitude,
    website: company.website,
    careers_url: company.careers_url,
    status: "published",
    verification_status: "verified",
    company_type: company.company_type,
    funding_stage: company.funding_stage,
    updated_at: new Date().toISOString(),
  };

  const { data: savedListing, error: upsertErr } = await supabase
    .from("listings")
    .upsert(listingData, { onConflict: "domain_id,slug" })
    .select("id")
    .single();

  if (upsertErr || !savedListing) {
    throw new Error(`Failed to upsert listing for ${company.title}: ${upsertErr?.message}`);
  }

  const listingId = savedListing.id;

  // 2. Fetch Live ATS Jobs
  let rawJobs: ExternalJob[] = [];
  const board = detectBoard(company.careers_url);

  if (board) {
    try {
      rawJobs = await fetchJobs(board);
    } catch (err: any) {
      console.warn(`   ⚠️  ATS error for ${company.title} (${board.provider}): ${err.message}`);
    }
  }

  const validJobs = rawJobs.filter((j) => {
    if (!j.title || !j.applyUrl) return false;
    const url = j.applyUrl.trim();
    if (url === "#" || url === "" || url === company.website) return false;
    return true;
  });

  const jobsToInsert = validJobs.slice(0, MAX_JOBS_PER_COMPANY);

  // 3. Clear existing company_jobs and insert fresh
  await supabase.from("company_jobs").delete().eq("listing_id", listingId);

  if (jobsToInsert.length > 0) {
    const jobRows = jobsToInsert.map((j) => ({
      tenant_id: tenantId,
      listing_id: listingId,
      title: j.title.trim(),
      department: j.department || "Engineering",
      location_name: j.locationName || `${company.city}, ${company.country_code}`,
      workplace_type: j.workplaceType || "hybrid",
      experience_level: "mid",
      apply_url: j.applyUrl.trim(),
      ats_job_id: board ? `${board.provider}:${j.providerJobId}` : `ats:${j.providerJobId}`,
      posted_at: j.postedAt || new Date().toISOString(),
      is_active: true,
      last_synced_at: new Date().toISOString(),
    }));

    for (let i = 0; i < jobRows.length; i += 50) {
      const chunk = jobRows.slice(i, i + 50);
      const { error: insErr } = await supabase.from("company_jobs").insert(chunk);
      if (insErr) {
        console.error(`   ❌ Failed to insert jobs chunk for ${company.title}:`, insErr.message);
      }
    }
  }

  // 4. Update active_jobs_count
  await supabase
    .from("listings")
    .update({
      active_jobs_count: jobsToInsert.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  return { listingId, jobsCount: jobsToInsert.length };
}

async function main() {
  console.log("===============================================================");
  console.log("🚀 CRAWLING & PUSHING AI LEADERS & GLOBAL TECH GIANTS");
  console.log("===============================================================\n");

  const { tenantId, categoryId, domainMap } = await getContext();
  const metros = Object.keys(AI_TIER1_COMPANIES);

  let grandTotalCompanies = 0;
  let grandTotalJobs = 0;

  for (const metro of metros) {
    const companies = AI_TIER1_COMPANIES[metro];
    const domainId = domainMap.get(metro);
    if (!domainId) {
      console.warn(`⚠️ Domain for ${metro} not found in database, skipping`);
      continue;
    }

    console.log(`\n📍 Metro: [${metro.toUpperCase()}] (${companies.length} companies)`);
    for (const comp of companies) {
      process.stdout.write(`   - ${comp.title} (${comp.city}, ${comp.country_code})... `);
      try {
        const res = await ingestCompany(supabase, tenantId, domainId, categoryId, comp);
        grandTotalCompanies++;
        grandTotalJobs += res.jobsCount;
        console.log(`✅ ${res.jobsCount} live jobs synced!`);
      } catch (err: any) {
        console.log(`❌ Failed: ${err.message}`);
      }
    }
  }

  console.log("\n===============================================================");
  console.log(`🎉 AI LEADERS & TECH GIANTS BATCH COMPLETED!`);
  console.log(`🏢 Total Companies Pushed: ${grandTotalCompanies}`);
  console.log(`💼 Total Live Jobs Pushed:  ${grandTotalJobs}`);
  console.log("===============================================================\n");
}

main().catch(console.error);
