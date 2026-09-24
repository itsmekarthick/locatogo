import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// 1. Environment initialization
const env: Record<string, string> = {};
const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
fs.readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^['\"]|['\"]$/g, "");
  });

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Seed data generators for realistic localized company generation
interface HubProfileConfig {
  slug: string;
  name: string;
  city: string;
  state: string;
  country_code: string;
  postalPrefix: string;
  latRange: [number, number];
  lngRange: [number, number];
  localities: string[];
  streets: string[];
  prefixes: string[];
  roots: string[];
  suffixes: string[];
  domains: string[];
  focusAreas: string[];
}

const HUB_CONFIGS: Record<string, HubProfileConfig> = {
  siliconvalley: {
    slug: "siliconvalley",
    name: "Silicon Valley & SF",
    city: "San Francisco",
    state: "CA",
    country_code: "US",
    postalPrefix: "9410",
    latRange: [37.74, 37.81],
    lngRange: [-122.44, -122.38],
    localities: [
      "SoMa",
      "Financial District",
      "Mission District",
      "South Park",
      "Dogpatch",
      "Potrero Hill",
      "Design District",
      "Union Square",
      "Jackson Square",
      "Hayes Valley",
    ],
    streets: [
      "Market St",
      "Howard St",
      "Folsom St",
      "Mission St",
      "Townsend St",
      "Brannan St",
      "Spear St",
      "Montgomery St",
      "Bush St",
      "2nd St",
      "3rd St",
      "California St",
      "Pine St",
      "Harrison St",
      "Bryant St",
    ],
    prefixes: [
      "Hyper", "Tensor", "Neural", "Axiom", "Quanta", "Vector", "Apex", "Prism", "Nexus", "Vertex",
      "Kinetic", "Strata", "Lattice", "Cortex", "Pulse", "Omni", "Synthetix", "Cognitive", "Cipher",
      "Nova", "Chroma", "Zero", "Flux", "Aura", "Meta", "Alpha", "Stellar", "Spectral", "Infra", "Foundry",
    ],
    roots: [
      "Scale", "Logic", "Data", "Cloud", "Graph", "Flow", "Mind", "Grid", "Matrix", "Wave",
      "Stack", "Code", "Link", "Vault", "Point", "Base", "Core", "Engine", "Mesh", "Trace",
      "Node", "Layer", "Orbit", "Sync", "Stream", "Forge", "Hub", "Signal", "Byte", "Edge",
    ],
    suffixes: [
      "AI", "Labs", "Tech", "Systems", "Networks", "HQ", "Software", "Cloud", "Platform",
      "Intelligence", "Dynamics", "Robotics", "Compute", "Studio", "Applied", "Technologies",
    ],
    domains: [".ai", ".io", ".com", ".co", ".dev", ".tech"],
    focusAreas: [
      "Autonomous Agent Platform",
      "Foundation Model Fine-Tuning",
      "GPU Cluster Orchestration",
      "Enterprise Vector Search",
      "Serverless Edge Computing",
      "Automated Code Synthesis",
      "AI Safety & Alignment",
      "Next-Gen Observability",
      "Zero-Trust Cloud Identity",
      "Real-Time Event Streaming",
    ],
  },

  "new-york": {
    slug: "new-york",
    name: "New York City",
    city: "New York",
    state: "NY",
    country_code: "US",
    postalPrefix: "1001",
    latRange: [40.71, 40.78],
    lngRange: [-74.01, -73.96],
    localities: [
      "Silicon Alley",
      "Flatiron District",
      "Chelsea",
      "Midtown Manhattan",
      "SoHo",
      "Tribeca",
      "Hudson Yards",
      "Greenwich Village",
      "Financial District",
      "NoMad",
      "Union Square",
    ],
    streets: [
      "Broadway",
      "5th Ave",
      "Madison Ave",
      "Park Ave",
      "Avenue of the Americas",
      "23rd St",
      "Lafayette St",
      "Hudson St",
      "Varick St",
      "Water St",
      "Wall St",
      "West 14th St",
      "Spring St",
      "Crosby St",
    ],
    prefixes: [
      "Gotham", "Hudson", "Beacon", "Capital", "Anchor", "Crest", "Empire", "Park", "Metro", "Vanguard",
      "Sterling", "Signal", "Union", "Liberty", "Bowery", "Lexington", "Slate", "Sentry", "Cobalt", "Harbor",
      "HighLine", "Gramercy", "Alley", "Trinity", "Manhattan", "Madison", "Avenue", "Bridge", "Monarch", "Crown",
    ],
    roots: [
      "Finance", "Ledger", "Trade", "Wealth", "Market", "Credit", "Pay", "Fund", "Trust", "Vault",
      "Media", "Health", "Care", "Risk", "Clear", "Exchange", "Yield", "Index", "Asset", "Secure",
      "Retail", "Brand", "Insight", "Commerce", "Direct", "Matrix", "Capital", "Prime", "Peak", "Equity",
    ],
    suffixes: [
      "Financial", "Trading", "Capital", "Technologies", "Media", "Analytics", "Health", "Advisors",
      "Partners", "Interactive", "Digital", "Markets", "HQ", "Labs", "Solutions", "Ventures",
    ],
    domains: [".com", ".co", ".io", ".finance", ".ai", ".nyc"],
    focusAreas: [
      "Quantitative Trading Infrastructure",
      "Decentralized Settlement Network",
      "Enterprise Spend & Corporate Cards",
      "Digital Media Asset Management",
      "Clinical Trials Data Intelligence",
      "Commercial Real Estate PropTech",
      "Omnichannel Retail SaaS",
      "Automated Compliance & Risk",
      "B2B Payments Clearinghouse",
      "Predictive Consumer Analytics",
    ],
  },

  london: {
    slug: "london",
    name: "London",
    city: "London",
    state: "England",
    country_code: "GB",
    postalPrefix: "EC",
    latRange: [51.50, 51.54],
    lngRange: [-0.14, -0.06],
    localities: [
      "Tech City / Silicon Roundabout",
      "Shoreditch",
      "Old Street",
      "King's Cross",
      "Clerkenwell",
      "Soho",
      "Fitzrovia",
      "Canary Wharf",
      "Whitechapel",
      "London Bridge",
      "Farringdon",
    ],
    streets: [
      "Shoreditch High St",
      "Old St",
      "City Rd",
      "Silicon Roundabout",
      "King's Cross Rd",
      "Tottenham Court Rd",
      "Chancery Ln",
      "Bishopsgate",
      "Moorgate",
      "Euston Rd",
      "Farringdon Rd",
      "Clerkenwell Rd",
      "Liverpool St",
    ],
    prefixes: [
      "Thames", "Crown", "Guild", "Albion", "Meridian", "Foundry", "Cobblestone", "Borough", "Sterling", "Monarch",
      "Regent", "Spire", "Tower", "Kestrel", "Finovia", "Vauxhall", "Camden", "Mayfair", "Kensington", "Fleet",
      "Saxon", "Windsor", "Piccadilly", "Strand", "Westminster", "Holborn", "Penta", "Omni", "Veloce", "Astra",
    ],
    roots: [
      "Pay", "Bank", "Clear", "Transfer", "Money", "Card", "Vault", "Sovereign", "Climate", "Energy",
      "Carbon", "Health", "Care", "Logistics", "Freight", "Legal", "Policy", "Secure", "Trade", "Invest",
      "Data", "Neural", "Deep", "Insight", "Connect", "Circle", "Cross", "Square", "Sphere", "Wave",
    ],
    suffixes: [
      "Pay", "Bank", "Technologies", "Capital", "Labs", "Group", "Global", "UK", "Ventures",
      "Digital", "Software", "Networks", "Intelligence", "Consulting", "Dynamics", "Exchange",
    ],
    domains: [".co.uk", ".com", ".io", ".ai", ".tech", ".global"],
    focusAreas: [
      "Cross-Border FX Clearing",
      "Open Banking APIs & PSD2 Engine",
      "Carbon Accounting & ESG Auditing",
      "Healthcare Workforce Scheduling",
      "Next-Gen Neo-Banking Platform",
      "Autonomous Maritime & Freight Logistics",
      "AI-Powered Fraud Prevention",
      "Renewable Energy Grid Trading",
      "InsurTech Underwriting Automation",
      "Decentralized Identity Verification",
    ],
  },

  bangalore: {
    slug: "bangalore",
    name: "Bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    country_code: "IN",
    postalPrefix: "5600",
    latRange: [12.90, 13.04],
    lngRange: [77.56, 77.72],
    localities: [
      "Koramangala",
      "Indiranagar",
      "HSR Layout",
      "Whitefield",
      "Electronic City",
      "Bellandur",
      "Outer Ring Road",
      "Sarjapur Road",
      "Domlur",
      "Marathahalli",
      "JP Nagar",
      "BTM Layout",
    ],
    streets: [
      "100 Feet Rd, Indiranagar",
      "80 Feet Rd, Koramangala",
      "Outer Ring Rd, Bellandur",
      "Sarjapur Main Rd",
      "Whitefield Main Rd",
      "Hosur Rd, Electronic City",
      "HSR Layout Sector 1",
      "HSR Layout Sector 3",
      "HSR Layout Sector 5",
      "Intermediate Ring Rd, Domlur",
      "Old Airport Rd",
      "Kundalahalli Gate",
    ],
    prefixes: [
      "Indus", "Bharat", "Veda", "Kaveri", "Deccan", "Astra", "Garuda", "Pragati", "Shunya", "Chakra",
      "Agni", "Surya", "Dhruv", "Kuber", "Tarang", "Vyom", "Setu", "TechVruksh", "Samarth", "Neev",
      "Arya", "Zenith", "Dravid", "Sankalp", "Udaan", "Rupay", "Kisan", "Gati", "Aarogya", "Mitra",
    ],
    roots: [
      "Pay", "UPI", "Commerce", "Kart", "Mart", "Fast", "Logix", "Freight", "Fleet", "Ride",
      "Fin", "Health", "Care", "Agri", "Crop", "Farm", "Edu", "Learn", "Skill", "Build",
      "Scale", "Cloud", "Stack", "Infra", "Mesh", "Trace", "Secure", "Venture", "Hub", "Engine",
    ],
    suffixes: [
      "Tech", "Pay", "Labs", "Innovations", "Solutions", "Digital", "Networks", "India", "Logistics",
      "AI", "Software", "Enterprises", "Ventures", "Technologies", "Hub", "Systems",
    ],
    domains: [".in", ".co.in", ".com", ".io", ".ai", ".tech"],
    focusAreas: [
      "Unified Payments Interface (UPI) Gateway",
      "Quick Commerce 10-Minute Dark Store Logistics",
      "AgriTech Precision Yield Analytics",
      "Vernacular AI Voice Commerce",
      "Global Capability Center (GCC) Automation",
      "B2B Raw Materials Supply Marketplace",
      "Micro-Lending & Kirana Credit Scoring",
      "EV Fleet Telematics & Battery Swapping",
      "Ayushman Digital Health Mission (ABDM) SaaS",
      "EdTech Adaptive Vernacular Learning",
    ],
  },
};

const JOB_ROLES = [
  { title: "Staff AI Research Engineer", dept: "AI & Machine Learning", exp: "lead" },
  { title: "Senior Full Stack Engineer (Next.js & TypeScript)", dept: "Engineering", exp: "senior" },
  { title: "Distributed Systems Backend Engineer (Go & Rust)", dept: "Engineering", exp: "senior" },
  { title: "Lead Product Designer (Design Systems)", dept: "Product & Design", exp: "lead" },
  { title: "Principal Cloud DevOps & Platform Architect", dept: "Infrastructure", exp: "executive" },
  { title: "Senior Product Manager - Enterprise Platform", dept: "Product", exp: "senior" },
  { title: "AI Data Annotation & Evaluation Lead", dept: "AI & Machine Learning", exp: "mid" },
  { title: "Growth Marketing & SEO Specialist", dept: "Marketing & Growth", exp: "mid" },
  { title: "Enterprise Account Executive (SaaS)", dept: "Sales & Partnerships", exp: "senior" },
  { title: "Junior Software Engineer (Backend)", dept: "Engineering", exp: "entry" },
  { title: "Site Reliability Engineer (Kubernetes)", dept: "Infrastructure", exp: "mid" },
  { title: "Frontend Engineer (React / Tailwind)", dept: "Engineering", exp: "mid" },
];

const WORKPLACE_TYPES = ["remote", "hybrid", "on_site"];
const COMPANY_TYPES = ["product_saas", "startup", "tech_giant_mnc", "deeptech_hardware"];
const FUNDING_STAGES = ["Seed", "Series A", "Series B", "Series C", "Unicorn", "Public", "Bootstrapped"];

function getRandomInRange(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(6));
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getContext() {
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", "karthick")
    .single();

  if (tErr || !tenant) throw new Error(`Tenant karthick error: ${tErr?.message}`);

  const { data: category, error: cErr } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("tenant_id", tenant.id)
    .eq("slug", "tech-coworking")
    .single();

  if (cErr || !category) throw new Error(`Category error: ${cErr?.message}`);

  const { data: domains, error: dErr } = await supabase
    .from("domains")
    .select("id, name, slug")
    .eq("tenant_id", tenant.id);

  if (dErr || !domains) throw new Error(`Domains error: ${dErr?.message}`);

  const domainMap = new Map<string, string>();
  for (const d of domains) domainMap.set(d.slug, d.id);

  return { tenantId: tenant.id, categoryId: category.id, domainMap };
}

async function backfillMissingJobs(tenantId: string, domainId: string) {
  const { data: listings } = await supabase
    .from("listings")
    .select("id, slug, title, active_jobs_count, website, city, country_code")
    .eq("domain_id", domainId);

  if (!listings || listings.length === 0) return;

  const listingIds = listings.map((l) => l.id);
  // Fetch existing jobs in chunks to prevent query param limits
  const listingsWithJobs = new Set<string>();
  for (let i = 0; i < listingIds.length; i += 200) {
    const chunkIds = listingIds.slice(i, i + 200);
    const { data: existingJobs } = await supabase
      .from("company_jobs")
      .select("listing_id")
      .in("listing_id", chunkIds);

    for (const j of existingJobs || []) {
      if (j.listing_id) listingsWithJobs.add(j.listing_id);
    }
  }

  const missing = listings.filter((l) => !listingsWithJobs.has(l.id));
  console.log(`   🔍 Checking jobs: ${listings.length - missing.length} companies have jobs, ${missing.length} need backfill.`);
  if (missing.length === 0) return;

  const jobBatch: any[] = [];
  for (const item of missing) {
    const numJobs = item.active_jobs_count || Math.floor(Math.random() * 5) + 2;
    const shuffledRoles = [...JOB_ROLES].sort(() => 0.5 - Math.random()).slice(0, numJobs);

    for (let j = 0; j < shuffledRoles.length; j++) {
      const role = shuffledRoles[j];
      const roleSlug = generateSlug(role.title);
      const workplace = getRandomItem(WORKPLACE_TYPES);
      const website = item.website || `https://${item.slug}.com`;
      jobBatch.push({
        tenant_id: tenantId,
        listing_id: item.id,
        title: role.title,
        department: role.dept,
        location_name: `${item.city || "San Francisco"}, ${item.country_code || "US"}`,
        workplace_type: workplace,
        experience_level: role.exp,
        apply_url: `${website}/careers/job-${roleSlug}-${j + 1}`,
        ats_job_id: `ats:${item.slug}-${j + 1}`,
        posted_at: new Date(Date.now() - Math.floor(Math.random() * 15 * 86400000)).toISOString(),
        is_active: true,
        last_synced_at: new Date().toISOString(),
      });
    }
  }

  let inserted = 0;
  for (let i = 0; i < jobBatch.length; i += 200) {
    const chunk = jobBatch.slice(i, i + 200);
    const { error: insErr } = await supabase.from("company_jobs").insert(chunk);
    if (!insErr) {
      inserted += chunk.length;
    } else {
      console.error("   ❌ Jobs insert error:", insErr.message);
    }
  }
  console.log(`   💼 Successfully backfilled ${inserted} open jobs for ${missing.length} companies!`);
}

async function scaleHubToTarget(
  tenantId: string,
  categoryId: string,
  domainId: string,
  config: HubProfileConfig,
  targetCount: number = 1010
) {
  // 1. Check existing count
  const { count: currentCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId);

  const existing = currentCount || 0;
  console.log(`\n===============================================================`);
  console.log(`📍 METRO: [${config.name.toUpperCase()}]`);
  console.log(`   Current listings: ${existing} | Target: ${targetCount}`);

  if (existing >= targetCount) {
    console.log(`   ✨ Already has ${existing} listings! (Target reached). Verifying jobs...`);
    await backfillMissingJobs(tenantId, domainId);
    return;
  }

  const needed = targetCount - existing;
  console.log(`   🚀 Generating & inserting ${needed} new tech companies with live jobs...`);

  // Fetch existing slugs to avoid collision
  const { data: existingListings } = await supabase
    .from("listings")
    .select("slug")
    .eq("domain_id", domainId);

  const usedSlugs = new Set<string>((existingListings || []).map((l) => l.slug));

  const listingsToInsert: any[] = [];
  const jobsToInsert: any[] = [];

  let attempts = 0;
  let created = 0;

  while (created < needed && attempts < needed * 4) {
    attempts++;
    const prefix = getRandomItem(config.prefixes);
    const root = getRandomItem(config.roots);
    const suffix = getRandomItem(config.suffixes);
    const domainExt = getRandomItem(config.domains);

    // Combination style: Prefix + Root or Root + Suffix or Prefix + Root + Suffix
    const style = Math.random();
    let compName = "";
    if (style < 0.4) {
      compName = `${prefix} ${root}`;
    } else if (style < 0.8) {
      compName = `${root}${suffix}`;
    } else {
      compName = `${prefix}${root} ${suffix}`;
    }

    const baseSlug = generateSlug(compName);
    const uniqueSlug = usedSlugs.has(baseSlug) ? `${baseSlug}-${attempts}` : baseSlug;
    if (usedSlugs.has(uniqueSlug)) continue;
    usedSlugs.add(uniqueSlug);

    const locality = getRandomItem(config.localities);
    const street = getRandomItem(config.streets);
    const streetNum = Math.floor(Math.random() * 850) + 1;
    const address = `${streetNum} ${street}`;
    const lat = getRandomInRange(config.latRange[0], config.latRange[1]);
    const lng = getRandomInRange(config.lngRange[0], config.lngRange[1]);
    const cleanDomain = baseSlug.replace(/-/g, "");
    const website = `https://www.${cleanDomain}${domainExt}`;
    const careersUrl = `${website}/careers`;
    const postalCode = `${config.postalPrefix}${Math.floor(Math.random() * 89 + 10)}`;
    const focus = getRandomItem(config.focusAreas);
    const companyType = getRandomItem(COMPANY_TYPES);
    const fundingStage = getRandomItem(FUNDING_STAGES);

    // Jobs to create (2 to 8 jobs per company)
    const jobsCount = Math.floor(Math.random() * 7) + 2;

    const listingRecord = {
      tenant_id: tenantId,
      domain_id: domainId,
      category_id: categoryId,
      title: compName,
      slug: uniqueSlug,
      short_description: `${focus} built for high-growth tech enterprises.`,
      description: `${compName} is an innovative ${companyType.replace(/_/g, " ")} organization headquartered in ${locality}, ${config.city}. Specializing in ${focus.toLowerCase()}, the company has raised ${fundingStage} funding to expand its engineering presence.`,
      address_line_1: address,
      locality: locality,
      city: config.city,
      administrative_area: config.state,
      postal_code: postalCode,
      country_code: config.country_code,
      latitude: lat,
      longitude: lng,
      website: website,
      careers_url: careersUrl,
      status: "published",
      verification_status: "verified",
      company_type: companyType,
      funding_stage: fundingStage,
      active_jobs_count: jobsCount,
      updated_at: new Date().toISOString(),
    };

    listingsToInsert.push(listingRecord);
    created++;
  }

  console.log(`   📦 Prepared ${listingsToInsert.length} validated company records.`);

  // Insert listings in chunks of 100
  let insertedCompanies = 0;
  let insertedJobs = 0;

  for (let i = 0; i < listingsToInsert.length; i += 100) {
    const chunk = listingsToInsert.slice(i, i + 100);
    const { data: savedChunk, error: insErr } = await supabase
      .from("listings")
      .upsert(chunk, { onConflict: "domain_id,slug" })
      .select("id, slug, title, active_jobs_count, website, city, country_code");

    if (insErr) {
      console.error(`   ❌ Error inserting chunk ${i}..${i + 100}:`, insErr.message);
      continue;
    }

    insertedCompanies += (savedChunk || []).length;

    // Build jobs for saved chunk
    const jobBatch: any[] = [];
    for (const saved of savedChunk || []) {
      const numJobs = saved.active_jobs_count || 3;
      // pick distinct roles
      const shuffledRoles = [...JOB_ROLES].sort(() => 0.5 - Math.random()).slice(0, numJobs);

      for (let j = 0; j < shuffledRoles.length; j++) {
        const role = shuffledRoles[j];
        const roleSlug = generateSlug(role.title);
        const workplace = getRandomItem(WORKPLACE_TYPES);
        jobBatch.push({
          tenant_id: tenantId,
          listing_id: saved.id,
          title: role.title,
          department: role.dept,
          location_name: `${saved.city}, ${saved.country_code}`,
          workplace_type: workplace,
          experience_level: role.exp,
          apply_url: `${saved.website}/careers/job-${roleSlug}-${j + 1}`,
          ats_job_id: `ats:${saved.slug}-${j + 1}`,
          posted_at: new Date(Date.now() - Math.floor(Math.random() * 15 * 86400000)).toISOString(),
          is_active: true,
          last_synced_at: new Date().toISOString(),
        });
      }
    }

    if (jobBatch.length > 0) {
      for (let jIdx = 0; jIdx < jobBatch.length; jIdx += 200) {
        const jChunk = jobBatch.slice(jIdx, jIdx + 200);
        const { error: jErr } = await supabase.from("company_jobs").insert(jChunk);
        if (jErr) {
          console.error(`   ⚠️ Error inserting jobs chunk:`, jErr.message);
        } else {
          insertedJobs += jChunk.length;
        }
      }
    }

    process.stdout.write(`   ➡️ Progress: ${insertedCompanies}/${listingsToInsert.length} companies | ${insertedJobs} jobs\r`);
  }

  console.log(`\n   ✅ Metro [${config.name}] successfully reached target!`);
  console.log(`   🏢 Companies inserted: ${insertedCompanies}`);
  console.log(`   💼 Open jobs inserted:  ${insertedJobs}`);
}

async function main() {
  console.log("===============================================================");
  console.log("🚀 SCALING FLAGSHIP HUBS TO MINIMUM 1,000+ COMPANIES PER CITY");
  console.log("===============================================================");

  const { tenantId, categoryId, domainMap } = await getContext();

  const hubsToScale: HubProfileConfig[] = [
    HUB_CONFIGS["siliconvalley"],
    HUB_CONFIGS["new-york"],
    HUB_CONFIGS["london"],
    HUB_CONFIGS["bangalore"],
  ];

  for (const hub of hubsToScale) {
    const domainId = domainMap.get(hub.slug);
    if (!domainId) {
      console.warn(`⚠️ Domain ${hub.slug} not found in database!`);
      continue;
    }
    await scaleHubToTarget(tenantId, categoryId, domainId, hub, 1010);
  }

  // Print final summary
  console.log("\n===============================================================");
  console.log("🎉 FLAGSHIP HUBS SCALING COMPLETED!");
  console.log("===============================================================\n");

  for (const hub of hubsToScale) {
    const domainId = domainMap.get(hub.slug);
    if (!domainId) continue;
    const { count: finalCount } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", domainId);

    const { count: jobCount } = await supabase
      .from("company_jobs")
      .select("id, listing!inner(domain_id)", { count: "exact", head: true })
      .eq("listing.domain_id", domainId);

    console.log(`📍 ${hub.name}:`);
    console.log(`   - Total Companies: ${finalCount}`);
    console.log(`   - Total Live Jobs: ${jobCount}`);
  }

  const { count: totalListings } = await supabase.from("listings").select("*", { count: "exact", head: true });
  const { count: totalJobs } = await supabase.from("company_jobs").select("*", { count: "exact", head: true });

  console.log(`\n📊 OVERALL DATABASE TOTALS:`);
  console.log(`   - Grand Total Companies: ${totalListings}`);
  console.log(`   - Grand Total Live Jobs: ${totalJobs}`);
  console.log("===============================================================\n");
}

main().catch(console.error);
