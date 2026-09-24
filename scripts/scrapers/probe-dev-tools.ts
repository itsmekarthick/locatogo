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
  const candidates = [
    { name: "Postman", type: "greenhouse", slug: "postman" },
    { name: "Postman Ashby", type: "ashby", slug: "postman" },
    { name: "Notion", type: "ashby", slug: "notion" },
    { name: "Rippling", type: "ashby", slug: "rippling" },
    { name: "Retool", type: "ashby", slug: "retool" },
    { name: "Retool GH", type: "greenhouse", slug: "retool" },
    { name: "Vercel", type: "ashby", slug: "vercel" },
    { name: "Vercel GH", type: "greenhouse", slug: "vercel" },
    { name: "Supabase", type: "ashby", slug: "supabase" },
    { name: "Supabase GH", type: "greenhouse", slug: "supabase" },
    { name: "Linear", type: "ashby", slug: "linear" },
    { name: "Miro", type: "ashby", slug: "miro" },
    { name: "Miro GH", type: "greenhouse", slug: "realtimeboard" },
    { name: "Docker", type: "greenhouse", slug: "docker" },
    { name: "Github", type: "greenhouse", slug: "github" },
    { name: "GitLab", type: "greenhouse", slug: "gitlab" },
  ];

  for (const c of candidates) {
    let count = -1;
    if (c.type === "greenhouse") count = await testGreenhouse(c.slug);
    else if (c.type === "ashby") count = await testAshby(c.slug);
    if (count > 0) {
      console.log(`✅ [${c.type.toUpperCase()}] ${c.name} (${c.slug}): ${count} live jobs`);
    }
  }
}

main().catch(console.error);
