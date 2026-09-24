import { detectBoard, fetchJobs } from "../../src/lib/jobs/providers";

const candidates: { name: string; url: string; city: string; country: string }[] = [
  // SF / Silicon Valley
  { name: "Snowflake", url: "https://boards.greenhouse.io/snowflake", city: "San Mateo", country: "US" },
  { name: "Palantir", url: "https://jobs.lever.co/palantir", city: "Palo Alto", country: "US" },
  { name: "Coinbase", url: "https://boards.greenhouse.io/coinbase", city: "San Francisco", country: "US" },
  { name: "DoorDash", url: "https://boards.greenhouse.io/doordash", city: "San Francisco", country: "US" },
  { name: "Pinterest", url: "https://boards.greenhouse.io/pinterest", city: "San Francisco", country: "US" },
  { name: "Roblox", url: "https://boards.greenhouse.io/roblox", city: "San Mateo", country: "US" },
  { name: "Okta", url: "https://boards.greenhouse.io/okta", city: "San Francisco", country: "US" },
  { name: "HashiCorp", url: "https://boards.greenhouse.io/hashicorp", city: "San Francisco", country: "US" },
  { name: "Box", url: "https://boards.greenhouse.io/box", city: "Redwood City", country: "US" },
  { name: "Twilio", url: "https://boards.greenhouse.io/twilio", city: "San Francisco", country: "US" },
  { name: "Anthropic", url: "https://jobs.ashbyhq.com/anthropic", city: "San Francisco", country: "US" },
  { name: "Perplexity", url: "https://jobs.ashbyhq.com/perplexity", city: "San Francisco", country: "US" },
  { name: "OpenAI", url: "https://jobs.ashbyhq.com/openai", city: "San Francisco", country: "US" },

  // Austin
  { name: "CrowdStrike", url: "https://boards.greenhouse.io/crowdstrike", city: "Austin", country: "US" },
  
  // Seattle
  { name: "Remitly", url: "https://boards.greenhouse.io/remitly", city: "Seattle", country: "US" },

  // London & Europe
  { name: "Monzo", url: "https://boards.greenhouse.io/monzo", city: "London", country: "GB" },
  { name: "Deliveroo", url: "https://boards.greenhouse.io/deliveroo", city: "London", country: "GB" },
  { name: "Checkout.com", url: "https://boards.greenhouse.io/checkout", city: "London", country: "GB" },
  { name: "Alan", url: "https://jobs.lever.co/alan", city: "Paris", country: "FR" },
  { name: "Qonto", url: "https://jobs.ashbyhq.com/qonto", city: "Paris", country: "FR" },

  // India
  { name: "Postman", url: "https://boards.greenhouse.io/postman", city: "Bengaluru", country: "IN" },
  { name: "Hasura", url: "https://boards.greenhouse.io/hasura", city: "Bengaluru", country: "IN" },
  { name: "BrowserStack", url: "https://jobs.lever.co/browserstack", city: "Bengaluru", country: "IN" },
  { name: "Razorpay", url: "https://jobs.lever.co/razorpay", city: "Bengaluru", country: "IN" },
];

async function main() {
  console.log("Probing Batch 2 Candidates...\n");
  for (const c of candidates) {
    const board = detectBoard(c.url);
    if (!board) {
      console.log(`❌ ${c.name}: Board detection failed for ${c.url}`);
      continue;
    }
    try {
      const jobs = await fetchJobs(board);
      const valid = jobs.filter((j) => j.title && j.applyUrl && j.applyUrl !== "#");
      console.log(`✅ ${c.name} (${c.city}, ${c.country}): ${board.provider} -> ${jobs.length} jobs (${valid.length} valid with direct apply)`);
    } catch (e: any) {
      console.log(`⚠️ ${c.name} (${board.provider}): ${e.message}`);
    }
  }
}

main().catch(console.error);
