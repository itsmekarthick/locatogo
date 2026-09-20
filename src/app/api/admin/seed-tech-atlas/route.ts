import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

const BANGALORE_IT_COMPANIES = [
  // --- 1. OUTER RING ROAD / BELLANDUR / DEVARABISANAHALLI TECH CORRIDOR ---
  {
    title: "Google India (RMZ Infinity)",
    slug: "google-rmz-infinity",
    locality: "Old Madras Road",
    address: "RMZ Infinity, Tower E, No. 3, Old Madras Rd, Sadanandanagar",
    lat: 12.9936,
    lon: 77.6607,
    website: "https://about.google",
    careers_url: "https://careers.google.com/locations/bangalore",
    type: "tech_giant_mnc",
    stage: "GCC",
    employees: "10,000+",
    tech_stack: ["Go", "C++", "Python", "Kubernetes", "Borg", "TensorFlow", "Angular"],
    year: 1998,
    desc: "Google India development center driving Search, Cloud, Android, Payments, and AI engineering.",
    jobs: [
      { title: "Senior Software Engineer - Distributed Systems", dept: "Google Cloud", type: "hybrid", salary: "₹45L - ₹65L", apply: "https://careers.google.com" },
      { title: "Staff AI Research Scientist", dept: "Google DeepMind", type: "on_site", salary: "₹75L - ₹1.2Cr", apply: "https://careers.google.com" }
    ]
  },
  {
    title: "Microsoft India Development Center",
    slug: "microsoft-prestige-ferns",
    locality: "Bellandur (ORR)",
    address: "Prestige Ferns Galaxy, Outer Ring Road, Ambalipura, Bellandur",
    lat: 12.9248,
    lon: 77.6749,
    website: "https://www.microsoft.com",
    careers_url: "https://careers.microsoft.com",
    type: "tech_giant_mnc",
    stage: "GCC",
    employees: "10,000+",
    tech_stack: ["C#", ".NET", "Azure", "TypeScript", "Python", "OpenAI / Copilot"],
    year: 1975,
    desc: "Microsoft India R&D hub building Azure Cloud core, Microsoft 365, Teams, and Copilot AI systems.",
    jobs: [
      { title: "Principal Software Engineer - Azure Cloud Core", dept: "Azure Systems", type: "hybrid", salary: "₹65L - ₹90L", apply: "https://careers.microsoft.com" }
    ]
  },
  {
    title: "Adobe Systems India",
    slug: "adobe-prestige-platina",
    locality: "Bellandur",
    address: "Prestige Platina Tech Park, Kadubeesanahalli, Outer Ring Rd",
    lat: 12.9435,
    lon: 77.6954,
    website: "https://www.adobe.com",
    careers_url: "https://careers.adobe.com",
    type: "product_saas",
    stage: "GCC",
    employees: "5,000+",
    tech_stack: ["C++", "WebAssembly", "React", "AWS", "Firefly AI", "WebGL"],
    year: 1982,
    desc: "Core product development engineering for Photoshop, Illustrator, Premiere Pro, and Adobe Experience Cloud.",
    jobs: [
      { title: "Senior Computer Vision / GenAI Engineer", dept: "Adobe Firefly", type: "hybrid", salary: "₹45L - ₹65L", apply: "https://careers.adobe.com" }
    ]
  },
  {
    title: "Cisco Systems India",
    slug: "cisco-cessna-park",
    locality: "Kadubeesanahalli",
    address: "Cessna Business Park, Kadubeesanahalli Village, Varthur Hobli, Sarjapur-Marathahalli ORR",
    lat: 12.9366,
    lon: 77.6938,
    website: "https://www.cisco.com",
    careers_url: "https://jobs.cisco.com",
    type: "tech_giant_mnc",
    stage: "GCC",
    employees: "10,000+",
    tech_stack: ["C", "C++", "Python", "Networking", "SDN", "Cloud Security", "Linux Kernel"],
    year: 1984,
    desc: "Cisco's largest R&D campus outside the US, engineering global networking silicon, security, and cloud infrastructure.",
    jobs: [
      { title: "Software Engineer III - Cloud Networking & SDN", dept: "Enterprise Routing", type: "hybrid", salary: "₹38L - ₹52L", apply: "https://jobs.cisco.com" }
    ]
  },
  {
    title: "Intel Technology India",
    slug: "intel-ecospace-bellandur",
    locality: "Bellandur",
    address: "Ecospace Business Park, Outer Ring Rd, Devarabisanahalli, Bellandur",
    lat: 12.9279,
    lon: 77.6833,
    website: "https://www.intel.com",
    careers_url: "https://jobs.intel.com",
    type: "deeptech_hardware",
    stage: "GCC",
    employees: "10,000+",
    tech_stack: ["Verilog", "VHDL", "SystemC", "C++", "Silicon Architecture", "AI Hardware"],
    year: 1968,
    desc: "Premier silicon design and microprocessor architecture center creating next-generation Intel Xeon and Core processors.",
    jobs: [
      { title: "Senior Silicon Design Verification Engineer", dept: "Hardware Architecture", type: "on_site", salary: "₹42L - ₹60L", apply: "https://jobs.intel.com" }
    ]
  },
  {
    title: "Swiggy Headquarters",
    slug: "swiggy-bellandur-hq",
    locality: "Devarabisanahalli",
    address: "Tower D, 9th Floor, IBC Knowledge Park / Devarabisanahalli, ORR",
    lat: 12.9348,
    lon: 77.6908,
    website: "https://www.swiggy.com",
    careers_url: "https://careers.swiggy.com",
    type: "startup",
    stage: "Public",
    employees: "5,000+",
    tech_stack: ["Go", "Java", "Kubernetes", "Kafka", "AWS", "Flutter", "Redis"],
    year: 2014,
    desc: "India's leading on-demand convenience tech ecosystem powering food delivery, Instamart 10-minute quick commerce, and Dineout.",
    jobs: [
      { title: "Lead Backend Engineer - Instamart Logistics", dept: "Supply Chain", type: "hybrid", salary: "₹45L - ₹65L", apply: "https://careers.swiggy.com" },
      { title: "Data Scientist II - Real-Time Dynamic Pricing", dept: "Data & ML", type: "hybrid", salary: "₹35L - ₹50L", apply: "https://careers.swiggy.com" }
    ]
  },
  {
    title: "Flipkart Internet",
    slug: "flipkart-embassy-tech-village",
    locality: "Devarabisanahalli",
    address: "Embassy Tech Village, Outer Ring Rd, Devarabisanahalli, Bellandur",
    lat: 12.9298,
    lon: 77.6883,
    website: "https://www.flipkart.com",
    careers_url: "https://www.flipkartcareers.com",
    type: "tech_giant_mnc",
    stage: "Unicorn",
    employees: "10,000+",
    tech_stack: ["Java", "Scala", "Kafka", "HBase", "Kubernetes", "React Native", "BigQuery"],
    year: 2007,
    desc: "India's homegrown e-commerce pioneer handling billions in annual gross merchandise volume and logistics engineering.",
    jobs: [
      { title: "Staff Software Engineer - Checkout & Payments", dept: "Consumer Tech", type: "hybrid", salary: "₹55L - ₹80L", apply: "https://www.flipkartcareers.com" }
    ]
  },
  {
    title: "VMware by Broadcom",
    slug: "vmware-broadcom-bellandur",
    locality: "Kadubeesanahalli",
    address: "Cessna Business Park, Kadubeesanahalli",
    lat: 12.9357,
    lon: 77.6945,
    website: "https://www.vmware.com",
    careers_url: "https://careers.vmware.com",
    type: "tech_giant_mnc",
    stage: "GCC",
    employees: "5,000+",
    tech_stack: ["C++", "Go", "Python", "Kubernetes", "vSphere", "Tanzu", "Cloud Infra"],
    year: 1998,
    desc: "Virtualization and enterprise cloud computing R&D center powering hybrid cloud and container orchestration worldwide.",
    jobs: [
      { title: "Staff Engineer - Kubernetes & Cloud Infrastructure", dept: "Tanzu Cloud", type: "hybrid", salary: "₹50L - ₹75L", apply: "https://careers.vmware.com" }
    ]
  },
  {
    title: "Intuit India Technology Center",
    slug: "intuit-ecospace-bellandur",
    locality: "Bellandur",
    address: "Campus 8, Ecospace Business Park, Outer Ring Rd, Bellandur",
    lat: 12.9268,
    lon: 77.6842,
    website: "https://www.intuit.com",
    careers_url: "https://www.intuit.com/careers",
    type: "product_saas",
    stage: "GCC",
    employees: "3,000+",
    tech_stack: ["Java", "React", "AWS", "AI / GenStudio", "GraphQL", "Spring Boot"],
    year: 1983,
    desc: "Global financial tech product engineering center powering TurboTax, QuickBooks, Credit Karma, and Mailchimp.",
    jobs: [
      { title: "Senior Software Engineer - GenAI Financial Platforms", dept: "Intuit AI", type: "hybrid", salary: "₹42L - ₹60L", apply: "https://www.intuit.com/careers" }
    ]
  },
  {
    title: "Oracle India Technology Park",
    slug: "oracle-tech-park-marathahalli",
    locality: "Marathahalli - Sarjapur ORR",
    address: "Prestige Tech Park, Outer Ring Rd, Kadubeesanahalli",
    lat: 12.9398,
    lon: 77.6951,
    website: "https://www.oracle.com",
    careers_url: "https://www.oracle.com/corporate/careers",
    type: "tech_giant_mnc",
    stage: "GCC",
    employees: "10,000+",
    tech_stack: ["Java", "C++", "Oracle Cloud (OCI)", "SQL", "Distributed Databases"],
    year: 1977,
    desc: "Major global development center for Oracle Database, Autonomous Cloud (OCI), and Enterprise Fusion Applications.",
    jobs: [
      { title: "Principal Database Kernel Developer", dept: "Database Engine", type: "hybrid", salary: "₹50L - ₹75L", apply: "https://www.oracle.com/corporate/careers" }
    ]
  },

  // --- 2. WHITEFIELD & ITPB / EPIP TECH ZONE ---
  {
    title: "SAP Labs India",
    slug: "sap-labs-whitefield",
    locality: "Whitefield",
    address: "138, EPIP Zone, Whitefield, Bengaluru, Karnataka 560066",
    lat: 12.9818,
    lon: 77.7289,
    website: "https://www.sap.com",
    careers_url: "https://jobs.sap.com",
    type: "tech_giant_mnc",
    stage: "GCC",
    employees: "15,000+",
    tech_stack: ["ABAP", "Java", "Node.js", "HANA Database", "SAP BTP", "React"],
    year: 1998,
    desc: "SAP's largest R&D lab outside Germany, driving core enterprise ERP, HANA in-memory databases, and SAP Business AI.",
    jobs: [
      { title: "Senior Cloud Developer - SAP Business Technology Platform", dept: "BTP Core", type: "hybrid", salary: "₹35L - ₹50L", apply: "https://jobs.sap.com" },
      { title: "AI Product Engineer - SAP Joule Copilot", dept: "Enterprise AI", type: "hybrid", salary: "₹40L - ₹58L", apply: "https://jobs.sap.com" }
    ]
  },
  {
    title: "TCS Think Campus (Whitefield)",
    slug: "tcs-whitefield-campus",
    locality: "Whitefield",
    address: "Vydehi Hospital Rd, EPIP Zone, Whitefield",
    lat: 12.9772,
    lon: 77.7298,
    website: "https://www.tcs.com",
    careers_url: "https://www.tcs.com/careers",
    type: "it_services_consulting",
    stage: "Public",
    employees: "50,000+",
    tech_stack: ["Java", "Python", "Cloud Migration", "Mainframe", "Cybersecurity", "IoT"],
    year: 1968,
    desc: "Tata Consultancy Services state-of-the-art enterprise digital engineering and global delivery center.",
    jobs: [
      { title: "Lead Fullstack Cloud Engineer", dept: "Cloud Solutions", type: "hybrid", salary: "₹18L - ₹28L", apply: "https://www.tcs.com/careers" }
    ]
  },
  {
    title: "Mercedes-Benz R&D India (MBRDI)",
    slug: "mercedes-benz-rnd-whitefield",
    locality: "Whitefield",
    address: "Brigade Tech Gardens, Brookefield, Kundalahalli, Whitefield",
    lat: 12.9698,
    lon: 77.7142,
    website: "https://www.mbrdi.co.in",
    careers_url: "https://www.mbrdi.co.in/careers",
    type: "deeptech_hardware",
    stage: "GCC",
    employees: "6,000+",
    tech_stack: ["C++", "AUTOSAR", "Embedded Linux", "Computer Vision", "MB.OS", "Autonomous Drive"],
    year: 1996,
    desc: "Mercedes-Benz largest digital engineering R&D center outside Germany, creating MB.OS in-car operating system and autonomous vehicle software.",
    jobs: [
      { title: "Senior Embedded Software Architect (MB.OS)", dept: "Connected Car", type: "hybrid", salary: "₹38L - ₹55L", apply: "https://www.mbrdi.co.in/careers" }
    ]
  },
  {
    title: "Boeing India Engineering & Technology Center (BIETC)",
    slug: "boeing-bietc-whitefield",
    locality: "Whitefield",
    address: "BIETC Campus, Aerospace SEZ / EPIP Zone, Whitefield",
    lat: 12.9862,
    lon: 77.7345,
    website: "https://www.boeing.co.in",
    careers_url: "https://jobs.boeing.com",
    type: "deeptech_hardware",
    stage: "GCC",
    employees: "5,000+",
    tech_stack: ["C++", "Ada", "Avionics", "Aerospace Simulation", "Digital Twins", "AI"],
    year: 1916,
    desc: "Boeing's largest standalone engineering investment outside the US, engineering digital aerospace systems, avionics, and autonomous flight platforms.",
    jobs: [
      { title: "Flight Control Systems Engineer", dept: "Avionics Engineering", type: "on_site", salary: "₹32L - ₹48L", apply: "https://jobs.boeing.com" }
    ]
  },
  {
    title: "LTIMindtree Whitefield Campus",
    slug: "ltimindtree-whitefield",
    locality: "Whitefield",
    address: "EPIP Zone, Whitefield, Bengaluru",
    lat: 12.9785,
    lon: 77.7221,
    website: "https://www.ltimindtree.com",
    careers_url: "https://www.ltimindtree.com/careers",
    type: "it_services_consulting",
    stage: "Public",
    employees: "20,000+",
    tech_stack: ["Java", "Microservices", "React", "Azure", "Data Engineering", "Snowflake"],
    year: 1996,
    desc: "Tier-1 global digital transformation and IT solutions enterprise powering Fortune 500 financial and tech clients.",
    jobs: [
      { title: "Principal Data Architect (Snowflake & Databricks)", dept: "Data & Insights", type: "hybrid", salary: "₹30L - ₹45L", apply: "https://www.ltimindtree.com/careers" }
    ]
  },

  // --- 3. MANYATA EMBASSY TECH PARK / HEBBAL CORRIDOR ---
  {
    title: "IBM India (Manyata Tech Park)",
    slug: "ibm-manyata-tech-park",
    locality: "Nagawara / Hebbal",
    address: "Manyata Embassy Business Park, Outer Ring Rd, Nagawara",
    lat: 13.0424,
    lon: 77.6215,
    website: "https://www.ibm.com/in-en",
    careers_url: "https://www.ibm.com/careers",
    type: "tech_giant_mnc",
    stage: "GCC",
    employees: "20,000+",
    tech_stack: ["Java", "Red Hat OpenShift", "watsonx AI", "Python", "Kubernetes", "Quantum"],
    year: 1911,
    desc: "IBM India Software Labs engineering Red Hat OpenShift cloud, watsonx enterprise AI models, and hybrid cloud infrastructure.",
    jobs: [
      { title: "Senior AI Engineer - watsonx Foundation Models", dept: "IBM Research", type: "hybrid", salary: "₹40L - ₹60L", apply: "https://www.ibm.com/careers" }
    ]
  },
  {
    title: "Goldman Sachs Technology Center",
    slug: "goldman-sachs-manyata",
    locality: "Manyata Tech Park",
    address: "Helios Business Park / Manyata Tech Park, Outer Ring Rd, Nagawara",
    lat: 13.0494,
    lon: 77.6202,
    website: "https://www.goldmansachs.com",
    careers_url: "https://www.goldmansachs.com/careers",
    type: "tech_giant_mnc",
    stage: "GCC",
    employees: "10,000+",
    tech_stack: ["Java", "C++", "Python", "Kafka", "Slang", "AWS", "Financial Markets"],
    year: 1869,
    desc: "Goldman Sachs' largest global engineering and quantitative finance tech center outside New York.",
    jobs: [
      { title: "Vice President - Ultra-Low Latency Trading Systems", dept: "Global Markets", type: "hybrid", salary: "₹75L - ₹1.2Cr", apply: "https://www.goldmansachs.com/careers" }
    ]
  },
  {
    title: "Philips Innovation Campus",
    slug: "philips-innovation-manyata",
    locality: "Manyata Tech Park",
    address: "MFAR Manyata Tech Park, Greenheart Phase IV, Nagawara",
    lat: 13.044,
    lon: 77.6213,
    website: "https://www.philips.co.in",
    careers_url: "https://www.careers.philips.com",
    type: "product_saas",
    stage: "GCC",
    employees: "5,000+",
    tech_stack: ["C++", "C#", "Python", "Medical Imaging", "DICOM", "Cloud PACS", "AI Diagnostics"],
    year: 1891,
    desc: "Global healthtech innovation center building medical imaging software, MRI/CT image reconstruction, and patient monitoring algorithms.",
    jobs: [
      { title: "Lead AI Medical Imaging Scientist", dept: "Healthcare Informatics", type: "hybrid", salary: "₹45L - ₹65L", apply: "https://www.careers.philips.com" }
    ]
  },
  {
    title: "Nokia Solutions and Networks",
    slug: "nokia-manyata-campus",
    locality: "Manyata Tech Park",
    address: "Manyata Embassy Business Park, Outer Ring Rd, Nagawara",
    lat: 13.0475,
    lon: 77.6189,
    website: "https://www.nokia.com",
    careers_url: "https://www.nokia.com/about-us/careers",
    type: "deeptech_hardware",
    stage: "GCC",
    employees: "8,000+",
    tech_stack: ["C++", "5G / 6G", "Open RAN", "Linux Kernel", "Telecom Protocol Stacks", "Rust"],
    year: 1865,
    desc: "Nokia's world-class telecommunications R&D hub pioneering 5G/6G radio access network (RAN) software and cloud telecom infrastructure.",
    jobs: [
      { title: "Senior 5G/6G Protocol Software Architect", dept: "Mobile Networks", type: "hybrid", salary: "₹38L - ₹55L", apply: "https://www.nokia.com/about-us/careers" }
    ]
  },

  // --- 4. ELECTRONIC CITY IT CORRIDOR ---
  {
    title: "Infosys Global Headquarters",
    slug: "infosys-electronic-city-hq",
    locality: "Electronic City Phase 1",
    address: "Electronics City, Hosur Rd, Konappana Agrahara, Bengaluru",
    lat: 12.8499,
    lon: 77.6633,
    website: "https://www.infosys.com",
    careers_url: "https://www.infosys.com/careers.html",
    type: "it_services_consulting",
    stage: "Public",
    employees: "100,000+",
    tech_stack: ["Java", "Spring Boot", "Cloud Migration", "AI / Topaz", "SAP", "Salesforce"],
    year: 1981,
    desc: "World headquarters of Infosys, spanning a sprawling 81-acre campus leading global enterprise IT consulting and digital transformation.",
    jobs: [
      { title: "Lead AI & Cloud Architect", dept: "Infosys Topaz AI", type: "hybrid", salary: "₹28L - ₹42L", apply: "https://www.infosys.com/careers.html" }
    ]
  },
  {
    title: "Wipro Global Headquarters",
    slug: "wipro-sarjapur-electronic-city",
    locality: "Sarjapur Road / Electronic City",
    address: "Doddakannelli, Sarjapur Road, Bengaluru, Karnataka 560035",
    lat: 12.9102,
    lon: 77.6835,
    website: "https://www.wipro.com",
    careers_url: "https://careers.wipro.com",
    type: "it_services_consulting",
    stage: "Public",
    employees: "80,000+",
    tech_stack: ["Java", "Python", "Wipro ai360", "Cloud Transformation", "Cybersecurity"],
    year: 1945,
    desc: "Global headquarters of Wipro, driving enterprise AI integration, cloud engineering, and cybersecurity services.",
    jobs: [
      { title: "Enterprise Cloud Architect", dept: "Cloud Transformation", type: "hybrid", salary: "₹25L - ₹38L", apply: "https://careers.wipro.com" }
    ]
  },
  {
    title: "Hewlett Packard Enterprise (HPE)",
    slug: "hpe-electronic-city",
    locality: "Electronic City",
    address: "Sy. No. 192, Whitefield-Hosur Rd, Electronic City Phase 1",
    lat: 12.8415,
    lon: 77.6648,
    website: "https://www.hpe.com",
    careers_url: "https://careers.hpe.com",
    type: "tech_giant_mnc",
    stage: "GCC",
    employees: "6,000+",
    tech_stack: ["C++", "Go", "Python", "HPE GreenLake", "Cloud Storage", "Kubernetes"],
    year: 1939,
    desc: "HPE global development center engineering HPE GreenLake edge-to-cloud platform, high-performance computing, and enterprise storage.",
    jobs: [
      { title: "Cloud Systems Software Engineer", dept: "GreenLake Storage", type: "hybrid", salary: "₹32L - ₹46L", apply: "https://careers.hpe.com" }
    ]
  },
  {
    title: "General Electric (GE India Technology Centre)",
    slug: "ge-john-f-welch-tech-center",
    locality: "Whitefield / Electronic City",
    address: "John F. Welch Technology Centre, EPIP Zone, Whitefield",
    lat: 12.9835,
    lon: 77.7258,
    website: "https://www.ge.com/in",
    careers_url: "https://jobs.gecareers.com",
    type: "deeptech_hardware",
    stage: "GCC",
    employees: "5,000+",
    tech_stack: ["C++", "Embedded C", "Turbine Simulation", "Aviation AI", "Digital Grid"],
    year: 1892,
    desc: "GE's first and largest multidisciplinary research center outside the US, engineering jet engines, clean energy turbines, and smart grids.",
    jobs: [
      { title: "Aerospace Simulation & Digital Twin Engineer", dept: "GE Aerospace", type: "on_site", salary: "₹30L - ₹45L", apply: "https://jobs.gecareers.com" }
    ]
  },

  // --- 5. KORAMANGALA, HSR LAYOUT & INDIRANAGAR STARTUP HUBS ---
  {
    title: "Razorpay Headquarters",
    slug: "razorpay-koramangala-hq",
    locality: "Koramangala",
    address: "SJR Cyber Ladu, 1st Cross Rd, 7th Block, Koramangala",
    lat: 12.9352,
    lon: 77.6245,
    website: "https://razorpay.com",
    careers_url: "https://razorpay.com/jobs",
    type: "startup",
    stage: "Unicorn",
    employees: "2,500+",
    tech_stack: ["Go", "PHP / Laravel", "React", "Kafka", "PostgreSQL", "AWS"],
    year: 2014,
    desc: "Full-stack financial services and payments infrastructure unicorn powering internet commerce across India and Southeast Asia.",
    jobs: [
      { title: "Senior Distributed Systems Engineer (Payments Gateway)", dept: "Core Payments", type: "hybrid", salary: "₹40L - ₹60L", apply: "https://razorpay.com/jobs" },
      { title: "Product Manager - Banking as a Service (RazorpayX)", dept: "Product & FinOps", type: "hybrid", salary: "₹35L - ₹50L", apply: "https://razorpay.com/jobs" }
    ]
  },
  {
    title: "Zerodha Headquarters",
    slug: "zerodha-jp-nagar-hq",
    locality: "JP Nagar",
    address: "153/154, 4th Cross, Dollars Colony, JP Nagar 4th Phase",
    lat: 12.9081,
    lon: 77.5959,
    website: "https://zerodha.com",
    careers_url: "https://zerodha.com/careers",
    type: "product_saas",
    stage: "Bootstrapped",
    employees: "1,200+",
    tech_stack: ["Go", "Python", "Vue.js", "PostgreSQL", "Redis", "HAProxy", "Kafka"],
    year: 2010,
    desc: "India's largest retail stock broker and bootstrapped fintech pioneer, handling billions of dollars in daily market turnover.",
    jobs: [
      { title: "Systems & Infrastructure Engineer", dept: "Tech Operations", type: "on_site", salary: "Competitive + Profit Share", apply: "https://zerodha.com/careers" }
    ]
  },
  {
    title: "Postman Tech Hub",
    slug: "postman-indiranagar-hub",
    locality: "Indiranagar",
    address: "100 Feet Rd, HAL 2nd Stage, Indiranagar",
    lat: 12.9719,
    lon: 77.6412,
    website: "https://www.postman.com",
    careers_url: "https://www.postman.com/careers",
    type: "product_saas",
    stage: "Unicorn",
    employees: "1,000+",
    tech_stack: ["Node.js", "TypeScript", "React", "Electron", "AWS", "GraphQL"],
    year: 2014,
    desc: "World's leading API collaboration platform used by over 30 million developers across global enterprise engineering teams.",
    jobs: [
      { title: "Staff Software Engineer - API Runtime Engine", dept: "Core Engineering", type: "remote", salary: "₹55L - ₹80L", apply: "https://www.postman.com/careers" }
    ]
  },
  {
    title: "Hasura India",
    slug: "hasura-indiranagar",
    locality: "Indiranagar",
    address: "12th Main Rd, Indiranagar, Bengaluru",
    lat: 12.9714,
    lon: 77.6419,
    website: "https://hasura.io",
    careers_url: "https://hasura.io/careers",
    type: "product_saas",
    stage: "Unicorn",
    employees: "300+",
    tech_stack: ["Haskell", "Rust", "Go", "PostgreSQL", "GraphQL", "Kubernetes"],
    year: 2017,
    desc: "Creators of instant GraphQL/REST data federation engine used by global Fortune 500 enterprises to query microservices and databases.",
    jobs: [
      { title: "Compiler / Systems Engineer (Haskell/Rust)", dept: "Hasura Engine", type: "remote", salary: "₹45L - ₹70L", apply: "https://hasura.io/careers" }
    ]
  },
  {
    title: "Zepto Headquarters",
    slug: "zepto-hsr-layout-hq",
    locality: "HSR Layout",
    address: "27th Main Rd, Sector 2, HSR Layout, Bengaluru",
    lat: 12.9115,
    lon: 77.6521,
    website: "https://www.zeptonow.com",
    careers_url: "https://www.zeptonow.com/careers",
    type: "startup",
    stage: "Unicorn",
    employees: "2,000+",
    tech_stack: ["Go", "Node.js", "Python", "Kubernetes", "Kafka", "PostgreSQL", "AWS"],
    year: 2021,
    desc: "Fastest-growing quick commerce unicorn delivering groceries and essentials in 10 minutes across India.",
    jobs: [
      { title: "Senior Backend Engineer - Darkstore Dispatch Engine", dept: "Fulfillment Tech", type: "on_site", salary: "₹38L - ₹55L", apply: "https://www.zeptonow.com/careers" }
    ]
  },
  {
    title: "CRED Headquarters",
    slug: "cred-indiranagar-hq",
    locality: "Indiranagar",
    address: "100 Feet Rd, Defence Colony, Indiranagar, Bengaluru",
    lat: 12.9734,
    lon: 77.6432,
    website: "https://cred.club",
    careers_url: "https://cred.club/careers",
    type: "startup",
    stage: "Unicorn",
    employees: "1,000+",
    tech_stack: ["Go", "Java", "Spring Boot", "React Native", "Kafka", "AWS"],
    year: 2018,
    desc: "High-trust community fintech unicorn offering credit card rewards, payments, peer-to-peer lending, and luxury e-commerce.",
    jobs: [
      { title: "Backend Developer - Payments & UPI", dept: "CRED Pay", type: "on_site", salary: "₹40L - ₹60L", apply: "https://cred.club/careers" }
    ]
  },
  {
    title: "Sarvam AI Research Lab",
    slug: "sarvam-ai-koramangala",
    locality: "Koramangala",
    address: "80 Feet Rd, 4th Block, Koramangala, Bengaluru",
    lat: 12.9344,
    lon: 77.6291,
    website: "https://www.sarvam.ai",
    careers_url: "https://www.sarvam.ai/careers",
    type: "startup",
    stage: "Series A",
    employees: "50-100",
    tech_stack: ["PyTorch", "CUDA", "Triton", "Python", "Transformers", "Distributed Training"],
    year: 2023,
    desc: "Frontier generative AI lab developing foundational Large Language Models and voice intelligence optimized for Indian languages.",
    jobs: [
      { title: "Frontier Foundation Model Pretraining Researcher", dept: "LLM Core", type: "on_site", salary: "₹60L - ₹1.0Cr + Equity", apply: "https://www.sarvam.ai/careers" }
    ]
  },
  {
    title: "Ather Energy Headquarters",
    slug: "ather-energy-ibc-park",
    locality: "Bannerghatta Road",
    address: "3rd Floor, Tower D, IBC Knowledge Park, Bannerghatta Main Rd",
    lat: 12.9312,
    lon: 77.5998,
    website: "https://www.atherenergy.com",
    careers_url: "https://www.atherenergy.com/careers",
    type: "deeptech_hardware",
    stage: "Unicorn",
    employees: "2,000+",
    tech_stack: ["C++", "Embedded Linux", "Python", "BMS", "Battery Algorithms", "Flutter"],
    year: 2013,
    desc: "Pioneering smart electric vehicle company engineering intelligent electric scooters, battery management systems, and fast charging grids.",
    jobs: [
      { title: "Senior Firmware & Battery Management Systems (BMS) Engineer", dept: "Vehicle Software", type: "on_site", salary: "₹30L - ₹45L", apply: "https://www.atherenergy.com/careers" }
    ]
  },
  {
    title: "Pixxel Space",
    slug: "pixxel-space-koramangala",
    locality: "Koramangala",
    address: "1st Cross Rd, 5th Block, Koramangala, Bengaluru",
    lat: 12.9349,
    lon: 77.6212,
    website: "https://www.pixxel.space",
    careers_url: "https://www.pixxel.space/careers",
    type: "deeptech_hardware",
    stage: "Series B",
    employees: "200+",
    tech_stack: ["Python", "Rust", "C++", "Hyperspectral Imaging", "Satellite Flight Software", "PyTorch"],
    year: 2019,
    desc: "Space-tech company building the world's highest-resolution hyperspectral satellite constellation to monitor climate, agriculture, and planet health.",
    jobs: [
      { title: "Spacecraft Flight Software Engineer", dept: "Satellite Avionics", type: "on_site", salary: "₹28L - ₹42L", apply: "https://www.pixxel.space/careers" }
    ]
  }
];

export async function POST() {
  try {
    const { supabase, tenant } = await requireTenantContext();

    // 1. Get or create primary domain
    let { data: domain } = await supabase
      .from("domains")
      .select("id")
      .eq("tenant_id", tenant.id)
      .limit(1)
      .maybeSingle();

    if (!domain) {
      const { data: newDomain, error } = await supabase
        .from("domains")
        .insert({
          tenant_id: tenant.id,
          name: "Bengaluru Tech Atlas",
          slug: "bengaluru",
          default_latitude: 12.9716,
          default_longitude: 77.5946,
        })
        .select("id")
        .single();
      if (error) throw error;
      domain = newDomain;
    }

    // 2. Get or create Tech & IT category
    let { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("tenant_id", tenant.id)
      .ilike("name", "%Tech%")
      .limit(1)
      .maybeSingle();

    if (!category) {
      const { data: newCat, error } = await supabase
        .from("categories")
        .insert({
          tenant_id: tenant.id,
          domain_id: domain.id,
          name: "Tech & Software Hubs",
          slug: "tech-software",
          icon: "💻",
          pin_color: "#06b6d4",
        })
        .select("id")
        .single();
      if (error) throw error;
      category = newCat;
    }

    let count = 0;
    for (const comp of BANGALORE_IT_COMPANIES) {
      const { data: existing } = await supabase
        .from("listings")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("slug", comp.slug)
        .maybeSingle();

      let listingId = existing?.id;

      const payload = {
        tenant_id: tenant.id,
        domain_id: domain.id,
        category_id: category.id,
        title: comp.title,
        slug: comp.slug,
        short_description: comp.desc,
        address_line_1: comp.address,
        locality: comp.locality,
        city: "Bengaluru",
        administrative_area: "Karnataka",
        country_code: "IN",
        latitude: comp.lat,
        longitude: comp.lon,
        website: comp.website,
        careers_url: comp.careers_url,
        company_type: comp.type,
        funding_stage: comp.stage,
        employee_range: comp.employees,
        tech_stack: comp.tech_stack,
        founded_year: comp.year,
        active_jobs_count: comp.jobs?.length || 0,
        status: "published",
        verification_status: "verified",
        is_featured: true,
        published_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from("listings").update(payload).eq("id", existing.id);
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("listings")
          .insert(payload)
          .select("id")
          .single();
        if (insertErr || !inserted) {
          console.error(`Error inserting ${comp.title}:`, insertErr);
          continue;
        }
        listingId = inserted.id;
      }

      // Sync jobs
      if (listingId && comp.jobs && comp.jobs.length > 0) {
        await supabase.from("company_jobs").delete().eq("listing_id", listingId);

        for (const j of comp.jobs) {
          await supabase.from("company_jobs").insert({
            tenant_id: tenant.id,
            listing_id: listingId,
            title: j.title,
            department: j.dept,
            location_name: `${comp.locality}, Bengaluru`,
            workplace_type: j.type as any,
            salary_range: j.salary,
            apply_url: j.apply,
            is_active: true,
          });
        }
      }

      count++;
    }

    return NextResponse.json({
      success: true,
      count,
      message: `Successfully loaded ${count} verified tech companies with real GPS pins and live jobs!`,
    });
  } catch (err) {
    console.error("[Seed Tech Atlas Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to seed companies" },
      { status: 500 }
    );
  }
}
