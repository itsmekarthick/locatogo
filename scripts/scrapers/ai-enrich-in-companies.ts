import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import * as fs from "fs";
import https from "https";
import http from "http";

const env: Record<string, string> = { ...process.env } as Record<string, string>;
const envFile = fs.existsSync(".env.local") ? ".env.local" : (fs.existsSync(".env") ? ".env" : null);

if (envFile) {
  fs.readFileSync(envFile, "utf8").split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  });
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL || "", env.SUPABASE_SERVICE_ROLE_KEY || "");

// Use the user's GEMINI_API_KEY
if (!env.GEMINI_API_KEY) {
  console.error("❌ ERROR: Missing GEMINI_API_KEY in .env.local");
  console.error("Please get a free key from https://aistudio.google.com/ and add it to .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        short_description: {
          type: SchemaType.STRING,
          description: "A crisp, engaging 2-sentence description of what the company does and their core product/service.",
        },
        description: {
          type: SchemaType.STRING,
          description: "A longer, comprehensive, professional multi-paragraph description of the company, their history, culture, and core offerings based on the website content. Minimum 3-4 sentences.",
        },
        category_name: {
          type: SchemaType.STRING,
          description: "A highly specific, modern tech category (e.g. B2B SaaS, HealthTech, FinTech, EdTech, Cybersecurity, AI/ML, DevOps, IT Services, Web3, Enterprise Software, Consumer App). Pick the SINGLE best fit.",
        },
        tech_stack: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "An array of up to 5 main technologies the company uses (e.g. React, Python, AWS, PostgreSQL, Go). Guess based on context if not explicit.",
        },
        careers_url: {
          type: SchemaType.STRING,
          description: "The absolute URL to the company's careers or jobs page if mentioned (e.g. https://company.com/careers). Return null if not found.",
        },
        contact_email: {
          type: SchemaType.STRING,
          description: "The primary contact or support email address mentioned. Return null if not found.",
        },
        contact_number: {
          type: SchemaType.STRING,
          description: "The primary contact phone number mentioned. Return null if not found.",
        },
        address: {
          type: SchemaType.STRING,
          description: "The primary physical address or headquarters location mentioned. Return null if not found.",
        },
        whatsapp: {
          type: SchemaType.STRING,
          description: "A WhatsApp contact number or link if mentioned. Return null if not found.",
        },
        founded_year: {
          type: SchemaType.INTEGER,
          description: "The year the company was founded, if mentioned (e.g. 2014). Return null if not found.",
        },
      },
      required: ["short_description", "description", "category_name", "tech_stack"],
    },
  },
});

const CONCURRENCY = 1;
const DELAY_MS = 5000; // 5 seconds between requests to respect 15 RPM free tier limit for lite model

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

function stripHtml(html: string): string {
  // Ultra-basic HTML stripper to just get text content for the LLM
  let text = html.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
  text = text.replace(/<style[^>]*>([\S\s]*?)<\/style>/gmi, '');
  text = text.replace(/<\/?[^>]+(>|$)/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  // Limit to first 10k characters (roughly 2.5k tokens) to save bandwidth and fit comfortably in context
  return text.substring(0, 10000);
}

async function fetchCompaniesToEnrich() {
  console.log("📦 Fetching companies that need AI enrichment...");
  // The ingest script uses "Verified software & IT enterprise operating in" 
  // We'll target companies with that generic description
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, website, short_description")
    .eq("status", "published")
    .not("website", "is", null)
    .ilike("short_description", "%Verified software & IT enterprise%")
    .eq("country_code", "IN")
    .order("active_jobs_count", { ascending: false })
    .limit(100);

  if (error || !data) {
    console.error("Failed to fetch:", error);
    return [];
  }
  return data;
}

async function enrichCompany(company: any) {
  try {
    let target = company.website;
    if (!target.startsWith("http")) target = `https://${target}`;
    
    // 1. Scrape the homepage
    const html = await httpGet(target).catch(() => "");
    const textContent = stripHtml(html);
    
    if (textContent.length < 200) {
      // If website is dead, empty, or parked, delete the company listing
      await supabase.from("listings").delete().eq("id", company.id);
      throw new Error("DELETED: Website inactive or dead");
    }
    
    // 2. Ask Gemini to extract data
    const prompt = `
      Analyze this text extracted from the homepage of a company named "${company.title}".
      Based on this text, generate a JSON object with:
      - A crisp 2-sentence short description.
      - A longer, comprehensive professional description (multi-paragraph).
      - The most accurate modern tech category.
      - A guessed array of their primary tech stack (up to 5 technologies).
      - Careers URL, email, phone number, physical address, whatsapp, and founded year if available in the text.
      
      Website Content:
      ${textContent}
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // 3. Parse JSON
    const parsed = JSON.parse(text);
    
    const cleanNull = (val: any) => (val === "null" || val === "" || !val) ? null : val;
    
    const updatePayload: any = {
      short_description: parsed.short_description,
      description: parsed.description,
      tech_stack: parsed.tech_stack,
      updated_at: new Date().toISOString()
    };
    
    if (cleanNull(parsed.careers_url)) updatePayload.careers_url = parsed.careers_url;
    if (cleanNull(parsed.contact_email)) updatePayload.email = parsed.contact_email;
    if (cleanNull(parsed.contact_number)) updatePayload.phone = parsed.contact_number;
    if (cleanNull(parsed.address)) updatePayload.address_line_1 = parsed.address;
    if (cleanNull(parsed.whatsapp)) updatePayload.whatsapp = parsed.whatsapp;
    if (cleanNull(parsed.founded_year)) updatePayload.founded_year = parsed.founded_year;

    // 4. Update Supabase
    const { error: updateError } = await supabase
      .from("listings")
      .update(updatePayload)
      .eq("id", company.id);
      
    if (updateError) {
      throw new Error(`Supabase update failed: ${updateError.message}`);
    }
      
    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log("==========================================================");
  console.log(`🤖 AI ENRICHMENT PIPELINE (Powered by Gemini 1.5 Flash)`);
  console.log("==========================================================\n");

  const companies = await fetchCompaniesToEnrich();
  if (companies.length === 0) {
    console.log("🎉 All companies are already enriched!");
    return;
  }
  
  console.log(`\n📊 Queueing ${companies.length} companies for enrichment in this batch.\n`);

  const stats = { success: 0, failed: 0, done: 0, total: companies.length };
  const start = Date.now();
  let index = 0;

  async function worker() {
    while (index < companies.length) {
      const company = companies[index++];
      await delay(DELAY_MS); // Help prevent rate limits

      const result = await enrichCompany(company);
      stats.done++;

      if (result.success) {
        stats.success++;
        console.log(`✨ [${stats.done}/${stats.total}] ${company.title} -> ${result.data?.category_name}`);
      } else {
        stats.failed++;
        console.log(`❌ [${stats.done}/${stats.total}] ${company.title} -> FAILED: ${result.error}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log("\n==========================================================");
  console.log("  BATCH ENRICHMENT COMPLETE");
  console.log("==========================================================");
  console.log(`✅ Successfully enriched: ${stats.success}`);
  console.log(`❌ Failed (No website/blocked): ${stats.failed}`);
  console.log(`⏱️  Time: ${elapsed} minutes\n`);
  console.log("💡 Tip: You can set up a CRON job to run this script hourly to process your entire database for free!");
}

main().catch(console.error);
