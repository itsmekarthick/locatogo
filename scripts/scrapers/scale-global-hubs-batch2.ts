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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
  seattle: {
    slug: "seattle",
    name: "Seattle",
    city: "Seattle",
    state: "WA",
    country_code: "US",
    postalPrefix: "9810",
    latRange: [47.59, 47.66],
    lngRange: [-122.35, -122.31],
    localities: ["South Lake Union", "Downtown", "Belltown", "Pioneer Square", "Capitol Hill", "Fremont", "Bellevue", "Redmond"],
    streets: ["Westlake Ave", "Boren Ave", "Fairview Ave", "2nd Ave", "Pike St", "Pine St", "4th Ave", "1st Ave", "Mercer St", "Denny Way"],
    prefixes: ["Cascade", "Rainier", "Olympic", "Emerald", "Puget", "Sound", "Evergreen", "Pacific", "Glacier", "Summit", "Timber", "Aura", "Northwest", "Apex", "Vortex"],
    roots: ["Cloud", "Scale", "Compute", "Storage", "Flow", "Data", "Mesh", "Trace", "Logic", "Graph", "Code", "Link", "Vault", "Point", "Base", "Core", "Engine"],
    suffixes: ["Cloud", "Systems", "Technologies", "Labs", "Software", "Networks", "Platform", "Data", "AI", "Enterprises"],
    domains: [".com", ".io", ".ai", ".cloud", ".tech"],
    focusAreas: [
      "Distributed Cloud Storage Architecture",
      "Enterprise Serverless Infrastructure",
      "Autonomous AI Agent Orchestration",
      "Developer Productivity Tooling",
      "Hyperscale Observability & APM",
      "Microservices Service Mesh Security",
    ],
  },

  austin: {
    slug: "austin",
    name: "Austin",
    city: "Austin",
    state: "TX",
    country_code: "US",
    postalPrefix: "7870",
    latRange: [30.25, 30.33],
    lngRange: [-97.76, -97.72],
    localities: ["Downtown Austin", "Silicon Hills", "East Austin", "South Congress", "Domain Northside", "Rainey Street", "Mueller"],
    streets: ["Congress Ave", "6th St", "Cesar Chavez St", "Colorado St", "Lavaca St", "Domain Dr", "Brazos St", "2nd St", "Guadalupe St"],
    prefixes: ["LoneStar", "SiliconHills", "Brazos", "Pecan", "Ranch", "Frontier", "Austin", "Texa", "Apex", "Horizon", "Cactus", "Pinnacle", "Titan", "Ranger"],
    roots: ["Chip", "Silicon", "Foundry", "Semi", "Circuit", "Volt", "Energy", "Power", "Grid", "Space", "Defense", "SaaS", "Pay", "Auto", "Wave"],
    suffixes: ["Semiconductor", "Technologies", "Dynamics", "Systems", "Robotics", "Hardware", "Labs", "Energy", "Enterprises", "Defense"],
    domains: [".com", ".io", ".tech", ".co", ".ai"],
    focusAreas: [
      "Advanced RISC-V Semiconductor Design",
      "Clean Energy Grid Storage Software",
      "Autonomous Defense & Space Avionics",
      "Enterprise Revenue Operations SaaS",
      "Next-Gen EV Telematics Platform",
      "Industrial Edge IoT Processing",
    ],
  },

  boston: {
    slug: "boston",
    name: "Boston",
    city: "Boston",
    state: "MA",
    country_code: "US",
    postalPrefix: "0211",
    latRange: [42.34, 42.37],
    lngRange: [-71.09, -71.04],
    localities: ["Kendall Square", "Seaport Innovation District", "Back Bay", "Financial District", "Fenway", "Downtown Crossing", "Cambridge"],
    streets: ["Main St", "Seaport Blvd", "Summer St", "Boylston St", "Federal St", "Atlantic Ave", "Congress St", "Northern Ave", "Broadway"],
    prefixes: ["Beacon", "Commonwealth", "Charles", "Kendall", "Bay", "Harvard", "Prudential", "Harbor", "Quincy", "Colony", "Heritage", "Providence"],
    roots: ["Bio", "Gene", "Cell", "Therapeutics", "Robot", "Bionic", "Neural", "Care", "Health", "Med", "Surg", "Pharma", "SaaS", "Data", "Cognitive"],
    suffixes: ["Bio", "Therapeutics", "Robotics", "Health", "Medical", "Technologies", "Labs", "LifeSciences", "Analytics", "Enterprises"],
    domains: [".com", ".bio", ".health", ".io", ".ai"],
    focusAreas: [
      "Synthetic Biology Drug Discovery AI",
      "Collaborative Warehouse Robotics",
      "Clinical Genomic Sequencing Platform",
      "Healthcare Payer-Provider Automation",
      "Precision Oncology Biomarker Analytics",
      "Autonomous Surgical Robotics",
    ],
  },

  paris: {
    slug: "paris",
    name: "Paris",
    city: "Paris",
    state: "Île-de-France",
    country_code: "FR",
    postalPrefix: "7500",
    latRange: [48.83, 48.89],
    lngRange: [2.30, 2.39],
    localities: ["Silicon Sentier", "Station F / 13th", "9th Arrondissement", "2nd Arrondissement", "Le Marais", "Montparnasse", "La Défense"],
    streets: ["Rue du Sentier", "Boulevard Haussmann", "Boulevard Voltaire", "Rue de Rivoli", "Avenue de l'Opéra", "Rue Réaumur", "Rue Saint-Honoré"],
    prefixes: ["Lumiere", "Seine", "Haussmann", "Eiffel", "Montmartre", "Sentier", "Hexagone", "Concorde", "Bastille", "Gaul", "Veloce", "Aura", "Palais"],
    roots: ["Intelligence", "Neural", "Model", "Pay", "Bank", "Care", "Health", "Luxe", "Moda", "Climat", "Vert", "Logix", "Cloud", "Data"],
    suffixes: ["AI", "Technologies", "Digital", "Solutions", "France", "Europe", "Labs", "Platform", "Enterprises", "Studio"],
    domains: [".fr", ".com", ".ai", ".io", ".eu"],
    focusAreas: [
      "Open-Weights Foundation Model Research",
      "European FinTech & SME Invoicing",
      "Luxury Brand Omnichannel Commerce",
      "Industrial Carbon Tracking & ESG SaaS",
      "Healthcare Workforce Optimization",
      "Generative 3D Asset Creation",
    ],
  },

  berlin: {
    slug: "berlin",
    name: "Berlin",
    city: "Berlin",
    state: "Berlin",
    country_code: "DE",
    postalPrefix: "1011",
    latRange: [52.49, 52.54],
    lngRange: [13.36, 13.45],
    localities: ["Mitte", "Kreuzberg", "Friedrichshain", "Prenzlauer Berg", "Charlottenburg", "Neukölln"],
    streets: ["Torstraße", "Friedrichstraße", "Warschauer Str", "Oranienstraße", "Kastanienallee", "Unter den Linden", "Rosenthaler Str", "Invalidenstraße"],
    prefixes: ["Spree", "Brandenburg", "Allee", "Bär", "Mitte", "Hansa", "Kreuz", "Kaiser", "Tempo", "Kraft", "Velo", "Blitz", "Stern"],
    roots: ["Bank", "Pay", "Trade", "Invest", "Crypto", "Volt", "Solar", "Energy", "Logix", "Freight", "Delivery", "SaaS", "Stack", "Dev"],
    suffixes: ["Technologies", "Digital", "GmbH", "Labs", "Ventures", "Mobility", "Energy", "Europe", "Cloud", "Solutions"],
    domains: [".de", ".com", ".io", ".ai", ".eu"],
    focusAreas: [
      "Commission-Free Micro-Investing Platform",
      "Renewable Energy Grid Flexibility Trading",
      "Autonomous European Freight Forwarding",
      "Developer Microservices Orchestration",
      "Digital Asset Custody & Settlement",
      "B2B Subscription Management Infrastructure",
    ],
  },

  amsterdam: {
    slug: "amsterdam",
    name: "Amsterdam",
    city: "Amsterdam",
    state: "North Holland",
    country_code: "NL",
    postalPrefix: "1017",
    latRange: [52.33, 52.39],
    lngRange: [4.86, 4.93],
    localities: ["Centrum", "Zuidas", "De Pijp", "Oud-Zuid", "Amsterdam Noord", "Oost"],
    streets: ["Singel", "Herengracht", "Keizersgracht", "Gustav Mahlerlaan", "Claude Debussylaan", "Overhoeksplein", "Prinsengracht", "Weesperzijde"],
    prefixes: ["Canal", "Zuidas", "Holland", "Tulip", "Orange", "Delta", "Dam", "Windmill", "Amstel", "Vondel", "Nordic", "Penta"],
    roots: ["Pay", "Clear", "Transfer", "Trade", "Design", "Canvas", "Flow", "Board", "Collab", "Yield", "Agri", "Green", "Logix", "Port"],
    suffixes: ["Payments", "Interactive", "Technologies", "Global", "Labs", "Platform", "BV", "Ventures", "Digital", "Software"],
    domains: [".nl", ".com", ".io", ".ai", ".eu"],
    focusAreas: [
      "Omnichannel Point-of-Sale Payment Processing",
      "Real-Time Collaborative Visual Canvas",
      "Automated Greenhouse Hydroponic IoT",
      "Circular Supply Chain Traceability",
      "Decentralized FX Liquidity Aggregation",
      "Cross-Border VAT Automation SaaS",
    ],
  },

  toronto: {
    slug: "toronto",
    name: "Toronto",
    city: "Toronto",
    state: "ON",
    country_code: "CA",
    postalPrefix: "M5V ",
    latRange: [43.63, 43.68],
    lngRange: [-79.42, -79.36],
    localities: ["Downtown Toronto", "King West", "Financial District", "Liberty Village", "Waterfront", "Yorkville", "North York"],
    streets: ["King St W", "Queen St W", "Bay St", "Yonge St", "University Ave", "Front St W", "Wellington St W", "Spadina Ave", "Adelaide St W"],
    prefixes: ["Maple", "Ontario", "GreatLakes", "Boreal", "BayStreet", "CN", "Frontier", "TrueNorth", "Summit", "Polaris", "York", "Arcadia"],
    roots: ["Security", "Vault", "Key", "Pass", "Auth", "AI", "Cognitive", "Neural", "Health", "Care", "Med", "Pay", "Fund", "Trade", "Shop"],
    suffixes: ["Security", "Technologies", "Capital", "Labs", "AI", "Enterprises", "Digital", "Software", "Solutions", "Networks"],
    domains: [".ca", ".com", ".io", ".ai", ".tech"],
    focusAreas: [
      "Zero-Knowledge Credential Vault Security",
      "Medical Image AI Diagnostic Screening",
      "Automated Merchant E-Commerce Logistics",
      "Quantum Annealing Algorithm Optimization",
      "Autonomous Wealth Portfolio Rebalancing",
      "Enterprise Identity & Access Governance",
    ],
  },

  singapore: {
    slug: "singapore",
    name: "Singapore",
    city: "Singapore",
    state: "Singapore",
    country_code: "SG",
    postalPrefix: "0189",
    latRange: [1.27, 1.32],
    lngRange: [103.82, 103.87],
    localities: ["Marina Bay", "Tanjong Pagar", "Raffles Place", "One-North", "Bugis", "Clarke Quay", "Jurong East"],
    streets: ["Marina Blvd", "Robinson Rd", "Cecil St", "Shenton Way", "Fusionopolis Way", "Biopolis Way", "Battery Rd", "Cross St", "Collyer Quay"],
    prefixes: ["Merlion", "Singa", "Straits", "Temasek", "Equator", "Marina", "Raffles", "Island", "Apex", "Horizon", "Silk", "Pacifica", "Banyan"],
    roots: ["Pay", "Fin", "Wealth", "Trade", "Port", "Cargo", "Logix", "Freight", "Ship", "Super", "App", "Ride", "Food", "Cloud", "Secure"],
    suffixes: ["Fintech", "Technologies", "Holdings", "Global", "Asia", "Labs", "Digital", "Ventures", "Networks", "Solutions"],
    domains: [".sg", ".com.sg", ".com", ".io", ".ai"],
    focusAreas: [
      "Cross-Border ASEAN Real-Time Payments",
      "Autonomous Maritime Cargo Port Logistics",
      "Institutional Digital Asset Wealth Custody",
      "All-in-One Super-App On-Demand Delivery",
      "Smart City Edge IoT Energy Optimization",
      "B2B Seafood & Agrifood Traceability",
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

async function scaleHubToTarget(
  tenantId: string,
  categoryId: string,
  domainId: string,
  config: HubProfileConfig,
  targetCount: number = 1010
) {
  const { count: currentCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId);

  const existing = currentCount || 0;
  console.log(`\n===============================================================`);
  console.log(`📍 METRO: [${config.name.toUpperCase()}]`);
  console.log(`   Current listings: ${existing} | Target: ${targetCount}`);

  if (existing >= targetCount) {
    console.log(`   ✨ Already has ${existing} listings! Skipping.`);
    return;
  }

  const needed = targetCount - existing;
  console.log(`   🚀 Generating & inserting ${needed} new tech companies with live jobs...`);

  const { data: existingListings } = await supabase
    .from("listings")
    .select("slug")
    .eq("domain_id", domainId);

  const usedSlugs = new Set<string>((existingListings || []).map((l) => l.slug));

  const listingsToInsert: any[] = [];
  let attempts = 0;
  let created = 0;

  while (created < needed && attempts < needed * 4) {
    attempts++;
    const prefix = getRandomItem(config.prefixes);
    const root = getRandomItem(config.roots);
    const suffix = getRandomItem(config.suffixes);
    const domainExt = getRandomItem(config.domains);

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
    const jobsCount = Math.floor(Math.random() * 6) + 2;

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

    const jobBatch: any[] = [];
    for (const saved of savedChunk || []) {
      const numJobs = saved.active_jobs_count || 3;
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
  console.log("🚀 SCALING BATCH 2 GLOBAL TECH HUBS TO 1,000+ COMPANIES EACH");
  console.log("===============================================================");

  const { tenantId, categoryId, domainMap } = await getContext();

  const hubsToScale: HubProfileConfig[] = [
    HUB_CONFIGS["seattle"],
    HUB_CONFIGS["austin"],
    HUB_CONFIGS["boston"],
    HUB_CONFIGS["paris"],
    HUB_CONFIGS["berlin"],
    HUB_CONFIGS["amsterdam"],
    HUB_CONFIGS["toronto"],
    HUB_CONFIGS["singapore"],
  ];

  for (const hub of hubsToScale) {
    const domainId = domainMap.get(hub.slug);
    if (!domainId) {
      console.warn(`⚠️ Domain ${hub.slug} not found in database!`);
      continue;
    }
    await scaleHubToTarget(tenantId, categoryId, domainId, hub, 1010);
  }

  console.log("\n===============================================================");
  console.log("🎉 BATCH 2 GLOBAL HUBS SCALING COMPLETED!");
  console.log("===============================================================\n");
}

main().catch(console.error);
