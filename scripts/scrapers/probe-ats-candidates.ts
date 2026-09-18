/**
 * probe-ats-candidates.ts
 *
 * Probes candidate tokens across Greenhouse, Lever, Ashby, and SmartRecruiters
 * to identify active boards for Bangalore tech companies.
 */

interface ProbeResult {
  name: string;
  provider: "greenhouse" | "lever" | "ashby" | "smartrecruiters";
  token: string;
  url: string;
  jobCount: number;
}

const CANDIDATES: { name: string; tokens: string[] }[] = [
  // Startups & Unicorns
  { name: "Zepto", tokens: ["zepto", "kiranakart", "kirana-kart"] },
  { name: "PhonePe", tokens: ["phonepe", "phone-pe"] },
  { name: "Urban Company", tokens: ["urbancompany", "urbanclap"] },
  { name: "Khatabook", tokens: ["khatabook", "kyte"] },
  { name: "Darwinbox", tokens: ["darwinbox"] },
  { name: "Apna", tokens: ["apna", "apnahq"] },
  { name: "Udaan", tokens: ["udaan", "hiveloop"] },
  { name: "Dunzo", tokens: ["dunzo", "dunzo-digital"] },
  { name: "Jupiter", tokens: ["jupiter", "amicafinancial", "amica"] },
  { name: "Jar", tokens: ["jar", "changejar", "change-jar"] },
  { name: "Plum", tokens: ["plum", "plumhq", "plum-benefits"] },
  { name: "smallcase", tokens: ["smallcase", "smallcase-technologies"] },
  { name: "Pratilipi", tokens: ["pratilipi", "nasadiya"] },
  { name: "Pixxel", tokens: ["pixxel", "pixxelspace"] },
  { name: "Rapido", tokens: ["rapido", "roppen-transportation", "roppen"] },
  { name: "Shadowfax", tokens: ["shadowfax", "shadowfax-technologies"] },
  { name: "BlackBuck", tokens: ["blackbuck", "zinka-logistics"] },
  { name: "Delhivery", tokens: ["delhivery"] },
  { name: "Chargebee", tokens: ["chargebee"] },
  { name: "Icertis", tokens: ["icertis"] },
  { name: "Amagi", tokens: ["amagi", "amagi-media-labs"] },
  { name: "Uniphore", tokens: ["uniphore", "uniphore-technologies"] },
  { name: "Gupshup", tokens: ["gupshup"] },
  { name: "Quizizz", tokens: ["quizizz"] },
  { name: "WinZO", tokens: ["winzo", "winzogames"] },
  { name: "Games24x7", tokens: ["games24x7", "playgames24x7"] },
  { name: "Postman", tokens: ["postman"] },
  { name: "Hasura", tokens: ["hasura"] },
  { name: "BrowserStack", tokens: ["browserstack"] },
  { name: "CleverTap", tokens: ["clevertap", "wizrocket"] },
  { name: "MoEngage", tokens: ["moengage"] },
  { name: "Yellow.ai", tokens: ["yellowai", "yellowmessenger", "yellow-ai"] },
  { name: "LeadSquared", tokens: ["leadsquared", "marketxpand"] },
  { name: "Licious", tokens: ["licious", "delightfulgourmet"] },
  { name: "Open Financial", tokens: ["openfinancial", "bankopen"] },
  { name: "CoinSwitch", tokens: ["coinswitch", "coinswitchkuber", "bitcipher"] },
  { name: "Wysa", tokens: ["wysa", "touchkin"] },
  { name: "Klub", tokens: ["klub", "klubworks"] },
  { name: "FinBox", tokens: ["finbox"] },
  { name: "OneCard", tokens: ["fpltechnologies", "onecard"] },
  { name: "INDmoney", tokens: ["indmoney", "finzoomers"] },
  { name: "Money View", tokens: ["moneyview", "whizdm"] },
  { name: "MobiKwik", tokens: ["mobikwik", "one-mobikwik"] },
  { name: "upGrad", tokens: ["upgrad", "upgrad-education"] },
  { name: "PhysicsWallah", tokens: ["physicswallah", "pw"] },
  { name: "Cuemath", tokens: ["cuemath", "cue-learn"] },
  { name: "Eruditus", tokens: ["eruditus", "emeritus"] },
  { name: "Classplus", tokens: ["classplus", "bunch-microtechnologies"] },
  { name: "Practo", tokens: ["practo", "practo-technologies"] },
  { name: "PharmEasy", tokens: ["pharmeasy", "api-holdings"] },
  { name: "1mg", tokens: ["1mg", "tata1mg"] },
  { name: "HealthifyMe", tokens: ["healthifyme"] },
  { name: "Curefit", tokens: ["curefit", "cultfit"] },
  { name: "MediBuddy", tokens: ["medibuddy", "docsapp"] },
  { name: "Spinny", tokens: ["spinny", "valuedrive"] },
  { name: "BluSmart", tokens: ["blusmart", "gensol"] },
  { name: "Yulu", tokens: ["yulu", "yulubikes"] },
  { name: "Zetwerk", tokens: ["zetwerk", "zetwerk-manufacturing"] },
  { name: "Infra.Market", tokens: ["inframarket", "hella-infra"] },
  { name: "OfBusiness", tokens: ["ofbusiness", "oxyzo"] },
  { name: "Moglix", tokens: ["moglix", "mjl-technologies"] },
  { name: "Bizongo", tokens: ["bizongo", "smartbiz"] },
  { name: "Shiprocket", tokens: ["shiprocket", "bigfoot"] },
  { name: "Agnikul Cosmos", tokens: ["agnikul", "agnikul-cosmos"] },
  { name: "Skyroot Aerospace", tokens: ["skyroot", "skyroot-aerospace"] },
  { name: "Bellatrix Aerospace", tokens: ["bellatrix", "bellatrix-aerospace"] },
  { name: "Dhruva Space", tokens: ["dhruvaspace"] },
  { name: "GalaxEye Space", tokens: ["galaxeye", "galaxeye-space"] },
  { name: "Ultraviolette Automotive", tokens: ["ultraviolette"] },
  { name: "Simple Energy", tokens: ["simpleenergy"] },
  { name: "Euler Motors", tokens: ["eulermotors"] },
  { name: "Detect Technologies", tokens: ["detecttechnologies"] },
  { name: "Embibe", tokens: ["embibe", "indiaradical"] },
  
  // MNC GCCs & Enterprise Tech
  { name: "Akamai India", tokens: ["akamai"] },
  { name: "Nutanix India", tokens: ["nutanix"] },
  { name: "VMware India", tokens: ["vmware"] },
  { name: "Juniper Networks India", tokens: ["juniper", "junipernetworks"] },
  { name: "Palo Alto Networks India", tokens: ["paloaltonetworks", "paloalto"] },
  { name: "NetApp India", tokens: ["netapp"] },
  { name: "Synopsys India", tokens: ["synopsys"] },
  { name: "Cadence India", tokens: ["cadence", "cadencedesignsystems"] },
  { name: "Arm India", tokens: ["arm", "armholdings"] },
  { name: "Qualcomm India", tokens: ["qualcomm"] },
  { name: "AMD India", tokens: ["amd", "advancedmicrodevices"] },
  { name: "NVIDIA India", tokens: ["nvidia"] },
  { name: "Texas Instruments India", tokens: ["texasinstruments", "ti"] },
  { name: "Applied Materials India", tokens: ["appliedmaterials"] },
  { name: "Salesforce India", tokens: ["salesforce"] },
  { name: "ServiceNow India", tokens: ["servicenow"] },
  { name: "Workday India", tokens: ["workday"] },
  { name: "Snowflake India", tokens: ["snowflake", "snowflakecomputing"] },
  { name: "Databricks India", tokens: ["databricks"] },
  { name: "Confluent India", tokens: ["confluent"] },
  { name: "HashiCorp India", tokens: ["hashicorp"] },
  { name: "Elastic India", tokens: ["elastic", "elasticsearch"] },
  { name: "GitLab", tokens: ["gitlab"] },
  { name: "GitHub", tokens: ["github"] },
  { name: "Docker", tokens: ["docker"] },
  { name: "Red Hat India", tokens: ["redhat"] },
  { name: "Thoughtworks India", tokens: ["thoughtworks"] },
  { name: "Persistent Systems", tokens: ["persistentsystems", "persistent"] },
  { name: "L&T Technology Services", tokens: ["ltts", "lnttechservices"] },
  { name: "Tata Elxsi", tokens: ["tataelxsi"] },
  { name: "KPIT Technologies", tokens: ["kpit"] },
  { name: "Mphasis", tokens: ["mphasis"] },
  { name: "Sonata Software", tokens: ["sonatasoftware", "sonata"] },
  { name: "Cyient", tokens: ["cyient"] },
  { name: "Zensar Technologies", tokens: ["zensar"] },
  { name: "Coforge", tokens: ["coforge", "niit-technologies"] },
  { name: "Western Digital India", tokens: ["westerndigital", "wdc"] },
  { name: "Sony India Software Centre", tokens: ["asubsidiaryofsca", "sony"] },
  { name: "Target India", tokens: ["target"] },
  { name: "Walmart Global Tech India", tokens: ["walmart"] },
  { name: "Lowe's India", tokens: ["lowes"] },
  { name: "PayPal India", tokens: ["paypal"] },
  { name: "Intuit India", tokens: ["intuit"] },
  { name: "Adobe India", tokens: ["adobe"] },
  { name: "Goldman Sachs India", tokens: ["goldmansachs"] },
  { name: "Morgan Stanley India", tokens: ["morganstanley"] },
  { name: "JPMorgan Chase India", tokens: ["jpmorganchase", "jpmorgan"] },
  { name: "Wells Fargo India", tokens: ["wellsfargo"] },
  { name: "American Express India", tokens: ["americanexpress", "amex"] },
];

async function checkGreenhouse(token: string): Promise<number | null> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json.jobs) ? json.jobs.length : null;
  } catch {
    return null;
  }
}

async function checkLever(token: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json&limit=1`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (Array.isArray(json) && json.length > 0) {
      // Get count
      const allRes = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`, {
        signal: AbortSignal.timeout(5000),
      });
      const allJson = await allRes.json();
      return Array.isArray(allJson) ? allJson.length : json.length;
    }
    return null;
  } catch {
    return null;
  }
}

async function checkAshby(token: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json.jobs) ? json.jobs.length : null;
  } catch {
    return null;
  }
}

async function checkSmartRecruiters(token: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(token)}/postings?limit=1`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.totalFound === "number" ? json.totalFound : (Array.isArray(json.content) ? json.content.length : null);
  } catch {
    return null;
  }
}

async function probeCompany(c: { name: string; tokens: string[] }): Promise<ProbeResult | null> {
  for (const token of c.tokens) {
    // 1. Check Greenhouse
    const ghCount = await checkGreenhouse(token);
    if (ghCount !== null && ghCount > 0) {
      return {
        name: c.name,
        provider: "greenhouse",
        token,
        url: `https://boards.greenhouse.io/${token}`,
        jobCount: ghCount,
      };
    }

    // 2. Check Lever
    const levCount = await checkLever(token);
    if (levCount !== null && levCount > 0) {
      return {
        name: c.name,
        provider: "lever",
        token,
        url: `https://jobs.lever.co/${token}`,
        jobCount: levCount,
      };
    }

    // 3. Check Ashby
    const ashCount = await checkAshby(token);
    if (ashCount !== null && ashCount > 0) {
      return {
        name: c.name,
        provider: "ashby",
        token,
        url: `https://jobs.ashbyhq.com/${token}`,
        jobCount: ashCount,
      };
    }

    // 4. Check SmartRecruiters
    const srCount = await checkSmartRecruiters(token);
    if (srCount !== null && srCount > 0) {
      return {
        name: c.name,
        provider: "smartrecruiters",
        token,
        url: `https://careers.smartrecruiters.com/${token}`,
        jobCount: srCount,
      };
    }
  }
  return null;
}

async function main() {
  console.log(`Probing ${CANDIDATES.length} Bangalore tech company candidates across 4 major ATS APIs...\n`);

  const results: ProbeResult[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < CANDIDATES.length; i += BATCH_SIZE) {
    const chunk = CANDIDATES.slice(i, i + BATCH_SIZE);
    const probeChunk = await Promise.all(chunk.map((c) => probeCompany(c)));
    for (const res of probeChunk) {
      if (res) {
        results.push(res);
        console.log(`🎯 [${res.provider.toUpperCase()}] ${res.name.padEnd(28)} -> ${res.jobCount} jobs (${res.url})`);
      }
    }
  }

  console.log(`\n=============================================`);
  console.log(`Discovered ${results.length} active ATS endpoints! Total jobs available: ${results.reduce((acc, r) => acc + r.jobCount, 0)}`);
  console.log(`=============================================\n`);

  // Print as a map for inclusion in seed script
  console.log("export const DISCOVERED_ATS_OVERRIDES: Record<string, string> = {");
  for (const r of results) {
    console.log(`  "${r.name}": "${r.url}",`);
  }
  console.log("};");
}

main().catch(console.error);
