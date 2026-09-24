async function testGreenhouse(slug: string): Promise<number> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(4000),
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
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return -1;
    const data = await res.json();
    return Array.isArray(data.jobs) ? data.jobs.length : 0;
  } catch {
    return -1;
  }
}

async function main() {
  const probe = [
    { name: "Tealium Inc", type: "greenhouse", slug: "tealiuminc" },
    { name: "Axos Bank", type: "greenhouse", slug: "axosbank" },
    { name: "Shield AI Lever", type: "ashby", slug: "shield-ai" },
    { name: "Lytx Inc", type: "greenhouse", slug: "lytxinc" },
    { name: "Mindbody", type: "greenhouse", slug: "mindbody" },
    { name: "Viasat Inc", type: "greenhouse", slug: "viasatinc" },
    { name: "Aetion", type: "greenhouse", slug: "aetion" },
    { name: "Housecall Pro", type: "greenhouse", slug: "housecallpro" },
    { name: "Housecall Pro Ashby", type: "ashby", slug: "housecallpro" },
  ];

  await Promise.all(
    probe.map(async (c) => {
      let count = -1;
      if (c.type === "greenhouse") count = await testGreenhouse(c.slug);
      else if (c.type === "ashby") count = await testAshby(c.slug);
      if (count > 0) {
        console.log(`✅ [${c.type.toUpperCase()}] ${c.name} (${c.slug}): ${count} live jobs`);
      }
    })
  );
}

main().catch(console.error);
