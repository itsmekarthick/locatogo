/**
 * probe-hyd-ats.ts
 */

const CANDIDATES: { name: string; tokens: string[] }[] = [
  { name: "Darwinbox", tokens: ["darwinbox"] },
  { name: "HighRadius", tokens: ["highradius"] },
  { name: "Zenoti", tokens: ["zenoti"] },
  { name: "Zaggle", tokens: ["zaggle"] },
  { name: "Keka HR", tokens: ["keka", "kekahr"] },
  { name: "Skyroot Aerospace", tokens: ["skyroot", "skyrootaerospace"] },
  { name: "Dhruva Space", tokens: ["dhruvaspace"] },
  { name: "Stan", tokens: ["stan", "stan-gaming"] },
  { name: "Cyient", tokens: ["cyient"] },
  { name: "DE Shaw India", tokens: ["deshaw", "de-shaw"] },
  { name: "Arcesium", tokens: ["arcesium"] },
  { name: "ServiceTitan", tokens: ["servicetitan"] },
  { name: "Pegasystems", tokens: ["pegasystems", "pega"] },
  { name: "OpenText", tokens: ["opentext"] },
  { name: "Micron Technology", tokens: ["micron"] },
  { name: "Qualcomm", tokens: ["qualcomm"] },
  { name: "AMD", tokens: ["amd"] },
  { name: "ServiceNow", tokens: ["servicenow"] },
  { name: "Uber", tokens: ["uber"] },
  { name: "Salesforce", tokens: ["salesforce"] },
  { name: "Swiggy", tokens: ["swiggy"] },
];

async function checkGreenhouse(token: string): Promise<number | null> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json.jobs) ? json.jobs.length : null;
  } catch {
    return null;
  }
}

async function checkLever(token: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json&limit=1`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json) && json.length > 0 ? json.length : null;
  } catch {
    return null;
  }
}

async function checkAshby(token: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json.jobs) ? json.jobs.length : null;
  } catch {
    return null;
  }
}

async function checkSmartRecruiters(token: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(token)}/postings?limit=1`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.totalFound === "number" ? json.totalFound : (Array.isArray(json.content) ? json.content.length : null);
  } catch {
    return null;
  }
}

async function main() {
  console.log("Probing Hyderabad companies across ATS APIs...\n");
  for (const c of CANDIDATES) {
    for (const t of c.tokens) {
      const gh = await checkGreenhouse(t);
      if (gh) console.log(`🎯 [GREENHOUSE] ${c.name} (${t}): ${gh} jobs -> https://boards.greenhouse.io/${t}`);
      const lev = await checkLever(t);
      if (lev) console.log(`🎯 [LEVER] ${c.name} (${t}): ${lev} jobs -> https://jobs.lever.co/${t}`);
      const ash = await checkAshby(t);
      if (ash) console.log(`🎯 [ASHBY] ${c.name} (${t}): ${ash} jobs -> https://jobs.ashbyhq.com/${t}`);
      const sr = await checkSmartRecruiters(t);
      if (sr) console.log(`🎯 [SMARTRECRUITERS] ${c.name} (${t}): ${sr} jobs -> https://careers.smartrecruiters.com/${t}`);
    }
  }
}

main().catch(console.error);
