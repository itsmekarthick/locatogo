import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Parse .env
const envFile = fs.readFileSync(".env", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const TECH_COMPANIES_SEED = [
  {
    title: "Google India (Bengaluru Tech Center)",
    slug: "google-bengaluru-tech-center",
    locality: "Old Madras Road",
    city: "Bengaluru",
    address_line_1: "RMZ Infinity, Tower E, No. 3, Old Madras Rd, Sadanandanagar",
    latitude: 12.9936,
    longitude: 77.6607,
    website: "https://about.google",
    careers_url: "https://careers.google.com/locations/bangalore",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "10,000+",
    tech_stack: ["Go", "C++", "Python", "Kubernetes", "Borg", "TensorFlow", "Angular"],
    founded_year: 1998,
    short_description: "Google's major India development campus building Search, Cloud, YouTube, Android, and AI infrastructure.",
    jobs: [
      { title: "Software Engineer III - Distributed Systems", dept: "Google Cloud", type: "hybrid", salary: "₹45L - ₹65L", apply: "https://careers.google.com" },
      { title: "Staff AI Research Scientist", dept: "Google DeepMind", type: "on_site", salary: "₹70L - ₹1.1Cr", apply: "https://careers.google.com" },
      { title: "Senior Engineering Manager - Android & OS", dept: "Android Platform", type: "hybrid", salary: "₹85L - ₹1.3Cr", apply: "https://careers.google.com" },
    ],
  },
  {
    title: "Microsoft India Development Center",
    slug: "microsoft-india-bengaluru",
    locality: "Bellandur (ORR)",
    city: "Bengaluru",
    address_line_1: "Prestige Ferns Galaxy, Outer Ring Road, Ambalipura, Bellandur",
    latitude: 12.9248,
    longitude: 77.6749,
    website: "https://www.microsoft.com",
    careers_url: "https://careers.microsoft.com/us/en/search-results?q=Bengaluru",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "10,000+",
    tech_stack: ["C#", ".NET", "Azure", "TypeScript", "Python", "OpenAI / Copilot"],
    founded_year: 1975,
    short_description: "R&D engineering center leading Microsoft 365, Azure Cloud, Teams, and Copilot AI technologies.",
    jobs: [
      { title: "Principal Software Engineer - Azure Cloud Core", dept: "Azure Systems", type: "hybrid", salary: "₹65L - ₹90L", apply: "https://careers.microsoft.com" },
      { title: "Applied AI Scientist II - Copilot Platforms", dept: "AI & Research", type: "hybrid", salary: "₹50L - ₹75L", apply: "https://careers.microsoft.com" },
    ],
  },
  {
    title: "Adobe Systems India",
    slug: "adobe-systems-bengaluru",
    locality: "Bellandur",
    city: "Bengaluru",
    address_line_1: "Prestige Platina Tech Park, Kadubeesanahalli, Outer Ring Rd",
    latitude: 12.9435,
    longitude: 77.6954,
    website: "https://www.adobe.com",
    careers_url: "https://careers.adobe.com",
    company_type: "product_saas",
    funding_stage: "GCC",
    employee_range: "5,000 - 10,000",
    tech_stack: ["C++", "WebAssembly", "React", "AWS", "Machine Learning", "Firefly AI"],
    founded_year: 1982,
    short_description: "Core product development engineering for Adobe Photoshop, Illustrator, Premiere Pro, and Experience Platform.",
    jobs: [
      { title: "Senior Computer Vision / GenAI Engineer", dept: "Adobe Firefly", type: "hybrid", salary: "₹45L - ₹65L", apply: "https://careers.adobe.com" },
      { title: "Staff Web Platform Engineer (Wasm & WebGL)", dept: "Creative Cloud", type: "hybrid", salary: "₹55L - ₹80L", apply: "https://careers.adobe.com" },
    ],
  },
  {
    title: "Swiggy Headquarters",
    slug: "swiggy-headquarters-bengaluru",
    locality: "Devarabisanahalli",
    city: "Bengaluru",
    address_line_1: "Tower D, 9th Floor, IBC Knowledge Park, Bannerghatta Rd / ORR",
    latitude: 12.9348,
    longitude: 77.6908,
    website: "https://www.swiggy.com",
    careers_url: "https://careers.swiggy.com",
    company_type: "startup",
    funding_stage: "Public",
    employee_range: "5,000+",
    tech_stack: ["Go", "Java", "Kubernetes", "Kafka", "AWS", "Flutter", "Redis"],
    founded_year: 2014,
    short_description: "India's leading on-demand convenience platform powering food delivery, Instamart quick commerce, and Dineout.",
    jobs: [
      { title: "Lead Backend Engineer - Instamart Logistics", dept: "Supply Chain Tech", type: "hybrid", salary: "₹45L - ₹65L", apply: "https://careers.swiggy.com" },
      { title: "Data Scientist II - Real-Time Dynamic Pricing", dept: "Data & ML", type: "hybrid", salary: "₹35L - ₹50L", apply: "https://careers.swiggy.com" },
      { title: "Senior Android Platform Engineer", dept: "Consumer Experience", type: "hybrid", salary: "₹38L - ₹55L", apply: "https://careers.swiggy.com" },
    ],
  },
  {
    title: "Razorpay Headquarters",
    slug: "razorpay-headquarters-bengaluru",
    locality: "Koramangala",
    city: "Bengaluru",
    address_line_1: "SJR Cyber Ladu, 1st Cross Rd, 7th Block, Koramangala",
    latitude: 12.9352,
    longitude: 77.6245,
    website: "https://razorpay.com",
    careers_url: "https://razorpay.com/jobs",
    company_type: "startup",
    funding_stage: "Unicorn",
    employee_range: "2,500+",
    tech_stack: ["Go", "PHP / Laravel", "React", "Kafka", "PostgreSQL", "AWS"],
    founded_year: 2014,
    short_description: "Full-stack financial services and payments infrastructure unicorn powering internet commerce across India and Southeast Asia.",
    jobs: [
      { title: "Senior Distributed Systems Engineer (Payments Gateway)", dept: "Core Payments", type: "hybrid", salary: "₹40L - ₹60L", apply: "https://razorpay.com/jobs" },
      { title: "Product Manager - Banking as a Service (RazorpayX)", dept: "Product & FinOps", type: "hybrid", salary: "₹35L - ₹50L", apply: "https://razorpay.com/jobs" },
    ],
  },
  {
    title: "Zerodha Headquarters",
    slug: "zerodha-headquarters-bengaluru",
    locality: "JP Nagar",
    city: "Bengaluru",
    address_line_1: "153/154, 4th Cross, Dollars Colony, JP Nagar 4th Phase",
    latitude: 12.9081,
    longitude: 77.5959,
    website: "https://zerodha.com",
    careers_url: "https://zerodha.com/careers",
    company_type: "product_saas",
    funding_stage: "Bootstrapped",
    employee_range: "1,000 - 2,000",
    tech_stack: ["Go", "Python", "Vue.js", "PostgreSQL", "Redis", "HAProxy", "Kafka"],
    founded_year: 2010,
    short_description: "India's largest retail stock broker and bootstrapped fintech pioneer, handling billions of dollars in daily market turnover.",
    jobs: [
      { title: "Systems & Infrastructure Engineer", dept: "Tech Operations", type: "on_site", salary: "Competitive + Profit Share", apply: "https://zerodha.com/careers" },
      { title: "Fullstack Developer (Go & Python)", dept: "Kite Platform", type: "on_site", salary: "Competitive + Profit Share", apply: "https://zerodha.com/careers" },
    ],
  },
  {
    title: "Postman Tech Hub",
    slug: "postman-tech-hub-bengaluru",
    locality: "Indiranagar",
    city: "Bengaluru",
    address_line_1: "100 Feet Rd, HAL 2nd Stage, Indiranagar",
    latitude: 12.9719,
    longitude: 77.6412,
    website: "https://www.postman.com",
    careers_url: "https://www.postman.com/careers",
    company_type: "product_saas",
    funding_stage: "Unicorn",
    employee_range: "1,000+",
    tech_stack: ["Node.js", "TypeScript", "React", "Electron", "AWS", "GraphQL"],
    founded_year: 2014,
    short_description: "World's leading API collaboration platform used by over 30 million developers across global enterprise engineering teams.",
    jobs: [
      { title: "Staff Software Engineer - API Runtime & Engine", dept: "Core Engineering", type: "remote", salary: "₹55L - ₹80L", apply: "https://www.postman.com/careers" },
      { title: "Senior Product Designer - Developer Ergonomics", dept: "Product Experience", type: "hybrid", salary: "₹35L - ₹50L", apply: "https://www.postman.com/careers" },
    ],
  },
  {
    title: "Infosys Global Headquarters",
    slug: "infosys-global-hq-electronic-city",
    locality: "Electronic City",
    city: "Bengaluru",
    address_line_1: "Electronics City, Hosur Rd, Konappana Agrahara",
    latitude: 12.8499,
    longitude: 77.6633,
    website: "https://www.infosys.com",
    careers_url: "https://www.infosys.com/careers.html",
    company_type: "it_services_consulting",
    funding_stage: "Public",
    employee_range: "100,000+",
    tech_stack: ["Java", "Spring Boot", "Cloud Migration", "AI / Topaz", "SAP", "Salesforce"],
    founded_year: 1981,
    short_description: "Global consulting and next-generation digital services enterprise operating across 56 countries.",
    jobs: [
      { title: "Lead AI & Cloud Architect", dept: "Infosys Topaz AI", type: "hybrid", salary: "₹28L - ₹42L", apply: "https://www.infosys.com/careers.html" },
      { title: "Principal Consultant - Enterprise SAP S/4HANA", dept: "Enterprise Solutions", type: "hybrid", salary: "₹30L - ₹45L", apply: "https://www.infosys.com/careers.html" },
    ],
  },
  {
    title: "Sarvam AI Research Lab",
    slug: "sarvam-ai-bengaluru",
    locality: "Koramangala",
    city: "Bengaluru",
    address_line_1: "80 Feet Rd, 4th Block, Koramangala",
    latitude: 12.9344,
    longitude: 77.6291,
    website: "https://www.sarvam.ai",
    careers_url: "https://www.sarvam.ai/careers",
    company_type: "startup",
    funding_stage: "Series A",
    employee_range: "50-100",
    tech_stack: ["PyTorch", "CUDA", "Triton", "Python", "Transformers", "Distributed Training"],
    founded_year: 2023,
    short_description: "Frontier AI lab developing foundational Large Language Models and voice intelligence tailored for Indian languages.",
    jobs: [
      { title: "Frontier Foundation Model Pretraining Researcher", dept: "LLM Core", type: "on_site", salary: "₹60L - ₹1.0Cr + Equity", apply: "https://www.sarvam.ai/careers" },
      { title: "High-Performance GPU Systems Engineer (CUDA/C++)", dept: "Compute Infra", type: "on_site", salary: "₹50L - ₹85L + Equity", apply: "https://www.sarvam.ai/careers" },
    ],
  },
  {
    title: "Goldman Sachs Technology Center",
    slug: "goldman-sachs-tech-manyata",
    locality: "Manyata Tech Park",
    city: "Bengaluru",
    address_line_1: "Helios Business Park / Manyata Tech Park, Outer Ring Rd, Nagawara",
    latitude: 13.0494,
    longitude: 77.6202,
    website: "https://www.goldmansachs.com",
    careers_url: "https://www.goldmansachs.com/careers",
    company_type: "tech_giant_mnc",
    funding_stage: "GCC",
    employee_range: "10,000+",
    tech_stack: ["Java", "C++", "Python", "Kafka", "Slang", "AWS", "Financial Markets"],
    founded_year: 1869,
    short_description: "Goldman Sachs' largest global technology and engineering hub outside New York, engineering high-frequency trading platforms and financial cloud.",
    jobs: [
      { title: "Vice President - Ultra-Low Latency Trading Systems", dept: "Global Markets Tech", type: "hybrid", salary: "₹75L - ₹1.2Cr", apply: "https://www.goldmansachs.com/careers" },
      { title: "Quantitative Risk & Analytics Engineer", dept: "Core Engineering", type: "hybrid", salary: "₹45L - ₹68L", apply: "https://www.goldmansachs.com/careers" },
    ],
  },
];

async function seedTechAtlas() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 1. Get or create primary tenant
  const { data: tenants } = await supabase.from("tenants").select("id").limit(1);
  if (!tenants || !tenants.length) {
    console.error("No tenants found in database.");
    return;
  }
  const tenantId = tenants[0].id;

  // 2. Get or create Bangalore domain
  let { data: domain } = await supabase
    .from("domains")
    .select("id")
    .eq("tenant_id", tenantId)
    .limit(1)
    .maybeSingle();

  if (!domain) {
    const { data: newDomain } = await supabase
      .from("domains")
      .insert({
        tenant_id: tenantId,
        name: "Bengaluru Tech Atlas",
        slug: "bengaluru",
        default_latitude: 12.9716,
        default_longitude: 77.5946,
      })
      .select("id")
      .single();
    domain = newDomain;
  }

  // 3. Get or create Tech & IT category
  let { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("name", "%Tech%")
    .limit(1)
    .maybeSingle();

  if (!category) {
    const { data: newCat } = await supabase
      .from("categories")
      .insert({
        tenant_id: tenantId,
        domain_id: domain.id,
        name: "Tech & Software Hubs",
        slug: "tech-software",
        icon: "💻",
        pin_color: "#6366f1",
      })
      .select("id")
      .single();
    category = newCat;
  }

  console.log(`Starting Tech Atlas Seeding for tenant: ${tenantId}...`);

  let count = 0;
  for (const company of TECH_COMPANIES_SEED) {
    // Insert or update listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .upsert(
        {
          tenant_id: tenantId,
          domain_id: domain.id,
          category_id: category.id,
          title: company.title,
          slug: company.slug,
          short_description: company.short_description,
          address_line_1: company.address_line_1,
          locality: company.locality,
          city: company.city,
          administrative_area: "Karnataka",
          country_code: "IN",
          latitude: company.latitude,
          longitude: company.longitude,
          website: company.website,
          careers_url: company.careers_url,
          company_type: company.company_type,
          funding_stage: company.funding_stage,
          employee_range: company.employee_range,
          tech_stack: company.tech_stack,
          founded_year: company.founded_year,
          active_jobs_count: company.jobs.length,
          status: "published",
          verification_status: "verified",
          is_featured: true,
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (listingError || !listing) {
      console.error(`Error inserting listing for ${company.title}:`, listingError);
      continue;
    }

    // Insert jobs for this listing
    for (const j of company.jobs) {
      await supabase.from("company_jobs").insert({
        tenant_id: tenantId,
        company_profile_id: listing.id, // Fallback if profiles not yet created
        listing_id: listing.id,
        title: j.title,
        department: j.dept,
        location_name: `${company.locality}, Bengaluru`,
        workplace_type: j.type,
        salary_range: j.salary,
        apply_url: j.apply,
        is_active: true,
      });
    }

    count++;
    console.log(`✓ Seeded ${company.title} (${company.jobs.length} jobs)`);
  }

  console.log(`\nSuccessfully seeded ${count} global tech employers with live careers data!`);
}

seedTechAtlas();
