/**
 * enrich-company-urls.ts
 *
 * Searches DuckDuckGo HTML for each company's real official website
 * and updates the DB. Uses parallel workers with proper throttling.
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import https from "https";

const env: Record<string, string> = {};
fs.readFileSync(".env", "utf8").split("\n").forEach((line) => {
  const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (m) {
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1]] = v;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CONCURRENCY = 3;
const DELAY_MS = 2000;

// Junk domains to skip — aggregators, social, govt portals
const JUNK_DOMAINS = /linkedin|facebook|twitter|instagram|wikipedia|justdial|indiamart|glassdoor|ambitionbox|zaubacorp|mca\.gov|sulekha|yellowpages|quora|reddit|naukri|indeed|tracxn|crunchbase|bloomberg|moneycontrol|bseindia|economictimes|startupindia\.gov|startupindia\.in/i;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function httpGet(url: string, userAgent?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "User-Agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
      },
    };
    const req = https.request(options, (res) => {
      // Follow a single redirect
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        resolve(httpGet(res.headers.location, userAgent));
        return;
      }
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.end();
  });
}

function extractDDGUrl(html: string): string | null {
  // DDG HTML result format: href="//duckduckgo.com/l/?uddg=ENCODED_URL&..."
  const regex = /href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const decoded = decodeURIComponent(match[1]);
      if (decoded.startsWith("http") && !JUNK_DOMAINS.test(decoded)) {
        return decoded;
      }
    } catch (_) {}
  }
  return null;
}

async function searchForWebsite(companyName: string, city: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`"${companyName}" ${city} official website`);
    const html = await httpGet(`https://html.duckduckgo.com/html/?q=${query}`);
    return extractDDGUrl(html);
  } catch (_) {
    return null;
  }
}

async function fetchAllWithoutWebsite() {
  const PAGE_SIZE = 1000;
  let from = 0;
  const all: any[] = [];
  while (true) {
    const { data } = await supabase
      .from("listings")
      .select("id, title, city")
      .is("website", null)
      .range(from, from + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    all.push(...data);
    process.stdout.write(`\r   Loading... ${all.length}`);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  console.log();
  return all;
}

async function main() {
  console.log("==========================================================");
  console.log(`  ENRICH COMPANY WEBSITES (${CONCURRENCY} workers, DDG HTML)`);
  console.log("==========================================================\n");

  console.log("📦 Fetching companies without a website...");
  const companies = await fetchAllWithoutWebsite();
  console.log(`\n📊 ${companies.length} companies need a website URL.\n`);

  const stats = { found: 0, notFound: 0, done: 0, total: companies.length };
  const start = Date.now();
  let index = 0;

  async function worker() {
    while (index < companies.length) {
      const company = companies[index++];
      await delay(DELAY_MS);

      const url = await searchForWebsite(company.title, company.city || "");
      stats.done++;

      if (url) {
        await supabase.from("listings").update({ website: url }).eq("id", company.id);
        stats.found++;
        console.log(`✅ [${stats.done}/${stats.total}] ${company.title} → ${url}`);
      } else {
        stats.notFound++;
        if (stats.done % 50 === 0) {
          const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
          console.log(`⏳ [${stats.done}/${stats.total}] ✅ ${stats.found} found | ❌ ${stats.notFound} not found | ${elapsed}min elapsed`);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log("\n==========================================================");
  console.log("  ENRICHMENT COMPLETE");
  console.log("==========================================================");
  console.log(`✅ URLs found & saved: ${stats.found}`);
  console.log(`❌ Not found:          ${stats.notFound}`);
  console.log(`⏱️  Time:               ${elapsed} minutes\n`);
  console.log("👉 Next: npx tsx --env-file=.env scripts/scrapers/ingest-real-ats-jobs.ts");
}

main().catch(console.error);
