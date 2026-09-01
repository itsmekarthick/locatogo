import fs from "fs";
import path from "path";
import {
  BANGALORE_PINCODE_COORDINATES,
  cleanCompanyBrandName,
  resolvePincodeCoordinates,
} from "../src/lib/import/registry-transformer";

// Sample generators for company metadata
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
];

const TECH_STACK_POOL = [
  ["Python", "PyTorch", "CUDA", "FastAPI", "Kubernetes", "AWS"],
  ["Go", "Kubernetes", "Kafka", "PostgreSQL", "Redis", "gRPC"],
  ["TypeScript", "React", "Next.js", "Node.js", "GraphQL", "TailwindCSS"],
  ["Java", "Spring Boot", "AWS", "Microservices", "Kafka", "PostgreSQL"],
  ["Rust", "WebAssembly", "C++", "Distributed Systems", "PostgreSQL"],
  ["C#", ".NET Core", "Azure Cloud", "SQL Server", "Microservices"],
  ["C++", "Embedded Linux", "AUTOSAR", "Computer Vision", "ROS"],
];

const COMPANY_TYPES = ["product_saas", "tech_giant_mnc", "startup", "it_services_consulting", "deeptech_hardware"];
const STAGES = ["Seed", "Series A", "Series B", "Series C+", "Unicorn", "Public", "Bootstrapped", "GCC"];
const EMPLOYEE_RANGES = ["10-50", "51-200", "201-500", "501-1000", "1,000-5,000", "5,000+"];

const PINCODES = Object.keys(BANGALORE_PINCODE_COORDINATES);

/**
 * Generate 1,000+ formatted Bangalore IT Companies across all tech hubs
 */
export function generateBangaloreITDataset(targetCount: number = 1000): string {
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

  const prefixes = [
    "Apex", "Nova", "Cyber", "Cloud", "Hyper", "Synapse", "Quantum", "Orbit", "Pulse", "Stratum",
    "Vanguard", "Cognitive", "Aether", "Infini", "Prism", "Core", "Vector", "Echo", "Loom", "Matrix",
    "Scale", "Logic", "Data", "Neuro", "Pixel", "Flow", "Nexus", "Zenith", "Tensor", "Beacon",
    "Agile", "Aura", "Catalyst", "Vertex", "Krypton", "Falcon", "Omni", "Helix", "Starlight", "Solace"
  ];

  const suffixes = [
    "Technologies", "Labs", "AI", "Software", "Networks", "Cloud Systems", "Infotech", "Solutions",
    "Digital", "Robotics", "Analytics", "Platforms", "Data Systems", "Dynamics", "Intelligence",
    "Cyber", "Studio", "Interactive", "Security", "Scale", "Micro", "Foundry", "Logic", "Engineering"
  ];

  let idCounter = 100;
  for (let i = 0; i < targetCount; i++) {
    const pre = prefixes[i % prefixes.length];
    const suf = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
    const rawTitle = `${pre} ${suf} Private Limited`;
    const brandName = cleanCompanyBrandName(rawTitle);
    const pin = PINCODES[i % PINCODES.length];
    const loc = resolvePincodeCoordinates(pin);
    const slug = `${brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${pin}-${idCounter++}`;
    const domainName = brandName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const website = `https://www.${domainName}.io`;
    const careersUrl = `https://www.${domainName}.io/careers`;
    const sector = TECH_SECTORS[i % TECH_SECTORS.length];
    const techStack = TECH_STACK_POOL[i % TECH_STACK_POOL.length].join(";");
    const type = COMPANY_TYPES[i % COMPANY_TYPES.length];
    const stage = STAGES[i % STAGES.length];
    const employees = EMPLOYEE_RANGES[i % EMPLOYEE_RANGES.length];
    const year = 2005 + (i % 20);
    const desc = `${brandName} is a high-growth technology enterprise specializing in ${sector} based in ${loc.locality}, Bengaluru.`;

    const row = [
      `"${brandName}"`,
      `"${slug}"`,
      `"Tech & Software Hubs"`,
      `"Tech Park Tower ${1 + (i % 8)}, ${loc.locality}"`,
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

  console.log("Transforming and generating 1,000+ Bangalore IT Companies dataset with exact Pincode centroids...");
  const csvContent = generateBangaloreITDataset(1000);
  const outputPath = path.join(outputDir, "mca_bangalore_it_companies_1000.csv");

  fs.writeFileSync(outputPath, csvContent, "utf8");
  console.log(`✓ Generated ${outputPath} (${(csvContent.length / 1024).toFixed(1)} KB)`);
  console.log("Ready for 1-click batch import in Locatogo Admin Data Hub!");
}

run();
