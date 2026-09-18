import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { harvestLinkedInJobs, type HarvestedJob } from "./linkedin-jobs-harvester";
import { geocodeBangaloreText } from "./bangalore-geocoder";
import { enrichCompany } from "./company-enricher";

// 1. Load .env credentials
const envFile = fs.readFileSync(".env", "utf8");
const env: Record<string, string> = {};
envFile.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || "";
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TENANT_ID = "1c186ac3-a365-4653-bd47-b87758890dfb";
const DOMAIN_ID = "461e4ee7-7a16-43b3-b342-5a968e44f306"; // Bangalore
const TECH_CATEGORY_ID = "54f2fdaa-7953-4cd4-bdfa-9c6053fb8838"; // Tech & Coworking
const runStartedAt = new Date().toISOString();

// Seed pool of prominent Bangalore Tech Companies & Startups across all stages
const CURATED_BANGALORE_TECH_SEED = [
  // Unicorns & Consumer Tech
  { name: "Flipkart", locality: "Devarabisanahalli", address: "Buildings Alyssa, Begonia & Clover, Embassy Tech Village, Outer Ring Road", lat: 12.9248, lng: 77.6835, type: "product_saas", stage: "Unicorn", employees: "5,000+", year: 2007, website: "https://flipkart.com", careers: "https://flipkartcareers.com" },
  { name: "Swiggy", locality: "Devarabisanahalli", address: "Tower D, 9th Floor, IBC Knowledge Park, Bannerghatta Main Rd", lat: 12.9304, lng: 77.5998, type: "product_saas", stage: "Public", employees: "5,000+", year: 2014, website: "https://swiggy.com", careers: "https://careers.swiggy.com" },
  { name: "Razorpay", locality: "Koramangala", address: "1st Floor, SJR Cyber, Laskar Hosur Rd, Adugodi, Koramangala", lat: 12.9372, lng: 77.6111, type: "product_saas", stage: "Unicorn", employees: "1,000-5,000", year: 2014, website: "https://razorpay.com", careers: "https://razorpay.com/jobs" },
  { name: "PhonePe", locality: "Bellandur (ORR)", address: "Office-2, Floor 4,5,6,7, Wing A, Block A, Salarpuria Softzone, Bellandur", lat: 12.9279, lng: 77.6775, type: "product_saas", stage: "Unicorn", employees: "1,000-5,000", year: 2015, website: "https://phonepe.com", careers: "https://phonepe.com/careers" },
  { name: "CRED", locality: "Indiranagar", address: "No. 1140, 100 Feet Rd, HAL 2nd Stage, Indiranagar", lat: 12.9719, lng: 77.6412, type: "startup", stage: "Unicorn", employees: "501-1000", year: 2018, website: "https://cred.club", careers: "https://careers.cred.club" },
  { name: "Zerodha", locality: "JP Nagar", address: "#153/154, 4th Cross, Dollars Colony, JP Nagar 4th Phase", lat: 12.9081, lng: 77.5956, type: "product_saas", stage: "Bootstrapped", employees: "1,000-5,000", year: 2010, website: "https://zerodha.com", careers: "https://zerodha.com/careers" },
  { name: "Postman", locality: "Indiranagar", address: "100 Feet Rd, Defence Colony, Indiranagar", lat: 12.9734, lng: 77.6427, type: "product_saas", stage: "Unicorn", employees: "501-1000", year: 2014, website: "https://postman.com", careers: "https://postman.com/careers" },
  { name: "BrowserStack", locality: "Koramangala", address: "Salarpuria Hallmark, Outer Ring Rd, Kadubeesanahalli", lat: 12.9351, lng: 77.6924, type: "product_saas", stage: "Unicorn", employees: "1,000-5,000", year: 2011, website: "https://browserstack.com", careers: "https://browserstack.com/careers" },
  { name: "InMobi", locality: "Kadubeesanahalli", address: "7th Floor, Block Delta, Embassy TechVillage, Outer Ring Rd", lat: 12.9255, lng: 77.6852, type: "product_saas", stage: "Unicorn", employees: "1,000-5,000", year: 2007, website: "https://inmobi.com", careers: "https://inmobi.com/company/careers" },
  { name: "Meesho", locality: "Kadubeesanahalli", address: "Prestige Technostar, Doddanakkundi Industrial Area 2, Phase 1", lat: 12.9818, lng: 77.7029, type: "startup", stage: "Unicorn", employees: "1,000-5,000", year: 2015, website: "https://meesho.io", careers: "https://meesho.io/careers" },
  { name: "Groww", locality: "Koramangala", address: "Vaishnavi Tech Park, Sarjapur Main Rd, Bellandur", lat: 12.9231, lng: 77.6742, type: "product_saas", stage: "Unicorn", employees: "1,000-5,000", year: 2016, website: "https://groww.in", careers: "https://groww.in/careers" },
  { name: "Zepto", locality: "HSR Layout", address: "27th Main Rd, Sector 1, HSR Layout", lat: 12.9114, lng: 77.6468, type: "startup", stage: "Unicorn", employees: "1,000-5,000", year: 2021, website: "https://zepto.com", careers: "https://zepto.com/careers" },
  { name: "Ather Energy", locality: "Bannerghatta Road", address: "IBC Knowledge Park, 3rd Floor, Tower D, Bannerghatta Main Rd", lat: 12.9312, lng: 77.5991, type: "deeptech_hardware", stage: "Public", employees: "1,000-5,000", year: 2013, website: "https://atherenergy.com", careers: "https://atherenergy.com/careers" },
  { name: "Ola Electric", locality: "Koramangala", address: "Regent Insignia, #414, 3rd Floor, 4th Block, 17th Main, 100 Feet Rd", lat: 12.9348, lng: 77.6256, type: "deeptech_hardware", stage: "Public", employees: "5,000+", year: 2017, website: "https://olaelectric.com", careers: "https://olaelectric.com/careers" },
  { name: "BigBasket", locality: "Domlur", address: "2nd Floor, Embassy Icon, Infantry Rd / EGL Campus", lat: 12.9538, lng: 77.6492, type: "product_saas", stage: "Unicorn", employees: "5,000+", year: 2011, website: "https://bigbasket.com", careers: "https://careers.bigbasket.com" },
  { name: "Juspay", locality: "Indiranagar", address: "Girija Building, 80 Feet Road, HAL 3rd Stage, Indiranagar", lat: 12.9723, lng: 77.6521, type: "product_saas", stage: "Series C+", employees: "501-1000", year: 2012, website: "https://juspay.in", careers: "https://juspay.in/careers" },
  { name: "Hasura", locality: "Koramangala", address: "80 Feet Road, Koramangala 4th Block", lat: 12.9341, lng: 77.6219, type: "product_saas", stage: "Unicorn", employees: "201-500", year: 2017, website: "https://hasura.io", careers: "https://hasura.io/careers" },
  { name: "Whatfix", locality: "Koramangala", address: "Koramangala Industrial Layout, 5th Block, Koramangala", lat: 12.9319, lng: 77.6189, type: "product_saas", stage: "Series C+", employees: "501-1000", year: 2014, website: "https://whatfix.com", careers: "https://whatfix.com/careers" },
  { name: "Yellow.ai", locality: "HSR Layout", address: "Sector 2, HSR Layout", lat: 12.9098, lng: 77.6491, type: "product_saas", stage: "Series C+", employees: "501-1000", year: 2016, website: "https://yellow.ai", careers: "https://yellow.ai/careers" },
  { name: "Pixxel Space", locality: "Indiranagar", address: "100 Feet Rd, Indiranagar", lat: 12.9754, lng: 77.6432, type: "deeptech_hardware", stage: "Series B", employees: "51-200", year: 2019, website: "https://pixxel.space", careers: "https://pixxel.space/careers" },
  
  // Tech Giants & Global Capability Centers (MNCs)
  { name: "Google India (RMZ Infinity)", locality: "Old Madras Road", address: "RMZ Infinity, Tower E, No. 3, Old Madras Rd, Sadanandanagar", lat: 12.9936, lng: 77.6607, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1998, website: "https://about.google", careers: "https://careers.google.com/locations/bangalore" },
  { name: "Microsoft India Development Center", locality: "Bellandur (ORR)", address: "Prestige Ferns Galaxy, Outer Ring Road, Ambalipura, Bellandur", lat: 12.9248, lng: 77.6749, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1975, website: "https://microsoft.com", careers: "https://careers.microsoft.com" },
  { name: "Walmart Global Tech India", locality: "Kadubeesanahalli", address: "Prestige Tech Park, Marathahalli - Sarjapur Outer Ring Rd, Kadubeesanahalli", lat: 12.9372, lng: 77.6948, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 2011, website: "https://tech.walmart.com", careers: "https://tech.walmart.com/careers" },
  { name: "Amazon Development Centre India", locality: "Yeshwanthpur / ORR", address: "World Trade Center, Brigade Gateway, Malleshwaram West", lat: 13.0121, lng: 77.5559, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1994, website: "https://aboutamazon.in", careers: "https://amazon.jobs" },
  { name: "Cisco Systems India", locality: "Kadubeesanahalli", address: "Cessna Business Park, Kadubeesanahalli Village, Varthur Hobli, Sarjapur-Marathahalli ORR", lat: 12.9366, lng: 77.6938, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1984, website: "https://cisco.com", careers: "https://jobs.cisco.com" },
  { name: "Intel Technology India", locality: "Bellandur (ORR)", address: "EcoSpace, Outer Ring Road, Bellandur", lat: 12.9272, lng: 77.6811, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1968, website: "https://intel.com", careers: "https://jobs.intel.com" },
  { name: "Adobe Systems India", locality: "Bellandur", address: "Prestige Platina Tech Park, Kadubeesanahalli, Outer Ring Rd", lat: 12.9435, lng: 77.6954, type: "product_saas", stage: "GCC", employees: "5,000+", year: 1982, website: "https://adobe.com", careers: "https://careers.adobe.com" },
  { name: "SAP Labs India", locality: "Whitefield", address: "#138, EPIP Zone, Whitefield", lat: 12.9811, lng: 77.7289, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1972, website: "https://sap.com", careers: "https://jobs.sap.com" },
  { name: "Oracle India", locality: "Manyata / ORR", address: "Manyata Embassy Business Park, Outer Ring Rd, Nagavara", lat: 13.0492, lng: 77.6205, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1977, website: "https://oracle.com", careers: "https://oracle.com/careers" },
  { name: "IBM India Systems", locality: "Manyata / EGL", address: "Embassy GolfLinks Business Park, Off Intermediate Ring Rd", lat: 12.9529, lng: 77.6477, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1911, website: "https://ibm.com", careers: "https://ibm.com/careers" },
  { name: "Dell Technologies", locality: "Domlur", address: "Divyasree Greens, Ground Floor, 12/1, 12/2B, Challaghatta, Domlur", lat: 12.9568, lng: 77.6534, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1984, website: "https://dell.com", careers: "https://jobs.dell.com" },
  { name: "Goldman Sachs India Services", locality: "Devarabisanahalli", address: "Helios Business Park, Kadubeesanahalli, Outer Ring Rd", lat: 12.9345, lng: 77.6912, type: "tech_giant_mnc", stage: "GCC", employees: "5,000+", year: 1869, website: "https://goldmansachs.com", careers: "https://goldmansachs.com/careers" },
  { name: "Target in India", locality: "Manyata", address: "Manyata Embassy Business Park, Hebbal Outer Ring Rd", lat: 13.0511, lng: 77.6219, type: "tech_giant_mnc", stage: "GCC", employees: "5,000+", year: 1902, website: "https://target.com", careers: "https://target.com/careers" },
  { name: "Qualcomm India", locality: "Whitefield", address: "Building 12, Mindcomp Tech Park, Whitefield", lat: 12.9842, lng: 77.7312, type: "tech_giant_mnc", stage: "GCC", employees: "5,000+", year: 1985, website: "https://qualcomm.com", careers: "https://qualcomm.com/careers" },
  { name: "NVIDIA Graphics India", locality: "Whitefield", address: "Prestige Technostar, Doddanakundi, Whitefield", lat: 12.9832, lng: 77.7051, type: "tech_giant_mnc", stage: "GCC", employees: "5,000+", year: 1993, website: "https://nvidia.com", careers: "https://nvidia.com/careers" },
  { name: "Siemens Healthineers & Tech", locality: "Electronic City", address: "Electronic City Phase 1, Hosur Rd", lat: 12.8465, lng: 77.6621, type: "tech_giant_mnc", stage: "GCC", employees: "5,000+", year: 1847, website: "https://siemens.com", careers: "https://jobs.siemens.com" },
  { name: "Bosch Global Software Technologies (BGSW)", locality: "Adugodi", address: "Post Box No. 3000, Hosur Rd, Adugodi", lat: 12.9421, lng: 77.6089, type: "tech_giant_mnc", stage: "GCC", employees: "10,000+", year: 1886, website: "https://bosch-softwaretechnologies.com", careers: "https://careers.bosch.com" },
  { name: "Samsung R&D Institute India", locality: "Kaggadasapura / Bagmane", address: "#2870, Orion Building, Bagmane Constellation Business Park, Doddanekundi", lat: 12.9844, lng: 77.6612, type: "tech_giant_mnc", stage: "GCC", employees: "5,000+", year: 1969, website: "https://samsung.com", careers: "https://research.samsung.com/sri-b" },
  
  // IT Majors
  { name: "Infosys Limited (Global HQ)", locality: "Electronic City Phase 1", address: "Plot No. 44, Electronic City, Hosur Rd", lat: 12.8441, lng: 77.6631, type: "it_services_consulting", stage: "Public", employees: "10,000+", year: 1981, website: "https://infosys.com", careers: "https://infosys.com/careers" },
  { name: "Wipro Limited (Corporate HQ)", locality: "Sarjapur Road", address: "Doddakannelli, Sarjapur Road", lat: 12.9102, lng: 77.6854, type: "it_services_consulting", stage: "Public", employees: "10,000+", year: 1945, website: "https://wipro.com", careers: "https://wipro.com/careers" },
  { name: "Tata Consultancy Services (TCS)", locality: "Whitefield", address: "Think Campus, Electronic City & Vydehi Complex, Whitefield", lat: 12.9812, lng: 77.7275, type: "it_services_consulting", stage: "Public", employees: "10,000+", year: 1968, website: "https://tcs.com", careers: "https://tcs.com/careers" },
];

async function main() {
  console.log("=================================================");
  console.log("  LOCATOGO BANGALORE TECH & LIVE JOBS HARVESTER  ");
  console.log("=================================================\n");

  // Step 1: Harvest live jobs from LinkedIn Guest Search across multiple tech tracks in Bengaluru
  console.log(">>> Phase 1: Harvesting live jobs from LinkedIn Guest Job Search...");
  const harvestedJobs = await harvestLinkedInJobs({
    maxPagesPerKeyword: 3, // 3 pages * 25 = 75 jobs per track across 12 tracks = ~300-500 live jobs
    delayMs: 350,
  });

  const runLog: {
    startedAt: string;
    completedAt?: string;
    source: string;
    searchUrls: string[];
    companyUrls: string[];
    jobUrls: string[];
    harvestedJobs: HarvestedJob[];
    errors: Array<{ company?: string; jobId?: string; message: string }>;
  } = {
    startedAt: runStartedAt,
    source: "linkedin_guest_jobs",
    searchUrls: [...new Set(harvestedJobs.map((job) => job.sourceSearchUrl))],
    companyUrls: [...new Set(harvestedJobs.flatMap((job) => job.companyUrl ? [job.companyUrl] : []))],
    jobUrls: [...new Set(harvestedJobs.map((job) => job.sourceUrl))],
    harvestedJobs,
    errors: [],
  };

  console.log(`\nHarvested ${harvestedJobs.length} live jobs across ${new Set(harvestedJobs.map(j => j.companySlug)).size} companies.`);

  // Group jobs by company slug
  const jobsByCompanySlug = new Map<string, HarvestedJob[]>();
  for (const job of harvestedJobs) {
    const list = jobsByCompanySlug.get(job.companySlug) || [];
    list.push(job);
    jobsByCompanySlug.set(job.companySlug, list);
  }

  // Step 2: Combine Curated Bengaluru Seed with Harvested Companies
  console.log("\n>>> Phase 2: Resolving & Enriching Bangalore Tech Companies...");
  const combinedCompaniesMap = new Map<string, {
    name: string;
    slug: string;
    locality: string;
    address: string;
    lat: number;
    lng: number;
    website: string;
    careers_url?: string;
    logo_url?: string;
    company_type: string;
    funding_stage: string;
    employee_range: string;
    tech_stack: string[];
    founded_year: number;
    short_description: string;
    jobs: HarvestedJob[];
  }>();

  // Add Curated Seed first
  for (const seed of CURATED_BANGALORE_TECH_SEED) {
    const enriched = enrichCompany(seed.name);
    const slug = enriched.slug;
    const companyJobs = jobsByCompanySlug.get(slug) || [];

    combinedCompaniesMap.set(slug, {
      name: seed.name,
      slug,
      locality: seed.locality,
      address: seed.address,
      lat: seed.lat,
      lng: seed.lng,
      website: seed.website,
      careers_url: seed.careers,
      logo_url: undefined,
      company_type: seed.type,
      funding_stage: seed.stage,
      employee_range: seed.employees,
      tech_stack: enriched.tech_stack,
      founded_year: seed.year,
      short_description: enriched.short_description,
      jobs: companyJobs,
    });
  }

  // Add all companies discovered from LinkedIn jobs
  for (const [slug, jobs] of jobsByCompanySlug.entries()) {
    if (!combinedCompaniesMap.has(slug)) {
      const sampleJob = jobs[0];
      const enriched = enrichCompany(sampleJob.companyName, sampleJob.title);
      const geocoded = geocodeBangaloreText(sampleJob.location, sampleJob.companyName);

      combinedCompaniesMap.set(slug, {
        name: sampleJob.companyName,
        slug,
        locality: geocoded.locality,
        address: geocoded.address_line_1,
        lat: geocoded.latitude,
        lng: geocoded.longitude,
        website: enriched.website,
        careers_url: sampleJob.applyUrl,
        logo_url: sampleJob.logoUrl || undefined,
        company_type: enriched.company_type,
        funding_stage: enriched.funding_stage,
        employee_range: enriched.employee_range,
        tech_stack: enriched.tech_stack,
        founded_year: enriched.founded_year,
        short_description: enriched.short_description,
        jobs,
      });
    } else {
      // Merge jobs and logo into existing entry
      const existing = combinedCompaniesMap.get(slug)!;
      existing.jobs = jobs;
      if (jobs[0]?.logoUrl && !existing.logo_url) {
        existing.logo_url = jobs[0].logoUrl;
      }
    }
  }

  console.log(`Total unique tech companies ready for ingestion: ${combinedCompaniesMap.size}`);

  // Step 3: Upsert into Supabase (company_profiles, listings, company_jobs)
  console.log("\n>>> Phase 3: Ingesting into Supabase...");
  let companiesInserted = 0;
  let jobsInserted = 0;

  for (const comp of combinedCompaniesMap.values()) {
    try {
      const safeCompSlug = comp.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
      const safeListingSlug = `${safeCompSlug}-bengaluru`.replace(/--+/g, "-");

      // A. Upsert into company_profiles
      const { data: profileData } = await supabase
        .from("company_profiles")
        .upsert(
          {
            tenant_id: TENANT_ID,
            name: comp.name,
            slug: safeCompSlug,
            website: comp.website,
            careers_url: comp.careers_url,
            logo_url: comp.logo_url,
            company_type: comp.company_type,
            funding_stage: comp.funding_stage,
            employee_range: comp.employee_range,
            tech_stack: comp.tech_stack,
            sectors: [comp.company_type === "deeptech_hardware" ? "DeepTech" : "Enterprise SaaS"],
            founded_year: comp.founded_year,
            headquarters_city: "Bengaluru",
            source_urls: [...new Set([
              comp.website,
              ...(comp.careers_url ? [comp.careers_url] : []),
              ...comp.jobs.flatMap((job) => job.companyUrl ? [job.companyUrl] : []),
            ])],
          },
          { onConflict: "tenant_id,slug" }
        )
        .select("id")
        .single();

      const profileId = profileData?.id;

      // B. Upsert into listings
      const listingPayload: Record<string, unknown> = {
        tenant_id: TENANT_ID,
        domain_id: DOMAIN_ID,
        category_id: TECH_CATEGORY_ID,
        title: comp.name,
        slug: safeListingSlug,
        short_description: comp.short_description,
        address_line_1: comp.address,
        locality: comp.locality,
        city: "Bengaluru",
        administrative_area: "Karnataka",
        country_code: "IN",
        latitude: comp.lat,
        longitude: comp.lng,
        website: comp.website,
        careers_url: comp.careers_url,
        company_type: comp.company_type,
        funding_stage: comp.funding_stage,
        employee_range: comp.employee_range,
        tech_stack: comp.tech_stack,
        founded_year: comp.founded_year,
        active_jobs_count: comp.jobs.length,
        status: "published",
        verification_status: "verified",
        is_featured: comp.jobs.length > 0,
        published_at: new Date().toISOString(),
      };

      if (profileId) {
        listingPayload.company_profile_id = profileId;
      }

      const { data: listingData, error: listingErr } = await supabase
        .from("listings")
        .upsert(listingPayload, { onConflict: "domain_id,slug" })
        .select("id")
        .single();

      if (listingErr) {
        // If conflict on slug or other error, log
        console.warn(`[Listing Warning] ${comp.name}:`, listingErr.message);
        continue;
      }

      const listingId = listingData?.id;
      if (!listingId) continue;

      companiesInserted++;

      // C. Ingest company_jobs if any exist
      if (comp.jobs.length > 0) {
        for (const job of comp.jobs) {
          const atsJobId = `linkedin:${job.jobId}`;

          const jobPayload: Record<string, unknown> = {
            tenant_id: TENANT_ID,
            listing_id: listingId,
            title: job.title,
            department: job.department,
            location_name: `${comp.locality}, Bengaluru`,
            workplace_type: job.workplaceType,
            experience_level: job.experienceLevel,
            salary_range: job.salaryRange || undefined,
            apply_url: job.applyUrl,
            source_url: job.sourceUrl,
            company_url: job.companyUrl,
            source_search_url: job.sourceSearchUrl,
            description: job.description,
            employment_type: job.employmentType,
            source_fetched_at: job.sourceFetchedAt,
            ats_job_id: atsJobId,
            is_active: true,
            posted_at: new Date().toISOString(),
          };

          if (profileId) {
            jobPayload.company_profile_id = profileId;
          }

          // Check if job exists
          const { data: existingJob } = await supabase
            .from("company_jobs")
            .select("id")
            .eq("listing_id", listingId)
            .eq("ats_job_id", atsJobId)
            .maybeSingle();

          if (existingJob) {
            await supabase.from("company_jobs").update(jobPayload).eq("id", existingJob.id);
          } else {
            const { error: insertJobErr } = await supabase.from("company_jobs").insert(jobPayload);
            if (!insertJobErr) jobsInserted++;
          }
        }
      }

      if (comp.jobs.length > 0) {
        console.log(`✓ ${comp.name} — ${comp.jobs.length} live jobs (${comp.locality})`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error processing ${comp.name}:`, message);
      runLog.errors.push({ company: comp.name, message });
    }
  }

  runLog.completedAt = new Date().toISOString();
  const logDir = path.join(process.cwd(), "logs");
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `bangalore-ecosystem-${runStartedAt.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(logPath, JSON.stringify(runLog, null, 2), "utf8");

  console.log("\n=================================================");
  console.log("         INGESTION COMPLETED SUCCESSFULLY         ");
  console.log("=================================================");
  console.log(`✓ Tech Companies Processed: ${companiesInserted}`);
  console.log(`✓ Live Openings Ingested:    ${jobsInserted}`);
  console.log(`✓ Companies Actively Hiring: ${Array.from(combinedCompaniesMap.values()).filter(c => c.jobs.length > 0).length}`);
  console.log(`✓ URL and source log:           ${logPath}`);
  console.log("=================================================\n");
}

main().catch(console.error);
