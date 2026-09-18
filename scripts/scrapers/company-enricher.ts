export interface EnrichedCompanyProfile {
  name: string;
  slug: string;
  company_type: "tech_giant_mnc" | "product_saas" | "startup" | "it_services_consulting" | "deeptech_hardware";
  funding_stage: "Seed" | "Series A" | "Series B" | "Series C+" | "Unicorn" | "Public" | "Bootstrapped" | "GCC";
  employee_range: "10-50" | "51-200" | "201-500" | "501-1000" | "1,000-5,000" | "5,000+";
  tech_stack: string[];
  sectors: string[];
  website: string;
  careers_url?: string;
  founded_year: number;
  short_description: string;
}

export const KNOWN_TECH_COMPANIES: Record<string, Partial<EnrichedCompanyProfile>> = {
  "walmart-global-tech-india": {
    name: "Walmart Global Tech India",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,000+",
    tech_stack: ["Java", "Spring Boot", "Kafka", "Kubernetes", "React", "Azure", "GCP"],
    sectors: ["Retail Tech", "E-Commerce", "Supply Chain", "Cloud Systems"],
    website: "https://tech.walmart.com",
    careers_url: "https://tech.walmart.com/careers",
    founded_year: 2011,
    short_description: "Walmart's technology innovation and global delivery engineering center driving omnichannel retail platforms.",
  },
  amazon: {
    name: "Amazon India",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,000+",
    tech_stack: ["Java", "AWS", "Python", "C++", "DynamoDB", "Lambda", "TypeScript"],
    sectors: ["Cloud Infrastructure", "E-Commerce", "AI Systems", "Logistics"],
    website: "https://aboutamazon.in",
    careers_url: "https://amazon.jobs/en/locations/bengaluru-india",
    founded_year: 1994,
    short_description: "Global e-commerce, cloud computing (AWS), and smart device development centers in Bengaluru.",
  },
  google: {
    name: "Google India",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,000+",
    tech_stack: ["Go", "C++", "Python", "Kubernetes", "TensorFlow", "Angular", "Borg"],
    sectors: ["AI & Search", "Cloud Systems", "Android OS", "Payments"],
    website: "https://about.google",
    careers_url: "https://careers.google.com/locations/bangalore",
    founded_year: 1998,
    short_description: "Google's major India engineering hub powering Search, Cloud, YouTube, Android, and AI research.",
  },
  microsoft: {
    name: "Microsoft India",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,000+",
    tech_stack: ["C#", ".NET Core", "Azure", "TypeScript", "Python", "OpenAI / Copilot"],
    sectors: ["Enterprise Cloud", "GenAI", "Productivity Software", "Developer Tools"],
    website: "https://microsoft.com",
    careers_url: "https://careers.microsoft.com",
    founded_year: 1975,
    short_description: "R&D engineering center leading Microsoft 365, Azure Cloud Core, Teams, and Copilot AI systems.",
  },
  cisco: {
    name: "Cisco Systems India",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,000+",
    tech_stack: ["C", "C++", "Python", "SDN", "Cloud Networking", "Linux Kernel"],
    sectors: ["Cloud Security", "Enterprise Networking", "SDN", "Silicon"],
    website: "https://cisco.com",
    careers_url: "https://jobs.cisco.com",
    founded_year: 1984,
    short_description: "Cisco's largest R&D campus outside the US, engineering enterprise routing, security, and cloud fabrics.",
  },
  intel: {
    name: "Intel India",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "5,000+",
    tech_stack: ["Verilog", "VHDL", "C++", "Python", "OpenVINO", "Silicon Design"],
    sectors: ["Semiconductors", "DeepTech", "AI Accelerators", "Edge Computing"],
    website: "https://intel.com",
    careers_url: "https://jobs.intel.com",
    founded_year: 1968,
    short_description: "Semiconductor architecture design, validation, processor silicon, and OpenVINO AI software.",
  },
  flipkart: {
    name: "Flipkart",
    company_type: "product_saas",
    funding_stage: "Unicorn",
    employee_range: "5,000+",
    tech_stack: ["Java", "Python", "Kafka", "HBase", "React", "Docker", "GCP"],
    sectors: ["E-Commerce", "FinTech", "Supply Chain", "AdTech"],
    website: "https://flipkart.com",
    careers_url: "https://flipkartcareers.com",
    founded_year: 2007,
    short_description: "India's pioneer e-commerce marketplace platform operating hyper-scale logistics and payments.",
  },
  swiggy: {
    name: "Swiggy",
    company_type: "product_saas",
    funding_stage: "Public",
    employee_range: "5,000+",
    tech_stack: ["Go", "Java", "Python", "AWS", "Kafka", "Spark", "React Native"],
    sectors: ["Quick Commerce", "Food Tech", "Hyperlocal Logistics", "FinTech"],
    website: "https://swiggy.com",
    careers_url: "https://careers.swiggy.com",
    founded_year: 2014,
    short_description: "On-demand convenience platform powering food delivery, Instamart quick-commerce, and hyperlocal fulfillment.",
  },
  razorpay: {
    name: "Razorpay",
    company_type: "product_saas",
    funding_stage: "Unicorn",
    employee_range: "1,000-5,000",
    tech_stack: ["Go", "PHP", "React", "Kafka", "AWS", "Kubernetes", "PostgreSQL"],
    sectors: ["FinTech", "Digital Payments", "Neo-Banking", "Payroll Tech"],
    website: "https://razorpay.com",
    careers_url: "https://razorpay.com/jobs",
    founded_year: 2014,
    short_description: "Full-stack financial services and digital payments gateway powering millions of Indian businesses.",
  },
  phonepe: {
    name: "PhonePe",
    company_type: "product_saas",
    funding_stage: "Unicorn",
    employee_range: "1,000-5,000",
    tech_stack: ["Java", "HBase", "Aerospike", "Kafka", "React", "Kotlin"],
    sectors: ["FinTech", "UPI Payments", "WealthTech", "Insurance"],
    website: "https://phonepe.com",
    careers_url: "https://phonepe.com/careers",
    founded_year: 2015,
    short_description: "India's leading digital payments and financial services platform with 500M+ registered users.",
  },
  cred: {
    name: "CRED",
    company_type: "startup",
    funding_stage: "Unicorn",
    employee_range: "501-1000",
    tech_stack: ["Go", "PostgreSQL", "Kafka", "Kubernetes", "Flutter", "AWS"],
    sectors: ["FinTech", "Credit & Rewards", "E-Commerce", "Payments"],
    website: "https://cred.club",
    careers_url: "https://careers.cred.club",
    founded_year: 2018,
    short_description: "Reward-centric credit card payment, luxury commerce, and peer-to-peer lending ecosystem.",
  },
  zerodha: {
    name: "Zerodha",
    company_type: "product_saas",
    funding_stage: "Bootstrapped",
    employee_range: "1,000-5,000",
    tech_stack: ["Go", "Python", "PostgreSQL", "Vue.js", "Redis", "Kafka"],
    sectors: ["WealthTech", "Stock Broking", "FinTech", "API Platforms"],
    website: "https://zerodha.com",
    careers_url: "https://zerodha.com/careers",
    founded_year: 2010,
    short_description: "India's largest bootstrapped stock brokerage and financial tech pioneer behind Kite and Rainmatter.",
  },
  postman: {
    name: "Postman",
    company_type: "product_saas",
    funding_stage: "Unicorn",
    employee_range: "501-1000",
    tech_stack: ["Node.js", "TypeScript", "React", "Electron", "AWS", "Docker"],
    sectors: ["Developer Tools", "API Platform", "Enterprise SaaS"],
    website: "https://postman.com",
    careers_url: "https://postman.com/careers",
    founded_year: 2014,
    short_description: "Leading API development and collaboration platform used by over 30 million software developers worldwide.",
  },
  browserstack: {
    name: "BrowserStack",
    company_type: "product_saas",
    funding_stage: "Unicorn",
    employee_range: "1,000-5,000",
    tech_stack: ["Ruby", "Go", "Python", "React", "Kubernetes", "AWS"],
    sectors: ["Developer Tools", "Cloud Testing", "DevOps"],
    website: "https://browserstack.com",
    careers_url: "https://browserstack.com/careers",
    founded_year: 2011,
    short_description: "World's leading software testing platform empowering engineers to test applications on 3,000+ real devices.",
  },
  "ather-energy": {
    name: "Ather Energy",
    company_type: "deeptech_hardware",
    funding_stage: "Public",
    employee_range: "1,000-5,000",
    tech_stack: ["C++", "Embedded Linux", "Python", "React", "AWS IoT", "CAN Bus"],
    sectors: ["Electric Mobility", "CleanTech", "Connected Vehicles", "Battery Tech"],
    website: "https://atherenergy.com",
    careers_url: "https://atherenergy.com/careers",
    founded_year: 2013,
    short_description: "Pioneering Indian electric vehicle OEM engineering intelligent connected scooters and public fast-charging grid.",
  },
};

export function enrichCompany(rawName: string, sampleJobTitle = ""): EnrichedCompanyProfile {
  // Clean company name
  const cleanName = rawName
    .replace(/\b(Pvt\.?|Private|Ltd\.?|Limited|LLP|Inc\.?|Corporation|India|Technologies|Tech)\b/gi, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || rawName;

  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Check known dictionary
  for (const [key, known] of Object.entries(KNOWN_TECH_COMPANIES)) {
    if (slug.includes(key) || key.includes(slug)) {
      return {
        name: known.name || rawName,
        slug,
        company_type: known.company_type || "product_saas",
        funding_stage: known.funding_stage || "Series B",
        employee_range: known.employee_range || "201-500",
        tech_stack: known.tech_stack || ["TypeScript", "Node.js", "React", "AWS", "PostgreSQL"],
        sectors: known.sectors || ["Enterprise SaaS", "Software Systems"],
        website: known.website || `https://${slug}.com`,
        careers_url: known.careers_url,
        founded_year: known.founded_year || 2018,
        short_description: known.short_description || `${rawName} software engineering and technology operations in Bengaluru.`,
      };
    }
  }

  // Dynamic heuristic classification
  const lowerName = rawName.toLowerCase();
  const lowerTitle = sampleJobTitle.toLowerCase();

  let company_type: EnrichedCompanyProfile["company_type"] = "product_saas";
  if (lowerName.includes("technologies") || lowerName.includes("infotech") || lowerName.includes("solutions") || lowerName.includes("consultancy") || lowerName.includes("services")) {
    company_type = "it_services_consulting";
  } else if (lowerName.includes("labs") || lowerName.includes("ai") || lowerName.includes("robotics") || lowerName.includes("hardware") || lowerName.includes("motor") || lowerName.includes("energy")) {
    company_type = "deeptech_hardware";
  } else if (lowerName.includes("global") || lowerName.includes("systems") || lowerName.includes("corporation")) {
    company_type = "tech_giant_mnc";
  } else if (lowerName.includes("pay") || lowerName.includes("tech") || lowerName.includes("app")) {
    company_type = "startup";
  }

  // Derive tech stack from job title & role signals
  const tech_stack: string[] = [];
  if (lowerTitle.includes("python") || lowerTitle.includes("data") || lowerTitle.includes("ai") || lowerTitle.includes("ml")) {
    tech_stack.push("Python", "PyTorch", "FastAPI", "PostgreSQL");
  }
  if (lowerTitle.includes("java") || lowerTitle.includes("spring")) {
    tech_stack.push("Java", "Spring Boot", "Kafka", "AWS");
  }
  if (lowerTitle.includes("react") || lowerTitle.includes("frontend") || lowerTitle.includes("ui")) {
    tech_stack.push("React", "TypeScript", "Next.js", "TailwindCSS");
  }
  if (lowerTitle.includes("go") || lowerTitle.includes("backend") || lowerTitle.includes("systems")) {
    tech_stack.push("Go", "Kubernetes", "gRPC", "Docker");
  }
  if (lowerTitle.includes("devops") || lowerTitle.includes("cloud") || lowerTitle.includes("sre")) {
    tech_stack.push("AWS", "Terraform", "Kubernetes", "Docker", "Linux");
  }
  if (tech_stack.length === 0) {
    tech_stack.push("TypeScript", "Python", "React", "PostgreSQL", "AWS");
  }

  return {
    name: rawName,
    slug,
    company_type,
    funding_stage: company_type === "tech_giant_mnc" ? "GCC" : company_type === "it_services_consulting" ? "Public" : "Series B",
    employee_range: company_type === "tech_giant_mnc" || company_type === "it_services_consulting" ? "5,000+" : "201-500",
    tech_stack,
    sectors: [company_type === "deeptech_hardware" ? "DeepTech & Hardware" : company_type === "it_services_consulting" ? "IT Consulting & Cloud" : "Enterprise SaaS & Web"],
    website: `https://${slug}.com`,
    founded_year: 2015,
    short_description: `${rawName} software engineering, research, and technical product development in Bengaluru.`,
  };
}
