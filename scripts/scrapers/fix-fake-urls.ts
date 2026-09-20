/**
 * fast-clean-urls.ts
 * 
 * Fetches ALL companies (paginated past 1000 row limit),
 * detects spam/bulk-assigned URLs, and wipes them instantly in bulk.
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

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

async function fetchAllCompanies() {
  const PAGE_SIZE = 1000;
  let from = 0;
  const all: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("listings")
      .select("id, title, website")
      .not("website", "is", null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) { console.error("Fetch error:", error.message); break; }
    if (!data || data.length === 0) break;

    all.push(...data);
    console.log(`   Loaded ${all.length} companies so far...`);

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

async function run() {
  console.log("🧹 Starting Fast URL Cleanup (full paginated scan)...\n");

  const companies = await fetchAllCompanies();
  console.log(`\n📦 Total companies with a website: ${companies.length}\n`);

  // --- Detect spam: any URL shared by 3+ different companies ---
  const urlCount = new Map<string, number>();
  for (const c of companies) {
    if (c.website) urlCount.set(c.website, (urlCount.get(c.website) || 0) + 1);
  }

  const SPAM_THRESHOLD = 3;
  const spamUrls = new Set<string>();
  for (const [url, count] of urlCount.entries()) {
    if (count >= SPAM_THRESHOLD) {
      spamUrls.add(url);
      console.log(`🚨 Spam URL (${count} companies): ${url}`);
    }
  }

  // --- Build the list of IDs to wipe ---
  const idsToWipe: string[] = [];
  for (const c of companies) {
    const cleanName = c.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const generatedMock = `https://www.${cleanName || "company"}.com`;
    const isSpam = c.website ? spamUrls.has(c.website) : false;
    const isMock = c.website === generatedMock;

    if (isSpam || isMock) idsToWipe.push(c.id);
  }

  console.log(`\n🗑️  Wiping ${idsToWipe.length} bad URLs in bulk batches...\n`);

  const BATCH_SIZE = 500;
  let wiped = 0;
  for (let i = 0; i < idsToWipe.length; i += BATCH_SIZE) {
    const batch = idsToWipe.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("listings")
      .update({ website: null })
      .in("id", batch);

    if (error) {
      console.error(`Error wiping batch at ${i}:`, error.message);
    } else {
      wiped += batch.length;
      console.log(`   ✅ Wiped ${wiped} / ${idsToWipe.length}`);
    }
  }

  console.log(`\n🎉 Done! Wiped ${wiped} bad website URLs across all cities.`);
}

run();
