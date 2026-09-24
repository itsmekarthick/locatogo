export {};

async function testGreenhouse(slug: string): Promise<number> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return -1;
    const data = await res.json();
    return Array.isArray(data.jobs) ? data.jobs.length : 0;
  } catch {
    return -1;
  }
}

async function testAshby(slug: string): Promise<number> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return -1;
    const data = await res.json();
    return Array.isArray(data.jobs) ? data.jobs.length : 0;
  } catch {
    return -1;
  }
}

async function main() {
  const candidates: { name: string; city: string; country: string; type: "greenhouse" | "ashby"; slug: string }[] = [
    // US - SV / SF
    { name: "Figma", city: "San Francisco", country: "US", type: "greenhouse", slug: "figma" },
    { name: "Notion", city: "San Francisco", country: "US", type: "greenhouse", slug: "notion" },
    { name: "Databricks", city: "San Francisco", country: "US", type: "greenhouse", slug: "databricks" },
    { name: "Rippling", city: "San Francisco", country: "US", type: "greenhouse", slug: "rippling" },
    { name: "Scale AI", city: "San Francisco", country: "US", type: "greenhouse", slug: "scaleai" },
    { name: "Cloudflare", city: "San Francisco", country: "US", type: "greenhouse", slug: "cloudflare" },

    // US - NYC
    { name: "Datadog", city: "New York", country: "US", type: "greenhouse", slug: "datadog" },
    { name: "MongoDB", city: "New York", country: "US", type: "greenhouse", slug: "mongodb" },
    { name: "Ramp", city: "New York", country: "US", type: "ashby", slug: "ramp" },
    { name: "Squarespace", city: "New York", country: "US", type: "greenhouse", slug: "squarespace" },

    // US - Boston
    { name: "HubSpot", city: "Boston", country: "US", type: "greenhouse", slug: "hubspot" },
    { name: "Toast", city: "Boston", country: "US", type: "greenhouse", slug: "toast" },
    { name: "Klaviyo", city: "Boston", country: "US", type: "greenhouse", slug: "klaviyo" },

    // US - Austin
    { name: "SailPoint", city: "Austin", country: "US", type: "greenhouse", slug: "sailpoint" },
    { name: "BigCommerce", city: "Austin", country: "US", type: "greenhouse", slug: "bigcommerce" },

    // UK - London
    { name: "Wise", city: "London", country: "GB", type: "greenhouse", slug: "wise" },
    { name: "Revolut", city: "London", country: "GB", type: "greenhouse", slug: "revolut" },
    { name: "Starling Bank", city: "London", country: "GB", type: "greenhouse", slug: "starlingbank" },

    // Germany - Berlin
    { name: "Trade Republic", city: "Berlin", country: "DE", type: "greenhouse", slug: "traderepublic" },
    { name: "Contentful", city: "Berlin", country: "DE", type: "greenhouse", slug: "contentful" },
    { name: "Taxfix", city: "Berlin", country: "DE", type: "greenhouse", slug: "taxfix" },

    // France - Paris
    { name: "Alan", city: "Paris", country: "FR", type: "greenhouse", slug: "alan" },
    { name: "PayFit", city: "Paris", country: "FR", type: "greenhouse", slug: "payfit" },
    { name: "Swile", city: "Paris", country: "FR", type: "greenhouse", slug: "swile" },

    // Netherlands - Amsterdam
    { name: "Miro", city: "Amsterdam", country: "NL", type: "greenhouse", slug: "miro" },
    { name: "Bunq", city: "Amsterdam", country: "NL", type: "greenhouse", slug: "bunq" },

    // Canada - Toronto
    { name: "1Password", city: "Toronto", country: "CA", type: "ashby", slug: "1password" },
    { name: "Wealthsimple", city: "Toronto", country: "CA", type: "greenhouse", slug: "wealthsimple" },

    // Australia - Sydney
    { name: "Canva", city: "Sydney", country: "AU", type: "ashby", slug: "canva" },
    { name: "Immutable", city: "Sydney", country: "AU", type: "greenhouse", slug: "immutable" },

    // India - Top Tech
    { name: "Razorpay", city: "Bengaluru", country: "IN", type: "greenhouse", slug: "razorpay" },
    { name: "CRED", city: "Bengaluru", country: "IN", type: "greenhouse", slug: "cred" },
    { name: "Postman", city: "Bengaluru", country: "IN", type: "greenhouse", slug: "postman" },
    { name: "BrowserStack", city: "Mumbai", country: "IN", type: "greenhouse", slug: "browserstack" },
    { name: "Swiggy", city: "Bengaluru", country: "IN", type: "greenhouse", slug: "swiggy" },
  ];

  console.log(`Testing ${candidates.length} candidate companies...`);

  await Promise.all(
    candidates.map(async (c) => {
      let count = -1;
      if (c.type === "greenhouse") count = await testGreenhouse(c.slug);
      else if (c.type === "ashby") count = await testAshby(c.slug);
      if (count > 0) {
        console.log(`✅ [${c.country} / ${c.city}] ${c.name} (${c.slug}): ${count} live jobs`);
      }
    })
  );
}

main().catch(console.error);
