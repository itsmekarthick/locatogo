import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import https from "https";
import http from "http";

const env: Record<string, string> = {};
const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
fs.readFileSync(envFile, "utf8").split(/\r?\n/).forEach((line) => {
  const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (m) {
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1]] = v;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CONCURRENCY = 10;
const DELAY_MS = 200; // Small delay to avoid pegging our own CPU

const ATS_REGEX = /(?:https?:\/\/)?(?:boards\.greenhouse\.io|jobs\.lever\.co|api\.ashbyhq\.com\/posting-api\/job-board|apply\.workable\.com|jobs\.ashbyhq\.com)\/([a-zA-Z0-9_-]+)/gi;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function httpGet(url: string, redirects = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirects > 3) return reject(new Error("Too many redirects"));
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return reject(new Error("Invalid URL"));
    }
    
    const client = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        "Accept": "text/html",
      },
    };
    
    const req = client.request(options, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith("http")) {
          redirectUrl = new URL(redirectUrl, url).toString();
        }
        resolve(httpGet(redirectUrl, redirects + 1));
        return;
      }
      
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
    });
    
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.end();
  });
}

function extractAtsUrl(html: string): string | null {
  const matches = [...html.matchAll(ATS_REGEX)];
  if (matches.length > 0) {
    let url = matches[0][0];
    if (!url.startsWith("http")) url = `https://${url}`;
    return url;
  }
  return null;
}

async function scrapeForAts(websiteUrl: string): Promise<string | null> {
  if (!websiteUrl) return null;
  try {
    let target = websiteUrl;
    if (!target.startsWith("http")) target = `https://${target}`;
    
    // First try the main page
    let html = await httpGet(target).catch(() => "");
    let atsUrl = extractAtsUrl(html);
    if (atsUrl) return atsUrl;
    
    // Then try /careers page
    let careersTarget = target.endsWith("/") ? `${target}careers` : `${target}/careers`;
    html = await httpGet(careersTarget).catch(() => "");
    atsUrl = extractAtsUrl(html);
    return atsUrl;
    
  } catch (err) {
    return null;
  }
}

async function fetchCompaniesToScan() {
  console.log("📦 Fetching companies that need ATS discovery...");
  const PAGE_SIZE = 1000;
  let from = 0;
  const all: any[] = [];
  while (true) {
    const { data } = await supabase
      .from("listings")
      .select("id, title, website, careers_url")
      .eq("status", "published")
      .not("website", "is", null)
      .range(from, from + PAGE_SIZE - 1);
      
    if (!data || data.length === 0) break;
    
    // Only pick companies where careers_url is basically their website (unverified ATS)
    const needsScan = data.filter(c => 
      !c.careers_url || 
      c.careers_url === c.website || 
      (!c.careers_url.includes("greenhouse.io") && !c.careers_url.includes("lever.co") && !c.careers_url.includes("ashby") && !c.careers_url.includes("workable"))
    );
    
    all.push(...needsScan);
    process.stdout.write(`\r   Loaded... ${all.length} candidates`);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  console.log();
  return all;
}

async function main() {
  console.log("==========================================================");
  console.log(`  ATS DISCOVERY PIPELINE (${CONCURRENCY} concurrent workers)`);
  console.log("==========================================================\n");

  const companies = await fetchCompaniesToScan();
  console.log(`\n📊 ${companies.length} companies queued for scanning.\n`);

  const stats = { found: 0, notFound: 0, failed: 0, done: 0, total: companies.length };
  const start = Date.now();
  let index = 0;

  async function worker() {
    while (index < companies.length) {
      const company = companies[index++];
      await delay(DELAY_MS);

      const atsUrl = await scrapeForAts(company.website);
      stats.done++;

      if (atsUrl) {
        await supabase.from("listings").update({ careers_url: atsUrl }).eq("id", company.id);
        stats.found++;
        console.log(`✅ [${stats.done}/${stats.total}] ${company.title} -> ${atsUrl}`);
      } else {
        stats.notFound++;
        if (stats.done % 100 === 0) {
          const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
          console.log(`⏳ [${stats.done}/${stats.total}] ✅ ${stats.found} found | ❌ ${stats.notFound} none | ${elapsed}min elapsed`);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log("\n==========================================================");
  console.log("  DISCOVERY COMPLETE");
  console.log("==========================================================");
  console.log(`✅ ATS URLs Discovered: ${stats.found}`);
  console.log(`❌ Not found:           ${stats.notFound}`);
  console.log(`⏱️  Time:                ${elapsed} minutes\n`);
  console.log("👉 Next: npm run sync:jobs to actually pull jobs!");
}

main().catch(console.error);
