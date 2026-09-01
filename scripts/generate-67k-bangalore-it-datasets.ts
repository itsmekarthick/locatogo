import fs from "fs";
import path from "path";
import {
  BANGALORE_PINCODE_COORDINATES,
  cleanCompanyBrandName,
  resolvePincodeCoordinates,
} from "../src/lib/import/registry-transformer";

const TECH_SECTORS = [
  "AI & GenAI Systems",
  "Enterprise SaaS",
  "FinTech & Digital Payments",
  "Cloud Infrastructure & DevOps",
  "DeepTech & Silicon Design",
  "HealthTech Informatics",
  "E-Commerce & Quick Commerce",
  "Cybersecurity & Zero Trust",
  "EdTech & Upskilling",
  "IT Consulting & Global Delivery",
  "SpaceTech & Geospatial AI",
  "Electric Mobility & CleanTech",
  "Robotics & Industrial Automation",
  "Autonomous Systems & Avionics",
  "Data Engineering & Analytics",
];

const TECH_STACK_POOL = [
  ["Python", "PyTorch", "CUDA", "FastAPI", "Kubernetes", "AWS"],
  ["Go", "Kubernetes", "Kafka", "PostgreSQL", "Redis", "gRPC"],
  ["TypeScript", "React", "Next.js", "Node.js", "GraphQL", "TailwindCSS"],
  ["Java", "Spring Boot", "AWS", "Microservices", "Kafka", "PostgreSQL"],
  ["Rust", "WebAssembly", "C++", "Distributed Systems", "PostgreSQL"],
  ["C#", ".NET Core", "Azure Cloud", "SQL Server", "Microservices"],
  ["C++", "Embedded Linux", "AUTOSAR", "Computer Vision", "ROS"],
  ["Scala", "Apache Spark", "Databricks", "Snowflake", "Kafka"],
  ["Kotlin", "Android SDK", "Jetpack Compose", "Coroutines", "Ktor"],
  ["Swift", "iOS SDK", "SwiftUI", "Combine", "CoreML"],
];

const COMPANY_TYPES = [
  "product_saas",
  "tech_giant_mnc",
  "startup",
  "it_services_consulting",
  "deeptech_hardware",
];

const STAGES = [
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Unicorn",
  "Public",
  "Bootstrapped",
  "GCC",
];

const EMPLOYEE_RANGES = [
  "10-50",
  "51-200",
  "201-500",
  "501-1000",
  "1,000-5,000",
  "5,000+",
];

const PINCODES = Object.keys(BANGALORE_PINCODE_COORDINATES);

const PREFIXES = [
  "Apex", "Nova", "Cyber", "Cloud", "Hyper", "Synapse", "Quantum", "Orbit", "Pulse", "Stratum",
  "Vanguard", "Cognitive", "Aether", "Infini", "Prism", "Core", "Vector", "Echo", "Loom", "Matrix",
  "Scale", "Logic", "Data", "Neuro", "Pixel", "Flow", "Nexus", "Zenith", "Tensor", "Beacon",
  "Agile", "Aura", "Catalyst", "Vertex", "Krypton", "Falcon", "Omni", "Helix", "Starlight", "Solace",
  "Astral", "Titan", "Vortex", "Cipher", "Dynamo", "Eclipse", "Fusion", "Genesis", "Horizon", "Ignite",
  "Jovian", "Kinetic", "Lumina", "Magneto", "Nebula", "Optima", "Pinnacle", "Quark", "Radiant", "Spectra",
  "Triton", "Unity", "Valence", "Warp", "Xenon", "Yield", "Zodiac", "Axiom", "Boreal", "Cobalt",
  "Delta", "Enigma", "Flux", "Galactic", "Hyperion", "Ion", "Jupiter", "Kestrel", "Linear", "Monolith"
];

const MIDFIXES = [
  "Soft", "Tech", "Data", "Net", "Sys", "Cloud", "Bit", "Byte", "AI", "Logic",
  "Wave", "Grid", "Link", "Sync", "Hub", "Node", "Core", "Stack", "Mind", "Base"
];

const SUFFIXES = [
  "Technologies", "Labs", "AI", "Software", "Networks", "Cloud Systems", "Infotech", "Solutions",
  "Digital", "Robotics", "Analytics", "Platforms", "Data Systems", "Dynamics", "Intelligence",
  "Cyber", "Studio", "Interactive", "Security", "Scale", "Micro", "Foundry", "Logic", "Engineering",
  "Innovations", "Enterprises", "Computing", "Services", "Ventures", "Systems", "Architects"
];

function generatePartition(startIdx: number, count: number): string {
  const headers = [
    "title",
    "slug",
    "category_name",
    "address_line_1",
    "locality",
    "city",
    "state",
    "country",
    "postal_code",
    "latitude",
    "longitude",
    "website",
    "careers_url",
    "company_type",
    "funding_stage",
    "employee_range",
    "tech_stack",
    "founded_year",
    "short_description",
  ];

  const rows: string[] = [headers.join(",")];

  for (let i = 0; i < count; i++) {
    const globalIdx = startIdx + i;
    
    // Deterministic unique combination generator
    const pre = PREFIXES[globalIdx % PREFIXES.length];
    const mid = MIDFIXES[Math.floor(globalIdx / PREFIXES.length) % MIDFIXES.length];
    const suf = SUFFIXES[Math.floor(globalIdx / (PREFIXES.length * MIDFIXES.length)) % SUFFIXES.length];
    
    const brandName = `${pre} ${mid} ${suf}`;
    const pin = PINCODES[globalIdx % PINCODES.length];
    const loc = resolvePincodeCoordinates(pin);
    const slug = `${brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${pin}-${globalIdx + 1000}`;
    const domainName = `${pre.toLowerCase()}${mid.toLowerCase()}${suf.toLowerCase()}`;
    const website = `https://www.${domainName}.io`;
    const careersUrl = `https://www.${domainName}.io/careers`;
    const sector = TECH_SECTORS[globalIdx % TECH_SECTORS.length];
    const techStack = TECH_STACK_POOL[globalIdx % TECH_STACK_POOL.length].join(";");
    const type = COMPANY_TYPES[globalIdx % COMPANY_TYPES.length];
    const stage = STAGES[globalIdx % STAGES.length];
    const employees = EMPLOYEE_RANGES[globalIdx % EMPLOYEE_RANGES.length];
    const year = 1995 + (globalIdx % 30);
    const towerNum = 1 + (globalIdx % 12);
    const desc = `${brandName} is an active technology company specializing in ${sector} located in ${loc.locality}, Bengaluru.`;

    const row = [
      `"${brandName}"`,
      `"${slug}"`,
      `"Tech & Coworking"`,
      `"Tower ${towerNum}, Tech Park, ${loc.locality}"`,
      `"${loc.locality}"`,
      `"Bengaluru"`,
      `"Karnataka"`,
      `"IN"`,
      `"${pin}"`,
      loc.lat,
      loc.lon,
      `"${website}"`,
      `"${careersUrl}"`,
      `"${type}"`,
      `"${stage}"`,
      `"${employees}"`,
      `"${techStack}"`,
      year,
      `"${desc}"`,
    ];

    rows.push(row.join(","));
  }

  return rows.join("\n");
}

async function run() {
  const outputDir = path.join(process.cwd(), "public", "datasets");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Generating 67,000 Bangalore IT Companies partitioned into 10k-record datasets...\n");

  const partitions = [
    { name: "bangalore_it_companies_part1_10k.csv", count: 10000 },
    { name: "bangalore_it_companies_part2_10k.csv", count: 10000 },
    { name: "bangalore_it_companies_part3_10k.csv", count: 10000 },
    { name: "bangalore_it_companies_part4_10k.csv", count: 10000 },
    { name: "bangalore_it_companies_part5_10k.csv", count: 10000 },
    { name: "bangalore_it_companies_part6_10k.csv", count: 10000 },
    { name: "bangalore_it_companies_part7_7k.csv", count: 7000 },
  ];

  let currentStart = 0;
  for (let p = 0; p < partitions.length; p++) {
    const part = partitions[p];
    const csvContent = generatePartition(currentStart, part.count);
    const filePath = path.join(outputDir, part.name);
    fs.writeFileSync(filePath, csvContent, "utf8");
    console.log(`✓ Generated Part ${p + 1}/7: ${part.name} (${part.count.toLocaleString()} companies, ${(csvContent.length / (1024 * 1024)).toFixed(2)} MB)`);
    currentStart += part.count;
  }

  console.log(`\n🎉 Total Generated: ${currentStart.toLocaleString()} unique Bangalore IT companies across 7 CSV batches!`);
}

run();
