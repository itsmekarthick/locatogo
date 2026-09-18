/**
 * seed-hyderabad-comprehensive.ts
 *
 * Exhaustive catalog of verified tech companies, mega GCCs, SaaS unicorns,
 * DeepTech pioneers, SpaceTech startups, Biotech giants, and IT leaders in Hyderabad:
 * - Mega GCC Campuses: Amazon, Microsoft IDC, Google, Apple, Qualcomm, AMD, Micron, ServiceNow, Salesforce, Uber, NVIDIA, Oracle
 * - SaaS & FinTech Unicorns: Darwinbox, HighRadius, Zenoti, Zaggle, Keka HR
 * - DeepTech, Aerospace & SpaceTech: Skyroot Aerospace, Dhruva Space, Cyient, MTAR Technologies
 * - Global Pharma & BioTech: Bharat Biotech, Biological E, Dr. Reddy's Laboratories
 * - Premier IT Services: TCS, Infosys, Wipro, Tech Mahindra, Cognizant, Virtusa
 * - Ecosystem & Innovation Hubs: T-Hub, T-Works, WE Hub, CIE IIIT-H
 */

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export interface HyderabadCompanyEntry {
  name: string;
  domain: string;
  website: string;
  careers_url: string;
  short_description: string;
  company_type: "tech_giant_mnc" | "product_saas" | "startup" | "it_services_consulting" | "deeptech_hardware" | "vc_accelerator";
  funding_stage: "Seed" | "Series A" | "Series B" | "Series C+" | "Unicorn" | "Public" | "Bootstrapped" | "GCC";
  employee_range: string;
  founded_year: number;
  tech_stack: string[];
  lat: number;
  lng: number;
  locality: string;
  address_line_1: string;
  is_featured?: boolean;
}

export const HYDERABAD_COMPANIES: HyderabadCompanyEntry[] = [
  // =========================================================================
  // 1. MEGA GLOBAL TECH GIANTS & GCCs
  // =========================================================================
  {
    name: "Amazon Development Center (Hyderabad Campus)",
    domain: "amazon.com",
    website: "https://amazon.jobs/en/locations/hyderabad-india",
    careers_url: "https://amazon.jobs/en/locations/hyderabad-india",
    short_description: "Amazon's largest campus building anywhere in the world, spanning 9.5 acres and housing core AWS, Kindle, retail, and machine learning teams.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "10,001–50,000",
    founded_year: 1994,
    tech_stack: ["Java", "C++", "Python", "AWS", "Distributed Systems", "AI/ML"],
    lat: 17.4168,
    lng: 78.3432,
    locality: "Financial District",
    address_line_1: "Amazon Mega Campus, Jayabheri Silicon County, Nanakramguda",
    is_featured: true,
  },
  {
    name: "Microsoft India Development Center (IDC)",
    domain: "microsoft.com",
    website: "https://careers.microsoft.com",
    careers_url: "https://careers.microsoft.com",
    short_description: "Microsoft's premier R&D center outside Redmond, driving core engineering for Azure Cloud, Windows, Office 365, and Copilot AI.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,001–10,000",
    founded_year: 1998,
    tech_stack: ["C#", ".NET", "C++", "Azure", "Python", "TypeScript", "OpenAI"],
    lat: 17.4416,
    lng: 78.3492,
    locality: "Gachibowli",
    address_line_1: "Microsoft Campus, ISB Road, Gachibowli",
    is_featured: true,
  },
  {
    name: "Google India (Hyderabad)",
    domain: "google.com",
    website: "https://careers.google.com/locations/hyderabad",
    careers_url: "https://careers.google.com/locations/hyderabad",
    short_description: "Major engineering hub developing Google Ads, Google Cloud, Search infrastructure, and YouTube streaming services.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,001–10,000",
    founded_year: 1998,
    tech_stack: ["Go", "C++", "Java", "Python", "Kubernetes", "Borg", "TensorFlow"],
    lat: 17.4589,
    lng: 78.3712,
    locality: "HITEC City",
    address_line_1: "Google Block 1, DivyaSree Omega, Kondapur Main Road",
    is_featured: true,
  },
  {
    name: "Apple India Technology Center",
    domain: "apple.com",
    website: "https://www.apple.com/careers/in",
    careers_url: "https://www.apple.com/careers/in",
    short_description: "Global development facility dedicated to Apple Maps, geographic data architectures, satellite imagery, and spatial navigation.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 1976,
    tech_stack: ["Swift", "C++", "Python", "GIS", "Computer Vision", "Distributed Systems"],
    lat: 17.4175,
    lng: 78.3482,
    locality: "Financial District",
    address_line_1: "WaveRock Building, TSIIC Nanakramguda",
    is_featured: true,
  },
  {
    name: "Qualcomm India (Hyderabad Design Center)",
    domain: "qualcomm.com",
    website: "https://qualcomm.com",
    careers_url: "https://careers.smartrecruiters.com/qualcomm",
    short_description: "Largest Qualcomm engineering and chip design facility outside San Diego, engineering Snapdragon processors, 5G modems, and on-device AI.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,001–10,000",
    founded_year: 1985,
    tech_stack: ["Verilog", "SystemVerilog", "C", "C++", "VLSI", "5G", "DSP"],
    lat: 17.4395,
    lng: 78.3812,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "Salarpuria Sattva Knowledge City, Raidurg",
    is_featured: true,
  },
  {
    name: "AMD India (Hyderabad)",
    domain: "amd.com",
    website: "https://amd.com",
    careers_url: "https://careers.smartrecruiters.com/amd",
    short_description: "Core microprocessor, Radeon GPU, and adaptive computing engineering hub powering next-gen data center and AI hardware.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 1969,
    tech_stack: ["C++", "SystemC", "Verilog", "Radeon Software", "ROCm", "AI Compute"],
    lat: 17.4435,
    lng: 78.3822,
    locality: "HITEC City",
    address_line_1: "Building 12B, Mindspace Madhapur",
    is_featured: true,
  },
  {
    name: "ServiceNow India (Hyderabad)",
    domain: "servicenow.com",
    website: "https://servicenow.com",
    careers_url: "https://careers.smartrecruiters.com/servicenow",
    short_description: "Premier product engineering hub architecting the Now Platform, enterprise digital workflows, and GenAI copilot services.",
    company_type: "product_saas",
    funding_stage: "GCC",
    employee_range: "5,001–10,000",
    founded_year: 2004,
    tech_stack: ["Java", "JavaScript", "React", "Kafka", "Docker", "AWS"],
    lat: 17.4362,
    lng: 78.3825,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "Salarpuria Sattva Knowledge City, Inorbit Mall Road",
    is_featured: true,
  },
  {
    name: "Salesforce India (Hyderabad)",
    domain: "salesforce.com",
    website: "https://salesforce.com",
    careers_url: "https://careers.smartrecruiters.com/salesforce",
    short_description: "Key product development center for Service Cloud, Marketing Cloud, Agentforce AI, and multi-tenant data architecture.",
    company_type: "product_saas",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 1999,
    tech_stack: ["Java", "Apex", "TypeScript", "React", "Python", "Kubernetes"],
    lat: 17.4328,
    lng: 78.3789,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "DivyaSree Orion, B8, Raidurg",
    is_featured: true,
  },
  {
    name: "Micron Technology India",
    domain: "micron.com",
    website: "https://micron.com",
    careers_url: "https://micron.com/careers",
    short_description: "Advanced semiconductor engineering site designing DRAM memory architectures, High Bandwidth Memory (HBM3E), and flash storage.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 1978,
    tech_stack: ["Verilog", "VLSI", "C++", "DRAM Design", "Semiconductor Physics", "Python"],
    lat: 17.4082,
    lng: 78.3325,
    locality: "Kokapet",
    address_line_1: "Tower 8, GAR Infobahn, Kokapet",
    is_featured: true,
  },
  {
    name: "Uber Hyderabad Tech Center",
    domain: "uber.com",
    website: "https://uber.com",
    careers_url: "https://careers.smartrecruiters.com/uber",
    short_description: "Engineering rider experience, driver safety, high-throughput financial clearing, and global maps dispatch systems.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 2009,
    tech_stack: ["Go", "Java", "Python", "Kafka", "Microservices", "iOS/Android"],
    lat: 17.4335,
    lng: 78.3792,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "Tower 2, DivyaSree Orion SEZ, Raidurg",
    is_featured: true,
  },
  {
    name: "NVIDIA Graphics India (Hyderabad)",
    domain: "nvidia.com",
    website: "https://nvidia.com",
    careers_url: "https://nvidia.com/careers",
    short_description: "Engineering CUDA compilers, GPU hardware verification, autonomous machines software, and deep learning libraries.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 1993,
    tech_stack: ["CUDA", "C++", "Python", "SystemVerilog", "GPU Architecture", "PyTorch"],
    lat: 17.4468,
    lng: 78.3885,
    locality: "Madhapur",
    address_line_1: "Mindspace Madhapur, Building 14",
    is_featured: true,
  },
  {
    name: "Oracle India (Hyderabad)",
    domain: "oracle.com",
    website: "https://oracle.com",
    careers_url: "https://oracle.com/careers",
    short_description: "Core engineering for Oracle Cloud Infrastructure (OCI), autonomous database kernels, and enterprise Fusion ERP applications.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,001–10,000",
    founded_year: 1977,
    tech_stack: ["Java", "C", "C++", "SQL", "Distributed Systems", "OCI"],
    lat: 17.4475,
    lng: 78.3768,
    locality: "HITEC City",
    address_line_1: "Oracle Tech Park, Cyber Towers Road, HITEC City",
  },
  {
    name: "Goldman Sachs India (Hyderabad)",
    domain: "goldmansachs.com",
    website: "https://goldmansachs.com",
    careers_url: "https://goldmansachs.com/careers",
    short_description: "Premier quantitative finance, low-latency electronic trading platforms, risk modeling, and asset management technology.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 1869,
    tech_stack: ["Java", "C++", "Python", "Kafka", "Slang", "SecDb", "Distributed Systems"],
    lat: 17.4362,
    lng: 78.3825,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "Salarpuria Sattva Knowledge City, Raidurg",
    is_featured: true,
  },
  {
    name: "JPMorgan Chase & Co (Hyderabad)",
    domain: "jpmorganchase.com",
    website: "https://jpmorganchase.com",
    careers_url: "https://jpmorganchase.com/careers",
    short_description: "Engineering digital wholesale payments, algorithmic clearing, cloud migration, and enterprise cybersecurity.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,001–10,000",
    founded_year: 1799,
    tech_stack: ["Java", "Spring Boot", "Python", "Kubernetes", "AWS", "Kafka"],
    lat: 17.4362,
    lng: 78.3825,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "Argos, Salarpuria Sattva Knowledge City",
  },
  {
    name: "Wells Fargo India (Hyderabad)",
    domain: "wellsfargo.com",
    website: "https://wellsfargo.com",
    careers_url: "https://wellsfargo.com/careers",
    short_description: "Engineering retail banking platforms, fraud detection neural nets, and enterprise transactional architectures.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,001–10,000",
    founded_year: 1852,
    tech_stack: ["Java", "Microservices", "Python", "Oracle", "Angular", "Kafka"],
    lat: 17.4328,
    lng: 78.3789,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "DivyaSree Orion, B7, Gachibowli",
  },
  {
    name: "DE Shaw India",
    domain: "deshawindia.com",
    website: "https://deshawindia.com",
    careers_url: "https://deshawindia.com/careers",
    short_description: "Pioneering global investment and algorithmic trading technology firm combining financial theory with massive computational scale.",
    company_type: "product_saas",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 1988,
    tech_stack: ["Python", "C++", "Java", "Linux Kernels", "Time Series Data", "HPC"],
    lat: 17.4435,
    lng: 78.3822,
    locality: "HITEC City",
    address_line_1: "Building 11, Mindspace Madhapur",
    is_featured: true,
  },
  {
    name: "Arcesium India",
    domain: "arcesium.com",
    website: "https://arcesium.com",
    careers_url: "https://arcesium.com/careers",
    short_description: "Post-trade technology and financial data platform managing hundreds of billions in alternative investment assets.",
    company_type: "product_saas",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 2015,
    tech_stack: ["Java", "Kafka", "AWS", "Angular", "Snowflake", "PostgreSQL"],
    lat: 17.4175,
    lng: 78.3482,
    locality: "Financial District",
    address_line_1: "WaveRock, Tower 2.1, Nanakramguda",
  },
  {
    name: "Synopsys India (Hyderabad)",
    domain: "synopsys.com",
    website: "https://synopsys.com",
    careers_url: "https://synopsys.com/careers",
    short_description: "Electronic Design Automation (EDA) and semiconductor IP leader engineering tools for silicon design and verification.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 1986,
    tech_stack: ["C++", "Python", "EDA Algorithms", "VLSI Verification", "Linux"],
    lat: 17.4362,
    lng: 78.3825,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "Salarpuria Sattva Knowledge City",
  },
  {
    name: "Western Digital India (Hyderabad)",
    domain: "westerndigital.com",
    website: "https://westerndigital.com",
    careers_url: "https://careers.smartrecruiters.com/WesternDigital",
    short_description: "R&D facility engineering enterprise flash firmware, NVMe SSD controller software, and cloud storage systems.",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "1,001–5,000",
    founded_year: 1970,
    tech_stack: ["C", "C++", "Firmware", "Flash Memory", "Python"],
    lat: 17.4168,
    lng: 78.3432,
    locality: "Financial District",
    address_line_1: "Nanakramguda, Financial District",
  },

  // =========================================================================
  // 2. UNICORNS & HIGH-GROWTH SAAS BORN IN HYDERABAD
  // =========================================================================
  {
    name: "Darwinbox",
    domain: "darwinbox.com",
    website: "https://darwinbox.com",
    careers_url: "https://darwinbox.com/careers",
    short_description: "Unicorn human capital management (HCM) SaaS platform serving over 900 global enterprises across 130+ countries.",
    company_type: "startup",
    funding_stage: "Unicorn",
    employee_range: "1,001–5,000",
    founded_year: 2015,
    tech_stack: ["PHP", "Go", "Node.js", "React", "MongoDB", "AWS", "Kafka"],
    lat: 17.4485,
    lng: 78.3912,
    locality: "Madhapur",
    address_line_1: "Plot 105, Kavuri Hills, Madhapur",
    is_featured: true,
  },
  {
    name: "HighRadius (Hyderabad HQ)",
    domain: "highradius.com",
    website: "https://highradius.com",
    careers_url: "https://boards.greenhouse.io/highradius",
    short_description: "Autonomous finance SaaS unicorn automating Order-to-Cash, Treasury, and Record-to-Report workflows.",
    company_type: "product_saas",
    funding_stage: "Unicorn",
    employee_range: "1,001–5,000",
    founded_year: 2006,
    tech_stack: ["Java", "Spring Boot", "React", "AI/ML", "AWS", "Microservices"],
    lat: 17.4435,
    lng: 78.3822,
    locality: "HITEC City",
    address_line_1: "Building 12, Mindspace Madhapur",
    is_featured: true,
  },
  {
    name: "Zenoti (Hyderabad R&D)",
    domain: "zenoti.com",
    website: "https://zenoti.com",
    careers_url: "https://boards.greenhouse.io/zenoti",
    short_description: "Unicorn cloud enterprise management and POS operating system for premium spas, salons, and medspas globally.",
    company_type: "product_saas",
    funding_stage: "Unicorn",
    employee_range: "1,001–5,000",
    founded_year: 2010,
    tech_stack: ["C#", ".NET Core", "Angular", "SQL Server", "Azure", "Microservices"],
    lat: 17.4401,
    lng: 78.3489,
    locality: "Gachibowli",
    address_line_1: "Gachibowli Financial Hub",
    is_featured: true,
  },
  {
    name: "Zaggle",
    domain: "zaggle.in",
    website: "https://zaggle.in",
    careers_url: "https://zaggle.in/careers",
    short_description: "Publicly listed B2B SaaS fintech platform delivering enterprise spend management, expense automation, and prepaid cards.",
    company_type: "startup",
    funding_stage: "Public",
    employee_range: "501–1,000",
    founded_year: 2011,
    tech_stack: ["Java", "Spring Boot", "Node.js", "React Native", "PostgreSQL", "AWS"],
    lat: 17.4475,
    lng: 78.3768,
    locality: "HITEC City",
    address_line_1: "Rudram Chambers, HITEC City Main Rd",
    is_featured: true,
  },
  {
    name: "Keka HR",
    domain: "keka.com",
    website: "https://keka.com",
    careers_url: "https://keka.com/careers",
    short_description: "Leading employee experience, payroll, and performance management SaaS used by over 30,000 businesses across India.",
    company_type: "product_saas",
    funding_stage: "Series A",
    employee_range: "501–1,000",
    founded_year: 2015,
    tech_stack: ["C#", ".NET Core", "React", "Angular", "SQL Server", "AWS"],
    lat: 17.4492,
    lng: 78.3925,
    locality: "Madhapur",
    address_line_1: "Kavuri Hills, Madhapur",
    is_featured: true,
  },
  {
    name: "ServiceTitan (Hyderabad)",
    domain: "servicetitan.com",
    website: "https://servicetitan.com",
    careers_url: "https://careers.smartrecruiters.com/servicetitan",
    short_description: "All-in-one software operating system empowering commercial and residential trade service contractors across North America.",
    company_type: "product_saas",
    funding_stage: "Public",
    employee_range: "1,001–5,000",
    founded_year: 2012,
    tech_stack: ["C#", ".NET", "React", "TypeScript", "Azure", "Distributed Systems"],
    lat: 17.4362,
    lng: 78.3825,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "Salarpuria Sattva Knowledge City",
  },
  {
    name: "Pegasystems (Hyderabad)",
    domain: "pega.com",
    website: "https://pega.com",
    careers_url: "https://pega.com/careers",
    short_description: "Low-code enterprise platform for AI-powered decisioning, customer service automation, and workflow orchestration.",
    company_type: "product_saas",
    funding_stage: "Public",
    employee_range: "1,001–5,000",
    founded_year: 1983,
    tech_stack: ["Java", "Pega Infinity", "JavaScript", "React", "Cloud Architecture"],
    lat: 17.4435,
    lng: 78.3822,
    locality: "HITEC City",
    address_line_1: "Raheja Mindspace, Madhapur",
  },
  {
    name: "OpenText India (Hyderabad)",
    domain: "opentext.com",
    website: "https://opentext.com",
    careers_url: "https://opentext.com/careers",
    short_description: "Enterprise Information Management (EIM) leader managing massive unstructured data, content clouds, and cybersecurity.",
    company_type: "tech_giant_mnc",
    funding_stage: "Public",
    employee_range: "1,001–5,000",
    founded_year: 1991,
    tech_stack: ["Java", "C++", "Cloud Security", "Enterprise Search", "Angular"],
    lat: 17.4435,
    lng: 78.3822,
    locality: "HITEC City",
    address_line_1: "Mindspace Madhapur",
  },

  // =========================================================================
  // 3. SPACETECH, DEEPTECH & DEFENCE
  // =========================================================================
  {
    name: "Skyroot Aerospace",
    domain: "skyroot.in",
    website: "https://skyroot.in",
    careers_url: "https://skyroot.in/careers",
    short_description: "Pioneering private aerospace company that designed and launched Vikram-S, India's first privately developed rocket into space.",
    company_type: "deeptech_hardware",
    funding_stage: "Series B",
    employee_range: "201–500",
    founded_year: 2018,
    tech_stack: ["Rocket Propulsion", "Avionics", "Composite Materials", "CFD", "C++", "Control Systems"],
    lat: 17.4485,
    lng: 78.3882,
    locality: "HITEC City",
    address_line_1: "T-Hub Phase 2 / HITEC City",
    is_featured: true,
  },
  {
    name: "Dhruva Space",
    domain: "dhruvaspace.com",
    website: "https://dhruvaspace.com",
    careers_url: "https://dhruvaspace.com/careers",
    short_description: "National award-winning SpaceTech company providing end-to-end small satellite platforms, solar arrays, and satellite deployers.",
    company_type: "deeptech_hardware",
    funding_stage: "Series A",
    employee_range: "51–200",
    founded_year: 2012,
    tech_stack: ["CubeSats", "Satellite Avionics", "Embedded Systems", "RF Engineering", "Python"],
    lat: 17.4447,
    lng: 78.4664,
    locality: "Begumpet",
    address_line_1: "Prakash Nagar, Begumpet",
    is_featured: true,
  },
  {
    name: "Cyient (Hyderabad Headquarters)",
    domain: "cyient.com",
    website: "https://cyient.com",
    careers_url: "https://cyient.com/careers",
    short_description: "Global engineering, manufacturing, and digital technology solutions leader in aerospace, semiconductor design, and telecommunications.",
    company_type: "it_services_consulting",
    funding_stage: "Public",
    employee_range: "10,001–50,000",
    founded_year: 1991,
    tech_stack: ["Embedded Systems", "VLSI", "Aerospace Engineering", "IoT", "C++", "Python"],
    lat: 17.4475,
    lng: 78.3768,
    locality: "HITEC City",
    address_line_1: "Software Units Layout, Infocity, Madhapur",
    is_featured: true,
  },
  {
    name: "MTAR Technologies",
    domain: "mtar.in",
    website: "https://mtar.in",
    careers_url: "https://mtar.in/careers",
    short_description: "Precision engineering pioneer manufacturing critical equipment for ISRO Chandrayaan missions, clean energy, and nuclear reactors.",
    company_type: "deeptech_hardware",
    funding_stage: "Public",
    employee_range: "1,001–5,000",
    founded_year: 1970,
    tech_stack: ["Precision Machining", "Cryogenic Engines", "Metallurgy", "CAD/CAM"],
    lat: 17.4725,
    lng: 78.4412,
    locality: "Balanagar",
    address_line_1: "Balanagar Industrial Estate",
  },
  {
    name: "Marut Drones",
    domain: "marutdrones.com",
    website: "https://marutdrones.com",
    careers_url: "https://marutdrones.com/careers",
    short_description: "Pioneering commercial drone technology company building AI-powered agricultural spraying drones and medical delivery systems.",
    company_type: "deeptech_hardware",
    funding_stage: "Series A",
    employee_range: "51–200",
    founded_year: 2019,
    tech_stack: ["Autonomous Flight", "Computer Vision", "Embedded C++", "Drone Hardware", "ROS"],
    lat: 17.4485,
    lng: 78.3882,
    locality: "HITEC City",
    address_line_1: "T-Hub Phase 2, Madhapur",
  },
  {
    name: "Pure EV",
    domain: "pureev.in",
    website: "https://pureev.in",
    careers_url: "https://pureev.in/careers",
    short_description: "Electric two-wheeler and lithium-ion battery technology startup incubated at IIT Hyderabad engineering high-efficiency commuting.",
    company_type: "deeptech_hardware",
    funding_stage: "Series A",
    employee_range: "201–500",
    founded_year: 2018,
    tech_stack: ["Battery Management Systems (BMS)", "Thermal Modeling", "Embedded Linux", "IoT"],
    lat: 17.5925,
    lng: 78.1254,
    locality: "IIT Hyderabad (Kandi)",
    address_line_1: "Technology Research Park, IIT Hyderabad",
  },

  // =========================================================================
  // 4. BIOTECH & HEALTHCARE TECH MAJORS
  // =========================================================================
  {
    name: "Bharat Biotech",
    domain: "bharatbiotech.com",
    website: "https://bharatbiotech.com",
    careers_url: "https://bharatbiotech.com/careers",
    short_description: "Pioneering biotechnology and vaccine manufacturer that developed Covaxin, Typhbar-TCV, and rotavirus vaccines globally.",
    company_type: "tech_giant_mnc",
    funding_stage: "Bootstrapped",
    employee_range: "1,001–5,000",
    founded_year: 1996,
    tech_stack: ["Bioinformatics", "Genomics", "Immunology", "Clinical Data Systems"],
    lat: 17.6825,
    lng: 78.5912,
    locality: "Genome Valley",
    address_line_1: "Genome Valley, Shameerpet, Hyderabad",
    is_featured: true,
  },
  {
    name: "Biological E Limited",
    domain: "biologicale.com",
    website: "https://biologicale.com",
    careers_url: "https://biologicale.com/careers",
    short_description: "One of the world's largest vaccine and biopharmaceutical manufacturers, producing Corbevax and essential pediatric vaccines.",
    company_type: "tech_giant_mnc",
    funding_stage: "Bootstrapped",
    employee_range: "1,001–5,000",
    founded_year: 1953,
    tech_stack: ["Biotechnology", "Protein Engineering", "Pharma Automation"],
    lat: 17.6845,
    lng: 78.5942,
    locality: "Genome Valley",
    address_line_1: "Genome Valley, Kolthur, Shameerpet",
  },
  {
    name: "Dr. Reddy's Laboratories",
    domain: "drreddys.com",
    website: "https://drreddys.com",
    careers_url: "https://drreddys.com/careers",
    short_description: "Multinational pharmaceutical and digital health giant engineering generic formulations, biologics, and digital therapeutics.",
    company_type: "tech_giant_mnc",
    funding_stage: "Public",
    employee_range: "10,001–50,000",
    founded_year: 1984,
    tech_stack: ["Chemoinformatics", "Cloud Analytics", "Pharma Automation", "Python"],
    lat: 17.4325,
    lng: 78.4412,
    locality: "Banjara Hills",
    address_line_1: "Road No. 3, Banjara Hills",
    is_featured: true,
  },

  // =========================================================================
  // 5. IT SERVICES & DIGITAL ENGINEERING MAJORS
  // =========================================================================
  {
    name: "Tata Consultancy Services (TCS Deccan Park)",
    domain: "tcs.com",
    website: "https://tcs.com",
    careers_url: "https://tcs.com/careers",
    short_description: "Global IT services major with landmark campus in Madhapur and massive engineering presence across Cyberabad.",
    company_type: "it_services_consulting",
    funding_stage: "Public",
    employee_range: "10,001–50,000",
    founded_year: 1968,
    tech_stack: ["Java", "Cloud", "AI/ML", "Microservices", "Cybersecurity"],
    lat: 17.4475,
    lng: 78.3842,
    locality: "Madhapur",
    address_line_1: "Deccan Park, Plot No. 1, Software Units Layout, Madhapur",
    is_featured: true,
  },
  {
    name: "Infosys (Hyderabad SEZ)",
    domain: "infosys.com",
    website: "https://infosys.com",
    careers_url: "https://infosys.com/careers",
    short_description: "Major digital transformation campus driving AI, cloud migration, and enterprise software engineering.",
    company_type: "it_services_consulting",
    funding_stage: "Public",
    employee_range: "10,001–50,000",
    founded_year: 1981,
    tech_stack: ["Java", "Python", "Cloud", "Infosys Topaz", "AI/ML"],
    lat: 17.4412,
    lng: 78.3542,
    locality: "Gachibowli",
    address_line_1: "Gachibowli SEZ, Hyderabad",
    is_featured: true,
  },
  {
    name: "Wipro (Gachibowli Campus)",
    domain: "wipro.com",
    website: "https://wipro.com",
    careers_url: "https://wipro.com/careers",
    short_description: "Key technology delivery center for AI consulting, cloud infrastructure, and enterprise modern engineering.",
    company_type: "it_services_consulting",
    funding_stage: "Public",
    employee_range: "10,001–50,000",
    founded_year: 1945,
    tech_stack: ["Cloud", "Cybersecurity", "Java", "Python", "Full Stack"],
    lat: 17.4385,
    lng: 78.3495,
    locality: "Gachibowli",
    address_line_1: "Wipro Circle, Gachibowli",
  },
  {
    name: "Tech Mahindra (Infocity)",
    domain: "techmahindra.com",
    website: "https://techmahindra.com",
    careers_url: "https://techmahindra.com/careers",
    short_description: "Telecom, automotive, and 5G network engineering delivery hub operating in the heart of HITEC City.",
    company_type: "it_services_consulting",
    funding_stage: "Public",
    employee_range: "10,001–50,000",
    founded_year: 1986,
    tech_stack: ["5G Networks", "Java", "Cloud", "Telecom OSS/BSS", "Python"],
    lat: 17.4475,
    lng: 78.3768,
    locality: "HITEC City",
    address_line_1: "Infocity, Madhapur, HITEC City",
  },
  {
    name: "Cognizant Technology Solutions (Hyderabad)",
    domain: "cognizant.com",
    website: "https://cognizant.com",
    careers_url: "https://cognizant.com/careers",
    short_description: "Major delivery site for healthcare digital platforms, life sciences, and cloud modernization.",
    company_type: "it_services_consulting",
    funding_stage: "Public",
    employee_range: "10,001–50,000",
    founded_year: 1994,
    tech_stack: ["Java", "Cloud", "Healthcare Systems", "AWS", "Data Engineering"],
    lat: 17.4175,
    lng: 78.3482,
    locality: "Financial District",
    address_line_1: "Building 1, WaveRock, Financial District",
  },
  {
    name: "Virtusa (Hyderabad Campus)",
    domain: "virtusa.com",
    website: "https://virtusa.com",
    careers_url: "https://virtusa.com/careers",
    short_description: "Digital engineering and IT consulting services specialist for global banking, fintech, and insurance.",
    company_type: "it_services_consulting",
    funding_stage: "Public",
    employee_range: "5,001–10,000",
    founded_year: 1996,
    tech_stack: ["FinTech", "Java", "Cloud Architecture", "Spring Boot", "Microservices"],
    lat: 17.4165,
    lng: 78.3438,
    locality: "Financial District",
    address_line_1: "Nanakramguda, Financial District",
  },

  // =========================================================================
  // 6. ECOSYSTEM HUBS & ACCELERATORS
  // =========================================================================
  {
    name: "T-Hub (Phase 2)",
    domain: "t-hub.co",
    website: "https://t-hub.co",
    careers_url: "https://t-hub.co/careers",
    short_description: "The world's largest technology incubator and innovation ecosystem campus spanning 580,000 sq ft and nurturing 2,000+ startups.",
    company_type: "vc_accelerator",
    funding_stage: "Bootstrapped",
    employee_range: "51–200",
    founded_year: 2015,
    tech_stack: ["Incubation", "Venture Building", "DeepTech", "Scaleup Programs"],
    lat: 17.4485,
    lng: 78.3882,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "T-Hub Phase 2, 20 Inorbit Mall Rd, Vittal Rao Nagar, Madhapur",
    is_featured: true,
  },
  {
    name: "T-Works",
    domain: "tworks.telangana.gov.in",
    website: "https://tworks.telangana.gov.in",
    careers_url: "https://tworks.telangana.gov.in/careers",
    short_description: "India's largest prototyping center for hardware, electronics, 3D printing, laser fabrication, and industrial design.",
    company_type: "vc_accelerator",
    funding_stage: "Bootstrapped",
    employee_range: "51–200",
    founded_year: 2023,
    tech_stack: ["Hardware Prototyping", "PCB Fabrication", "Laser Cutting", "Embedded Systems"],
    lat: 17.4385,
    lng: 78.3812,
    locality: "Raidurg (Knowledge City)",
    address_line_1: "Next to T-Hub, Raidurg Knowledge City",
    is_featured: true,
  },
  {
    name: "Endiya Partners",
    domain: "endiya.com",
    website: "https://endiya.com",
    careers_url: "https://endiya.com",
    short_description: "Leading early-stage venture capital firm investing in product startups across SaaS, healthcare, and deeptech (Darwinbox, SigTuple, Cure.fit).",
    company_type: "vc_accelerator",
    funding_stage: "Bootstrapped",
    employee_range: "10–50",
    founded_year: 2015,
    tech_stack: ["Seed Investment", "Venture Capital", "SaaS", "DeepTech"],
    lat: 17.4285,
    lng: 78.4112,
    locality: "Jubilee Hills",
    address_line_1: "Road No. 36, Jubilee Hills",
    is_featured: true,
  },
  {
    name: "CIE at IIIT Hyderabad",
    domain: "cie.iiit.ac.in",
    website: "https://cie.iiit.ac.in",
    careers_url: "https://cie.iiit.ac.in",
    short_description: "Pioneering deeptech academic incubator accelerating AI, computer vision, robotics, and language processing startups.",
    company_type: "vc_accelerator",
    funding_stage: "Bootstrapped",
    employee_range: "10–50",
    founded_year: 2008,
    tech_stack: ["AI/ML Research", "DeepTech Incubation", "Robotics", "NLP"],
    lat: 17.4455,
    lng: 78.3495,
    locality: "Gachibowli",
    address_line_1: "IIIT Hyderabad Campus, Gachibowli",
  },
];

async function main() {
  console.log("==================================================================");
  console.log("  SEEDING COMPREHENSIVE HYDERABAD TECH ECOSYSTEM                  ");
  console.log("==================================================================\n");

  const { data: domainData, error: domainErr } = await supabase
    .from("domains")
    .select("id, tenant_id")
    .eq("slug", "hyderabad")
    .single();

  if (domainErr || !domainData) {
    throw new Error(`Could not find Hyderabad domain: ${domainErr?.message}`);
  }

  const domainId = domainData.id;
  const tenantId = domainData.tenant_id;

  const { data: globalCat, error: catErr } = await supabase
    .from("categories")
    .select("id")
    .is("domain_id", null)
    .eq("slug", "tech-coworking")
    .single();

  if (catErr || !globalCat) {
    throw new Error(`Global 'tech-coworking' category not found: ${catErr?.message}`);
  }
  const techCategoryId = globalCat.id;

  console.log(`Target Domain: hyderabad (${domainId})`);
  console.log(`Tenant ID:     ${tenantId}`);
  console.log(`Category ID:   ${techCategoryId}`);
  console.log(`Companies:     ${HYDERABAD_COMPANIES.length} to upsert\n`);

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < HYDERABAD_COMPANIES.length; i++) {
    const co = HYDERABAD_COMPANIES[i];
    const slug = slugify(co.name);

    const record = {
      tenant_id: tenantId,
      domain_id: domainId,
      category_id: techCategoryId,
      title: co.name,
      slug,
      short_description: co.short_description,
      status: "published" as const,
      website: co.website,
      careers_url: co.careers_url,
      company_type: co.company_type,
      funding_stage: co.funding_stage,
      employee_range: co.employee_range,
      founded_year: co.founded_year,
      tech_stack: co.tech_stack,
      latitude: co.lat,
      longitude: co.lng,
      address_line_1: co.address_line_1 || co.locality || "Hyderabad",
      city: "Hyderabad",
      locality: co.locality,
      is_featured: co.is_featured ?? false,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("listings")
      .upsert(record, { onConflict: "domain_id,slug" });

    if (upsertErr) {
      console.error(`❌ [${co.name}]:`, upsertErr.message);
      errors++;
    } else {
      inserted++;
      process.stdout.write(`✅ [${inserted}/${HYDERABAD_COMPANIES.length}] ${co.name}\r`);
    }
  }

  console.log(`\n\n🎉 Done! Seeded ${inserted} Hyderabad tech companies (${errors} errors).`);

  const { count: hydTechCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("domain_id", domainId);

  console.log(`\n📊 Hyderabad Database Status:`);
  console.log(`   Total Verified Tech Listings in Hyderabad: ${hydTechCount}`);
  console.log(`\n🚀 Ready for ATS job sync.`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
