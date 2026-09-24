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
    // Amsterdam
    { name: "Adyen", type: "greenhouse", slug: "adyen" },
    { name: "MessageBird", type: "greenhouse", slug: "bird" },
    { name: "Elastic", type: "greenhouse", slug: "elastic" },
    { name: "GitLab", type: "greenhouse", slug: "gitlab" },

    // Dublin
    { name: "Workday", type: "greenhouse", slug: "workday" },
    { name: "Hubspot", type: "greenhouse", slug: "hubspot" },
    { name: "Tines", type: "ashby", slug: "tines" },

    // Dubai
    { name: "Yango", type: "greenhouse", slug: "yango" },
    { name: "Astra Tech", type: "greenhouse", slug: "astratech" },
    { name: "Bybit", type: "greenhouse", slug: "bybit" },

    // Tokyo
    { name: "SmartNews", type: "greenhouse", slug: "smartnews" },
    { name: "Woven", type: "greenhouse", slug: "woven-by-toyota" },
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
