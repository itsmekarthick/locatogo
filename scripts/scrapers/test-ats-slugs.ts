async function testGreenhouse(slug: string): Promise<number> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, {
      headers: { "User-Agent": "Mozilla/5.0" },
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
    });
    if (!res.ok) return -1;
    const data = await res.json();
    return Array.isArray(data.jobs) ? data.jobs.length : 0;
  } catch {
    return -1;
  }
}

async function main() {
  const candidates: { name: string; type: "greenhouse" | "ashby"; slug: string }[] = [
    // Chicago
    { name: "Sprout Social", type: "greenhouse", slug: "sproutsocial" },
    { name: "ActiveCampaign", type: "greenhouse", slug: "activecampaign" },
    { name: "Enova", type: "greenhouse", slug: "enova" },
    { name: "Tempus", type: "greenhouse", slug: "tempus" },
    // Denver
    { name: "Palantir", type: "greenhouse", slug: "palantirtechnologies" },
    { name: "Gusto", type: "greenhouse", slug: "gusto" },
    { name: "Guild Education", type: "greenhouse", slug: "guildeducation" },
    { name: "Ibotta", type: "greenhouse", slug: "ibotta" },
    // Atlanta
    { name: "Calendly", type: "greenhouse", slug: "calendly" },
    { name: "Salesloft", type: "greenhouse", slug: "salesloft" },
    { name: "OneTrust", type: "greenhouse", slug: "onetrust" },
    // San Diego
    { name: "ClickUp", type: "greenhouse", slug: "clickup" },
    { name: "Seismic", type: "greenhouse", slug: "seismic" },
    { name: "TuSimple", type: "greenhouse", slug: "tusimple" },
    // London
    { name: "Monzo", type: "greenhouse", slug: "monzo" },
    { name: "Deliveroo", type: "greenhouse", slug: "deliveroo" },
    { name: "Synthesia", type: "ashby", slug: "synthesia" },
    { name: "Checkout.com", type: "greenhouse", slug: "checkout" },
    { name: "Wise", type: "greenhouse", slug: "transferwise" },
    // Toronto
    { name: "Shopify", type: "greenhouse", slug: "shopify" },
    { name: "Wealthsimple", type: "greenhouse", slug: "wealthsimple" },
    { name: "1Password", type: "greenhouse", slug: "1password" },
    { name: "Cohere", type: "ashby", slug: "cohere" },
    // Berlin
    { name: "Delivery Hero", type: "greenhouse", slug: "deliveryhero" },
    { name: "N26", type: "greenhouse", slug: "n26" },
    { name: "Trade Republic", type: "greenhouse", slug: "traderepublic" },
    { name: "Personio", type: "greenhouse", slug: "personio" },
    // Singapore
    { name: "Grab", type: "greenhouse", slug: "grab" },
    { name: "Carousell", type: "greenhouse", slug: "carousell" },
    { name: "Bolttech", type: "greenhouse", slug: "bolttech" },
  ];

  console.log("Testing ATS endpoints...");
  for (const c of candidates) {
    let count = -1;
    if (c.type === "greenhouse") count = await testGreenhouse(c.slug);
    else if (c.type === "ashby") count = await testAshby(c.slug);

    console.log(`${count >= 0 ? "✅" : "❌"} ${c.name} [${c.type}]: ${count} jobs`);
  }
}

main().catch(console.error);
